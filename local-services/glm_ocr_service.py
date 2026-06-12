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
from urllib.parse import urlparse
from typing import Any

from PIL import Image
import torch
from transformers import AutoModelForImageTextToText, AutoProcessor

try:
    from captcha_recognizer.slider import Slider
except Exception as import_error:  # pragma: no cover - optional runtime dependency
    Slider = None  # type: ignore[assignment]
    SLIDER_IMPORT_ERROR: Exception | None = import_error
else:
    SLIDER_IMPORT_ERROR = None


DEFAULT_MODEL = "zai-org/GLM-OCR"
DEFAULT_PROMPT = (
    "Read the captcha. It contains exactly six uppercase English letters and no digits. "
    "Return only the 6 letters."
)


def normalize_code(text: str, length: int = 6) -> str:
    return "".join(re.findall(r"[A-Z]", (text or "").upper()))[:length]


def decode_image_bytes(image_value: str) -> bytes:
    if not image_value:
        raise ValueError("Missing image data.")

    value = image_value.strip()
    if value.startswith("data:"):
        _, value = value.split(",", 1)

    return base64.b64decode(value, validate=False)


def decode_image(image_value: str) -> Image.Image:
    return Image.open(io.BytesIO(decode_image_bytes(image_value))).convert("RGB")


def read_optional_float(payload: dict[str, Any], key: str, default: float) -> float:
    value = payload.get(key)
    if value is None or value == "":
        return default
    result = float(value)
    if not 0 <= result <= 1:
        raise ValueError(f"{key} must be between 0 and 1.")
    return result


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


class SliderCaptchaRecognizer:
    def __init__(self) -> None:
        if Slider is None:
            raise RuntimeError(f"captcha-recognizer is unavailable: {SLIDER_IMPORT_ERROR}")

        started = time.perf_counter()
        self.model = Slider()
        self.lock = threading.Lock()
        self.load_seconds = time.perf_counter() - started

    def detect_gap(self, image_data: bytes, conf: float, iou: float) -> tuple[list[float], float, list[dict[str, Any]]]:
        original_image = self.model.image_to_array(image_data)
        image_height = float(original_image.shape[0])
        results = self.model.predict(original_image, conf=conf, iou=iou, imgsz=640)
        boxes = results[0][0].tolist() if results else []
        candidates: list[dict[str, Any]] = []

        for box in boxes:
            x1, y1, x2, y2, confidence = [float(value) for value in box[:5]]
            width = x2 - x1
            height = y2 - y1
            if confidence < conf or width <= 1 or height <= 1:
                continue
            candidates.append({
                "box": [round(x1, 2), round(y1, 2), round(x2, 2), round(y2, 2)],
                "confidence": round(confidence, 4),
                "x": round(x1, 2),
                "y": round(y1, 2),
                "width": round(width, 2),
                "height": round(height, 2),
            })

        upper_candidates = [
            candidate for candidate in candidates
            if candidate["box"][3] <= image_height * 0.85
        ]
        pool = upper_candidates or candidates
        if not pool:
            return [], 0.0, candidates

        # Full slider screenshots contain both the draggable piece and the gap.
        # The gap is the right-side candidate; the leftmost candidate is usually the piece.
        selected = max(pool, key=lambda candidate: candidate["box"][0])
        return selected["box"], float(selected["confidence"]), candidates

    def recognize(
        self,
        image_data: bytes,
        mode: str = "identify",
        conf: float = 0.7,
        iou: float = 0.8,
    ) -> dict[str, Any]:
        normalized_mode = (mode or "identify").lower().strip()
        offset_modes = {"offset", "identify_offset", "identify-offset"}
        identify_modes = {"identify", "gap", "box"}
        if normalized_mode not in offset_modes | identify_modes:
            raise ValueError(f"Unsupported slider mode: {mode}")

        started = time.perf_counter()
        with self.lock:
            if normalized_mode in offset_modes:
                offset, confidence = self.model.identify_offset(
                    source=image_data,
                    conf=conf,
                    iou=iou,
                    show=False,
                )
                elapsed = time.perf_counter() - started
                return {
                    "ok": confidence > 0,
                    "mode": "offset",
                    "offset": round(float(offset), 2),
                    "confidence": round(float(confidence), 4),
                    "elapsedMs": round(elapsed * 1000),
                    "model": "captcha-recognizer/slider",
                }

            box, confidence, candidates = self.detect_gap(image_data, conf, iou)

        elapsed = time.perf_counter() - started
        normalized_box = [round(float(value), 2) for value in box] if box else []
        box_width = 0.0
        box_height = 0.0
        if normalized_box:
            x1, y1, x2, y2 = normalized_box
            box_width = round(x2 - x1, 2)
            box_height = round(y2 - y1, 2)
        is_valid = bool(normalized_box) and confidence >= conf and box_width > 1 and box_height > 1
        result: dict[str, Any] = {
            "ok": is_valid,
            "mode": "identify",
            "box": normalized_box,
            "confidence": round(float(confidence), 4),
            "candidates": candidates,
            "elapsedMs": round(elapsed * 1000),
            "model": "captcha-recognizer/slider",
        }
        if normalized_box:
            x1, y1, x2, y2 = normalized_box
            result.update({
                "x": x1,
                "y": y1,
                "width": box_width,
                "height": box_height,
            })
        if not is_valid:
            result["error"] = (
                f"Slider gap detection below threshold or invalid box "
                f"(confidence={float(confidence):.4f}, threshold={conf}, box={normalized_box})."
            )
        return result


