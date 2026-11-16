# Config

This directory keeps shared extension configuration and documents local
sensitive overrides.

- `config.js`: the single source of non-sensitive configuration shared by popup
  and content scripts:
  - `runtime`: framework defaults (stall timeout, page alert checks, Feishu
    event filter, status panel).
  - `interpark` / `melon` / `yes24`: per-platform defaults. A value filled in a
    booking card overrides the default with the same key.
  - `platforms.<platform>`: label, logo, form page, site/API URLs,
    `rules` (incident rules, see docs/incidents.md), and `fields` used to generate the card form.
  - `commonFields`: advanced fields shown on every platform card.

To add a tunable parameter: add its default under the platform, add a `fields`
entry, then read it in the script with `ctx.num("key", fallback)`.
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

## Captcha Service

The captcha recognition service is configured under `services.captcha`
(`baseUrl`, `endpoints`, `headers`, `timeoutMs`, `provider`) and called through
`scripts/common/captcha-client.js`. Page-specific behaviour, such as Interpark's
retry counts and confidence threshold, lives under `interpark.captchaOcr`.

See [docs/captcha-service.md](../../docs/captcha-service.md) for the API
contract, deployment, swapping in another OCR backend, and how to hook a page
up to it.
