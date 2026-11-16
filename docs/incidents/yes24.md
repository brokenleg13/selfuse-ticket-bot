# YES24 卡点日志

记录方式见 [../incidents.md](../incidents.md)。新条目加在最上面。

### yes24-booking-button
- 日期 / 来源：2026-11，移除油猴脚本
- 现象：锁座成功后需要点击选座 iframe 里的“预订”按钮，以前由油猴脚本在页面环境里点击。
- 信号：`TicketBotMainWorld.click()` 返回失败（找不到元素 / iframe 不可访问）。
- 处理：代码改动，改由插件后台在页面环境里点击；失败时 `ctx.needHuman("没有点到预订按钮…")`。选择器在 `config.js` 的 `platforms.yes24.selectors.bookingButton`。
- 验证：自动化测试 “main-world click…”、“yes24 booking click…”；**未实页验证**。

### yes24-block-throttle
- 来源：原有逻辑
- 信号：座位接口返回 `Block=-1`（请求过快）。脚本上报 `ctx.observe("api", "Block=-1")`。
- 处理：代码自动长休息；规则 `yes24-block-throttle`，action `ignore`（只记录）。

### yes24-block-deny
- 来源：原有逻辑
- 信号：座位接口返回 `Block=deny`（被封禁）。
- 处理：代码设置停止原因并停止，推送“已被封禁（Block=deny），已停止刷票”；规则 `yes24-block-deny`，action `ignore`（避免重复推送）。

### 锁座失败码
- 信号：锁座接口失败时上报 `Lock <code> <message>`，目前**没有规则**，会记成 unhandled。
- 处理：代码对同一座位失败计数，超过次数加入临时黑名单。
- 待补：碰到具体失败码时，判断哪些需要叫人、哪些可以忽略，补成规则。
