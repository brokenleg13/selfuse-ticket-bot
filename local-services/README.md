# Local OCR Service

This folder contains the local captcha service used by the Chrome extension for
Interpark captchas. It supports GLM-OCR text captchas and
[chenwei-zhao/captcha-recognizer](https://github.com/chenwei-zhao/captcha-recognizer)
slider captchas.

## Dependencies

From the repository root:

```powershell
.\.venv\Scripts\python.exe -m pip install -U transformers accelerate pillow protobuf sentencepiece tiktoken einops captcha-recognizer
```

[chenwei-zhao/captcha-recognizer](https://github.com/chenwei-zhao/captcha-recognizer)
pulls in `onnxruntime`, `opencv-python`, and `shapely` for slider gap detection.
If this dependency is missing, the service can still start for `/ocr`, but
`/slider` returns an unavailable error and the extension falls back to pause +
notification.

## Start

From the repository root:

```powershell
.\.venv\Scripts\python.exe local-services\glm_ocr_service.py
```

Default endpoint:

- Health: `http://127.0.0.1:17861/health`
- OCR: `http://127.0.0.1:17861/ocr`
- Slider gap: `http://127.0.0.1:17861/slider`
- Slider offset: `http://127.0.0.1:17861/slider/offset`

The first startup loads `zai-org/GLM-OCR` into GPU memory. `GET /health` should
show `sliderEnabled: true` when slider support is ready. If the service is not
running, text captchas fall back to manual input; slider captchas pause the bot
and send the configured notification.

## Slider captcha API

The slider endpoints use the installed
[chenwei-zhao/captcha-recognizer](https://github.com/chenwei-zhao/captcha-recognizer)
package.

```powershell
$image = [Convert]::ToBase64String([IO.File]::ReadAllBytes("TestImg\test.png"))
Invoke-RestMethod http://127.0.0.1:17861/slider `
    -Method Post `
    -ContentType "application/json" `
    -Body (@{ image = $image } | ConvertTo-Json)
```

- `POST /slider` returns the detected gap `box`, `confidence`, `x`, `y`,
  `width`, `height`, and `candidates`.
- `POST /slider/offset` returns the detected initial slider `offset` and
  `confidence`.
- Both endpoints accept JSON with `image` or `dataUrl`. Optional `conf` and
  `iou` values must be between `0` and `1`; `/slider` defaults to `conf=0.7`.
- `/slider` returns `ok: false` for invalid boxes, zero-size boxes, or low
  confidence. The extension does not drag on these results.
- For testing only the slider API without loading GLM-OCR, start with
  `--disable-glm`.
