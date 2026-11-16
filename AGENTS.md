# AGENTS.md

本仓库是一个 Chrome MV3 抢票辅助插件（Interpark / YES24 / Melon）。任何 AI Agent 在这里工作前先读本文件，详细操作见 [`docs/debug-guide.md`](docs/debug-guide.md)。

## 硬性规则

- **绝对不要**点击付款、提交订单、确认支付，也不要替用户填写或提交支付信息。实页验证最多走到付款页之前，并由用户确认。
- 不要把用户的飞书 Webhook、YES24 idCustomer、联系人、Cookie、账号信息写进代码、测试、日志或提交记录。测试用的页面片段要先脱敏。
- 不要修改 `archive/`（已停止维护的代码）。
- 修改后必须运行 `npm test --prefix ticket-bot-plugin`，全部通过才算完成。
- 不要主动 commit / push，除非用户明确要求。

## 代码地图

| 路径 | 作用 |
|---|---|
| `ticket-bot-plugin/config/config.js` | **唯一的配置来源**：各平台默认参数、表单字段、站点/接口 URL、页面异常提示关键字、通知事件。 |
| `ticket-bot-plugin/scripts/common/runtime.js` | 通用运行框架：开始/停止/接管/继续、运行状态同步、卡住检测、页面提示检测、状态小框、飞书推送。 |
| `ticket-bot-plugin/scripts/<平台>/` | 各平台业务步骤，只写“页面上该做什么”。 |
| `ticket-bot-plugin/popup/` | 插件弹窗；平台表单的高级字段由 `popup/module/fields.js` 按 config 生成。 |
| `ticket-bot-plugin/scripts/common/status-panel.js` | 状态小框组件：显示平台在 `createBot({ states })` 里声明的状态机步骤、当前状态、历史和 接管/继续/停止 按钮。 |
| `ticket-bot-plugin/scripts/common/sound.js` | 提示音组件 `TicketBotSound`：经后台 `offscreen/sound.html` 播放，失败时用页面 Web Audio。 |
| `ticket-bot-plugin/scripts/common/main-world.js` | `TicketBotMainWorld.click(selector, { frameIndex })`：需要在页面环境里点击的按钮交给后台注入执行。不要再引入油猴脚本。 |
| `ticket-bot-plugin/scripts/common/captcha-client.js` | 验证码识别公共客户端 `TicketBotCaptcha`，只负责调用识别服务；页面接入由各平台脚本自己写（见 `docs/captcha-service.md`）。 |
| `local-services/` | 默认的本地验证码识别服务（`ticket-bot-captcha/1` API）。 |
| `ticket-bot-plugin/background.js` | Service Worker：Referer 规则、主世界执行、截图、飞书推送转发。 |
| `ticket-bot-plugin/tests/` | jsdom 测试（`node --test`）。 |
| `ticket-bot-plugin/scripts/common/journal.js` | 运行记录（状态、弹窗、命中的规则、unhandled、错误），插件首页可导出。 |
| `docs/incidents.md`、`docs/incidents/<平台>.md` | 卡点记录与迭代修复流程，以及各平台已知卡点。 |
| `docs/platforms.md` | 各平台卡片字段、流程、注意事项。 |
| `docs/captcha-service.md` | 验证码服务 API、部署、换 OCR、页面接入清单。 |
| `docs/interpark-onestop-flow.md` | Interpark 新版流程的完整业务说明，可作为新流程文档范例。 |

## 改动约定

- 可调的数字/文字放进 `config.js`，脚本里用 `ctx.num()` / `ctx.value()` 读取，不要硬编码。
- 提示文字统一用中文，写成“结果：详情”，多项用“，”分隔，结尾不加句号，例如“锁座成功：区域 004，2 排，12 号”。
- 只有关键结果才推送飞书：成功用 `ctx.success()`，需要人工用 `ctx.needHuman()` / `ctx.pause()`，自动停止用 `ctx.stop()`。过程信息（刷到座位、单次锁座失败、重试等）只用 `ctx.status()` 显示在小框。不要自己拼时间、平台名，`formatMessage` 会统一加上。
- 新参数要同时加默认值和 `platforms.<平台>.fields` 字段定义；表单和“编辑时留空不覆盖”的逻辑会自动生效。
- 平台流程中的每个循环都要检查 `ctx.isActive(gen)`。
- 需要人工处理时用 `ctx.pause()`，结束用 `ctx.success()` / `ctx.stop()`，交给下一页面用 `ctx.handoff()`。
- 流程里“等人操作”的位置（手动输入验证码、找不到按钮需要手点等）调用 `ctx.needHuman(原因)`：响提示音、推送、小框高亮，同一状态只提醒一次。
- 新增或修改流程状态时，同步更新 `createBot({ states: [...] })` 里的状态机声明（按流程顺序，`step: false` 表示不进步骤条），状态小框会自动显示。
- 需要给页面加验证码识别时，按 `docs/captcha-service.md` 第 4 节在平台脚本里接入 `TicketBotCaptcha`，不要改服务 API；要换 OCR 后端时改 `services.captcha` 配置或写兼容代理。
- 只改与问题相关的平台文件；改动 `runtime.js` 需要同时更新 `tests/runtime.test.cjs`。

## 用户发来“购票页出问题”时

先要运行记录：让用户在插件首页点“📄 导出运行记录”。按 `docs/incidents.md` 第 3 节处理 `unhandled` / `error` 条目，能用规则解决的加规则（`config.js` 的 `platforms.<平台>.rules`），不能的改代码并用 `ctx.observe()` 上报新信号；**每次修复都要在 `docs/incidents/<平台>.md` 记一条**。

按 `docs/debug-guide.md` 第 3 节执行：通过 CDP（`http://127.0.0.1:9222`）连上用户的 Chrome → 根据状态小框和 `state ->` 日志定位步骤 → 对照 DOM 修改 → 用脱敏片段补测试 → `npm test` 全部通过 → 交付改动文件清单、原因和用户的验证步骤。
