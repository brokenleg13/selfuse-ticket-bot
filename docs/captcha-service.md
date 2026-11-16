# 验证码识别公共服务

验证码识别（文字 OCR、滑块缺口）是一个**可扩展的公共服务**，和具体购票页解耦：

```
购票页脚本 ──(自己决定何时识别、读哪张图、怎么回填)──▶ TicketBotCaptcha 客户端 ──HTTP──▶ 识别服务
                                                    scripts/common/captcha-client.js     默认 local-services/glm_ocr_service.py
```

- **服务**只负责“图片进、结果出”，不知道任何购票页。
- **客户端** `TicketBotCaptcha` 已加载到所有购票页，统一读取 `config.js` 的 `services.captcha` 配置。
- **页面接入不在本仓库统一做**。目前只有 Interpark 已经接入；Melon、YES24 或新页面需要识别时，由使用者的本地 Agent 在调试时按第 4 节自行接入。

---

## 1. API 约定（ticket-bot-captcha/1）

所有接口都是 JSON，图片字段接受 data URL（`data:image/png;base64,...`）或纯 base64。服务需要允许 CORS，因为请求直接从购票页发出。

### `GET /health`

```json
{ "ok": true, "api": "ticket-bot-captcha/1", "capabilities": ["ocr", "slider"], "cuda": true, "device": "..." }
```

### `POST /ocr` 文字验证码

请求：

| 字段 | 必填 | 说明 |
|---|---|---|
| `image` | 是 | 验证码图片 |
| `codeLength` | 否 | 期望长度；`0` 表示不限制。默认取服务启动参数 `--code-length`（6） |
| `charset` | 否 | `upper`（默认）/ `alpha` / `digits` / `alnum` / `any` |
| `prompt` | 否 | 自定义提示词（对大模型类 OCR 有效） |

响应：

```json
{ "ok": true, "text": "ABCDEF", "rawText": "ABC DEF", "elapsedMs": 320 }
```

识别结果长度不符合时返回 `ok: false` 和 `error: "Expected 6 letters, got 5."`，HTTP 状态码仍然是 200。

### `POST /slider` 滑块缺口

请求：`{ "image": "...", "conf": 0.7, "iou": 0.8 }`，`conf` 和 `iou` 都是 0~1 的可选值。

响应：

```json
{ "ok": true, "box": [x1, y1, x2, y2], "x": 182, "y": 40, "width": 52, "height": 52, "confidence": 0.93, "candidates": [] }
```

坐标基于**传入图片的像素**。页面脚本需要自己换算成滑块轨道上的拖动距离。框无效或置信度低于 `conf` 时返回 `ok: false`。

### `POST /slider/offset` 滑块初始偏移

请求同 `/slider`，响应包含 `offset` 和 `confidence`。

---

## 2. 客户端用法（页面脚本里）

```js
const r = await TicketBotCaptcha.recognizeText(dataUrl, { codeLength: 6, charset: "upper", timeoutMs: 3000 });
if (r.ok) { /* 回填 r.text */ } else { /* r.error：服务没开、超时、识别失败…… */ }

const s = await TicketBotCaptcha.detectSliderGap(dataUrl, { conf: 0.7 });
const h = await TicketBotCaptcha.health();
```

- 所有方法**都不会抛异常**，失败时返回 `{ ok: false, error }`。服务没启动时，页面脚本应该降级为人工处理（`ctx.pause("请手动输入验证码")`），不要卡死。
- `TicketBotCaptcha.endpointUrl("ocr")` 返回当前实际调用的地址，方便排查。

配置（`ticket-bot-plugin/config/config.js`）：

```js
services: {
    captcha: {
        provider: 'http',                       // 内置 HTTP provider
        baseUrl: 'http://127.0.0.1:17861',
        endpoints: { health: '/health', ocr: '/ocr', slider: '/slider', sliderOffset: '/slider/offset' },
        headers: {},                            // 需要时加自定义请求头
        timeoutMs: 3000,
    },
},
```

`endpoints` 里也可以写完整 URL，用来把不同能力指向不同服务。

---

## 3. 换成其他 OCR / 云端 API

推荐顺序：

1. **写一个实现上面 API 的本地代理（推荐）**：在 `local-services/` 加一个小服务，接收 `/ocr`、`/slider`，在服务内部调用云端 OCR，然后把 `services.captcha.baseUrl` 指向它。API Key 保存在本机代理里，不会进入购票页，也不用处理云端接口的 CORS。
2. **直接改地址**：如果第三方服务本来就兼容这个 API 并允许 CORS，只改 `baseUrl`、`endpoints`、`headers` 即可。不要把真实 API Key 提交进仓库。
3. **在脚本里注册 provider**：响应格式不兼容又不想写代理时，可以注册一个适配器：
   ```js
   TicketBotCaptcha.registerProvider("myocr", {
       async recognizeText(image, options) {
           // 调用其他服务，返回 { ok, text, rawText, error }
       },
   });
   // 再把 config.js 的 services.captcha.provider 改为 "myocr"
   ```
   没实现的方法会回退到内置 HTTP provider。