def make_handler(
    recognizer: GlmOcrRecognizer | None,
    slider_recognizer: SliderCaptchaRecognizer | None,
    code_length: int,
):
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
            request_path = urlparse(self.path).path.rstrip("/") or "/"
            if request_path == "/health":
                self.write_json({
                    "ok": True,
                    "glmEnabled": recognizer is not None,
                    "model": recognizer.model_name if recognizer else None,
                    "loadMs": round(recognizer.load_seconds * 1000) if recognizer else 0,
                    "sliderEnabled": slider_recognizer is not None,
                    "sliderLoadMs": round(slider_recognizer.load_seconds * 1000) if slider_recognizer else 0,
                    "cuda": torch.cuda.is_available(),
                    "device": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "cpu",
                })
                return
            self.write_json({"ok": False, "error": "Not found"}, status=404)

        def do_POST(self) -> None:  # noqa: N802
            request_path = urlparse(self.path).path.rstrip("/") or "/"
            if request_path == "/ocr":
                self.handle_ocr()
                return
            if request_path in {"/slider", "/slider/identify", "/slider/offset", "/captcha-slider"}:
                self.handle_slider(request_path)
                return

            self.write_json({"ok": False, "error": "Not found"}, status=404)

        def read_payload(self) -> dict[str, Any]:
            content_length = int(self.headers.get("Content-Length", "0"))
            if content_length <= 0:
                return {}
            return json.loads(self.rfile.read(content_length).decode("utf-8"))

        def handle_ocr(self) -> None:
            if recognizer is None:
                self.write_json({"ok": False, "error": "GLM-OCR recognizer is disabled."}, status=503)
                return

            try:
                payload = self.read_payload()
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

        def handle_slider(self, request_path: str) -> None:
            if slider_recognizer is None:
                self.write_json({"ok": False, "error": "captcha-recognizer slider is unavailable."}, status=503)
                return

            try:
                payload = self.read_payload()
                image_data = decode_image_bytes(payload.get("image") or payload.get("dataUrl") or "")
                mode = payload.get("mode") or ("offset" if request_path == "/slider/offset" else "identify")
                result = slider_recognizer.recognize(
                    image_data=image_data,
                    mode=mode,
                    conf=read_optional_float(payload, "conf", 0.7),
                    iou=read_optional_float(payload, "iou", 0.8),
                )
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
    parser.add_argument("--disable-glm", action="store_true", help="Start without loading the GLM-OCR model.")
    parser.add_argument(
        "--disable-slider",
        action="store_true",
        help="Start without loading captcha-recognizer slider support.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    recognizer: GlmOcrRecognizer | None = None
    if args.disable_glm:
        print("GLM-OCR model loading disabled.")
    else:
        print(f"Loading {args.model} on {args.device}...")
        recognizer = GlmOcrRecognizer(
            model_name=args.model,
            device=args.device,
            dtype=args.dtype,
            max_new_tokens=args.max_new_tokens,
            code_length=args.code_length,
        )
        print(f"Model loaded in {recognizer.load_seconds:.2f}s.")

    slider_recognizer: SliderCaptchaRecognizer | None = None
    if args.disable_slider:
        print("captcha-recognizer slider loading disabled.")
    else:
        print("Loading captcha-recognizer slider model...")
        try:
            slider_recognizer = SliderCaptchaRecognizer()
        except Exception as error:  # pragma: no cover - startup diagnostics
            print(f"Slider model unavailable: {type(error).__name__}: {error}")
        else:
            print(f"Slider model loaded in {slider_recognizer.load_seconds:.2f}s.")

    server = ThreadingHTTPServer(
        (args.host, args.port),
        make_handler(recognizer, slider_recognizer, args.code_length),
    )
    print(f"GLM-OCR service listening at http://{args.host}:{args.port}")
    print("Health: GET /health | OCR: POST /ocr { image: dataUrl }")
    print("Slider: POST /slider { image: dataUrl } | POST /slider/offset { image: dataUrl }")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Stopping GLM-OCR service.")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
