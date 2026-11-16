# Interpark 卡点日志

记录方式见 [../incidents.md](../incidents.md)。新条目加在最上面。新版流程的完整规则见 [../interpark-onestop-flow.md](../interpark-onestop-flow.md)。

### interpark-http-403 / 401 / 429
- 来源：2026-09 新版 Onestop
- 信号：新版后台查询失败，脚本上报 `ctx.observe("api", "HTTP <status> <error>")`。
- 处理（代码）：403 触发一次前台检查（可能出现拼图验证码，需要时请求人工）；401 停止并提示重新登录；429 按服务器要求退避；其他错误重试。
- 规则：`interpark-http-403/401/429`，action `ignore`（只记录，代码已处理）。其他状态码没有规则，会记成 unhandled。
- 验证：自动化测试覆盖 403 和 429 分支。

### 验证码需要人工
- 信号：本地识别服务不可用、识别次数用完、拼图验证码识别失败、区域点击未生效。
- 处理（代码）：`ctx.needHuman(...)`，响提示音、推送、小框高亮。
- 验证：文字验证码识别有自动化测试；拼图验证码**未完整实页验证**。

### 浏览器弹窗
- 信号：网站的 alert/confirm 会被自动关闭并上报为 `dialog`。目前**没有 Interpark 专用规则**，所有弹窗都会推送“浏览器弹窗（已自动关闭）”并记成 unhandled。
- 待补：碰到具体弹窗时，补规则区分“需要叫人”和“可以忽略”。
