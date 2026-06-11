# Local OCR Service

This folder contains the local GLM-OCR service used by the Chrome extension for
Interpark captchas.

## Start

From the repository root:

```powershell
.\.venv\Scripts\python.exe local-services\glm_ocr_service.py
```

Default endpoint:

- Health: `http://127.0.0.1:17861/health`
- OCR: `http://127.0.0.1:17861/ocr`

The first startup loads `zai-org/GLM-OCR` into GPU memory. If the service is not
running, the extension leaves the captcha for manual input.
