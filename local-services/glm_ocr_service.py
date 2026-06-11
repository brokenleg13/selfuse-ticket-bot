"""Local GLM-OCR captcha service.

Runs a small HTTP API around zai-org/GLM-OCR using Transformers directly.
The Chrome extension can call this service on localhost; if it is not running,
the extension falls back to manual captcha entry.
"""

from __future__ import annotations

import argparse
import base64
import io
import json
import re
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

from PIL import Image
import torch
from transformers import AutoModelForImageTextToText, AutoProcessor


DEFAULT_MODEL = "zai-org/GLM-OCR"
DEFAULT_PROMPT = (
    "Read the captcha. It contains exactly six uppercase English letters and no digits. "
    "Return only the 6 letters."
)


def normalize_code(text: str, length: int = 6) -> str:
    return "".join(re.findall(r"[A-Z]", (text or "").upper()))[:length]


def decode_image(image_value: str) -> Image.Image:
    if not image_value:
        raise ValueError("Missing image data.")

    value = image_value.strip()
    if value.startswith("data:"):
        _, value = value.split(",", 1)

    raw = base64.b64decode(value, validate=False)
    return Image.open(io.BytesIO(raw)).convert("RGB")


class GlmOcrRecognizer:
    def __init__(
        self,
        model_name: str,
        device: str,
        dtype: str,
        max_new_tokens: int,
        code_length: int,
    ) -> None:
        self.model_name = model_name
        self.device = device
        self.max_new_tokens = max_new_tokens
        self.code_length = code_length
        self.lock = threading.Lock()

        torch_dtype = {
            "bfloat16": torch.bfloat16,
            "float16": torch.float16,
            "float32": torch.float32,
        }.get(dtype, torch.bfloat16)

        started = time.perf_counter()
        self.processor = AutoProcessor.from_pretrained(model_name, trust_remote_code=True)
        self.model = AutoModelForImageTextToText.from_pretrained(
            model_name,
            dtype=torch_dtype,
            device_map=device,
            trust_remote_code=True,
        )
        self.model.eval()
        self.load_seconds = time.perf_counter() - started

    def recognize(self, image: Image.Image, prompt: str | None = None) -> dict[str, Any]:
        messages = [{
            "role": "user",
            "content": [
                {"type": "image", "image": image},
                {"type": "text", "text": prompt or DEFAULT_PROMPT},
            ],
        }]
        text = self.processor.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True,
        )

        started = time.perf_counter()
        with self.lock:
            inputs = self.processor(text=[text], images=[image], return_tensors="pt")
            inputs = {
                key: value.to("cuda") if hasattr(value, "to") and self.device.startswith("cuda") else value
                for key, value in inputs.items()
            }
            with torch.inference_mode():
                output = self.model.generate(
                    **inputs,
                    max_new_tokens=self.max_new_tokens,
                    do_sample=False,
                )
            if self.device.startswith("cuda"):
                torch.cuda.synchronize()

        prompt_length = inputs["input_ids"].shape[-1]
        generated = output[:, prompt_length:]
        raw_text = self.processor.batch_decode(generated, skip_special_tokens=True)[0].strip()
        elapsed = time.perf_counter() - started
        code = normalize_code(raw_text, self.code_length)
        return {
            "ok": len(code) == self.code_length,
            "text": code,
            "rawText": raw_text,
            "elapsedMs": round(elapsed * 1000),
            "model": self.model_name,
        }


def make_handler(recognizer: GlmOcrRecognizer, code_length: int):
    class Handler(BaseHTTPRequestHandler):
        server_version = "TicketBotGlmOcr/1.0"

        def end_headers(self) -> None:
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            super().end_headers()

        def do_OPTIONS(self) -> None:  # noqa: N802
            self.send_response(204)
            self.end_headers()

        def do_GET(self) -> None:  # noqa: N802
            if self.path.rstrip("/") == "/health":
                self.write_json({
                    "ok": True,
                    "model": recognizer.model_name,
                    "loadMs": round(recognizer.load_seconds * 1000),
                    "cuda": torch.cuda.is_available(),
                    "device": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "cpu",
                })
                return
            self.write_json({"ok": False, "error": "Not found"}, status=404)

        def do_POST(self) -> None:  # noqa: N802
            if self.path.rstrip("/") != "/ocr":
                self.write_json({"ok": False, "error": "Not found"}, status=404)
                return

            try:
                content_length = int(self.headers.get("Content-Length", "0"))
                payload = json.loads(self.rfile.read(content_length).decode("utf-8"))
                image = decode_image(payload.get("image") or payload.get("dataUrl") or "")
                prompt = payload.get("prompt")
                result = recognizer.recognize(image, prompt)
                if len(result["text"]) != code_length:
                    result["ok"] = False
                    result["error"] = f"Expected {code_length} letters, got {len(result['text'])}."
                self.write_json(result)
            except Exception as error:  # pragma: no cover - runtime diagnostics
                self.write_json({
                    "ok": False,
                    "error": f"{type(error).__name__}: {error}",
                }, status=500)

        def write_json(self, payload: dict[str, Any], status: int = 200) -> None:
            data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def log_message(self, fmt: str, *args: Any) -> None:
            print(f"[{time.strftime('%H:%M:%S')}] {self.address_string()} {fmt % args}")

    return Handler


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run local GLM-OCR captcha service.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=17861)
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--device", default="cuda" if torch.cuda.is_available() else "cpu")
    parser.add_argument("--dtype", choices=["bfloat16", "float16", "float32"], default="bfloat16")
    parser.add_argument("--max-new-tokens", type=int, default=16)
    parser.add_argument("--code-length", type=int, default=6)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    print(f"Loading {args.model} on {args.device}...")
    recognizer = GlmOcrRecognizer(
        model_name=args.model,
        device=args.device,
        dtype=args.dtype,
        max_new_tokens=args.max_new_tokens,
        code_length=args.code_length,
    )
    print(f"Model loaded in {recognizer.load_seconds:.2f}s.")
    server = ThreadingHTTPServer((args.host, args.port), make_handler(recognizer, args.code_length))
    print(f"GLM-OCR service listening at http://{args.host}:{args.port}")
    print("Health: GET /health | OCR: POST /ocr { image: dataUrl }")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Stopping GLM-OCR service.")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