---

## 4. 给页面接入验证码（本地 Agent 调试时自己做）

接入前先用 CDP 在真实页面上确认下面几点，并写进该平台的流程文档：

| 要确认的事 | 说明 |
|---|---|
| 什么时候出现 | 用哪个元素或哪个接口返回判断验证码出现了（例如弹窗容器可见、接口返回 `CaptchaOpen`）。 |
| 读什么图 | 验证码 `<img>` 的选择器；如果图片是 canvas 或跨域图，要截图再裁剪（Interpark 的做法见 `captureElementAsDataUrl` 和后台的 `captureVisibleTab`）。 |
| 回填到哪里 | 输入框选择器；React/Vue 页面要用原生 setter 再派发 `input`/`change` 事件（参考 Interpark 的 `setInputValue`）。 |
| 怎么提交 | 提交按钮；提交后通过什么判断成功或失败（弹窗消失、错误文字）。 |
| 失败怎么办 | 刷新验证码重试几次；超过次数或服务不可用时 `ctx.pause()` 等人工处理，并推送通知。 |
| 滑块 | 截取的图片和页面上滑块轨道的比例换算；用真实鼠标事件拖动，带轻微抖动。 |

建议在流程里单独加一个状态（例如 `captcha`），并在 `stallTimeouts` 里把它设为 `0`，因为人工输入可能很慢。补测试时用 mock 的 `fetch` 返回识别结果，参考 `tests/interpark-onestop.test.cjs` 里的 OCR 测试。

**Interpark 的现有接入**（可以当范例）：`scripts/interpark/seat.js` 里的 `solveCaptchaWithLocalOcr`（文字）和 `requestSliderCaptchaRecognition`（滑块）。页面相关的参数在 `config.js` 的 `interpark.captchaOcr`：

| 参数 | 说明 |
|---|---|
| `enabled` | 是否先尝试自动识别 |
| `timeoutMs` | 单次识别超时，超时后走人工输入 |
| `retryIntervalMs` | 同一张验证码识别失败后的重试间隔 |
| `maxAttempts` | 最多自动识别几次 |
| `sliderConfidence` | 滑块识别置信度阈值 |
| `invalidRefreshDelayMs` | 结果非法或提示输入错误时，刷新验证码前后的等待 |
| `submitCheckDelayMs` | 提交后等待页面反馈的时间 |
| `codeLength` | 验证码长度（当前为 6 位大写字母） |

Interpark 的策略：结果不是 6 个字母或页面提示输入错误时，刷新验证码重试；服务不可用或超过次数时等待人工输入。滑块识别失败时保存调试截图、暂停，并推送飞书。

---

## 5. 部署默认服务（GLM-OCR + captcha-recognizer）

默认实现：文字用 [zai-org/GLM-OCR](https://github.com/zai-org/GLM-OCR)，滑块用 [chenwei-zhao/captcha-recognizer](https://github.com/chenwei-zhao/captcha-recognizer)，服务只监听本机。

### 环境要求

- Windows + PowerShell；Python 虚拟环境默认放在仓库根目录 `.venv`。
- 建议使用 NVIDIA 显卡和 CUDA 版 PyTorch。CPU 也能跑，但明显更慢。
- 首次启动需要能访问 Hugging Face 下载模型。

### 安装

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -U pip
# 按本机 CUDA 版本选择 PyTorch，例如：
.\.venv\Scripts\python.exe -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu126
.\.venv\Scripts\python.exe -m pip install -U transformers accelerate pillow protobuf sentencepiece tiktoken einops captcha-recognizer
```

### 启动

```powershell
.\local-services\start_glm_ocr_service.ps1
# 等价于：.\.venv\Scripts\python.exe local-services\glm_ocr_service.py
```

常用参数：`--port 17861`、`--code-length 6`、`--disable-glm`（只开滑块）、`--disable-slider`（只开文字 OCR）、`--device cpu`。

检查服务是否正常：

```powershell
Invoke-RestMethod http://127.0.0.1:17861/health
```

`capabilities` 里应该包含需要的能力。手动测试滑块接口：

```powershell
$image = [Convert]::ToBase64String([IO.File]::ReadAllBytes("TestImg\test.png"))
Invoke-RestMethod http://127.0.0.1:17861/slider -Method Post -ContentType "application/json" -Body (@{ image = $image } | ConvertTo-Json)
```

### 性能参考

模型加载后，GPU 上单张验证码通常几百毫秒内完成；首次启动加载模型需要更久。
