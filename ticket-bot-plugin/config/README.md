# Config

This directory keeps shared extension configuration and documents local
sensitive overrides.

- `config.js`: non-sensitive runtime constants shared by popup and content
  scripts.
- `local.json`: optional local-only notes or copied values. It is ignored by
  git and is not loaded by the extension.

Sensitive runtime values such as YES24 customer ID and Feishu webhook URLs are
stored through the popup in `chrome.storage.sync`, not hard-coded in automation
scripts.

## Interpark Delivery/Confirmation

`config.js` contains the fields used on the Delivery/Confirmation page:

- Interpark contact fields are stored per booking card: `phoneNo`, `mobileNo`, `snsChannel`, `snsId`, `autoNext`.
- Use `snsChannel=SN004` for WeChat.

The script leaves account-fixed fields alone, including name, birthday, and email.

## Local GLM-OCR Captcha Service

Interpark captcha OCR is configured in `config.js`:

- `interpark.captchaOcr.enabled`: try local OCR before waiting for manual input.
- `interpark.captchaOcr.serviceUrl`: default `http://127.0.0.1:17861/ocr`.
- `interpark.captchaOcr.sliderServiceUrl`: default `http://127.0.0.1:17861/slider`.
- `interpark.captchaOcr.timeoutMs`: request timeout. Keep this short so manual
  input remains the fallback when the service is not running.
- `interpark.captchaOcr.sliderConfidence`: confidence threshold for slider gap
  detection, default `0.7`.
- `interpark.captchaOcr.codeLength`: current captcha length, default `6`.

Start the local service from the repository root:

```powershell
.\local-services\start_glm_ocr_service.ps1
```

When a slider captcha appears and local slider OCR is missing, unavailable, or
returns a low-confidence/invalid box, the Interpark bot pauses and sends the
configured Feishu webhook notification with the failure reason.
