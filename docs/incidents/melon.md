# Melon 卡点日志

记录方式见 [../incidents.md](../incidents.md)。新条目加在最上面。

### melon-try-again
- 日期 / 来源：2026-11，issue #28
- 现象：刷票时经常出现 “try again”，之后脚本不再刷新，用户无法及时得知。
- 信号：浏览器弹窗（alert）或页面文字，包含 `try again` / `잠시 후 다시`。以前弹窗被插件屏蔽后只在页面控制台留了一行日志，没有任何通知。
- 出现时的状态：通常是 `scanning`（轮询区域）。
- 处理：规则 `melon-try-again`，action `human`。弹窗被自动关闭，同时响提示音、推送“需要人工”、状态小框高亮。
- 验证：自动化测试 “blocked browser dialogs are forwarded…” 和 “page text matching a melon rule…”；**未实页验证**。
- 备注：还不清楚 try again 之后页面处于什么状态、脚本应该怎么自动恢复（等待？刷新？重新进入选座？）。下次碰到时请导出运行记录，补充 try again 前后的 `state`/`status`，再决定是否改成自动恢复。

### melon-error-occurred
- 日期 / 来源：2026-11，沿用旧版 alertPatterns
- 信号：页面文字 `error occurred`
- 处理：规则 `melon-error-occurred`，action `alert`。
- 验证：未实页验证。

### 选座后被弹出 / 停止没反应
- 日期 / 来源：2026-11，issue #30
- 现象：点停止没反应；刷到票后手动点“选座完成”被弹出。
- 原因：选座页在弹出窗口里，停止消息只发给当前窗口的当前标签页；抢到后没有标记成功，循环继续点区域。
- 处理：代码改动。停止/接管改为同步到所有页面（运行状态存储），选座页成功后 `ctx.success()` 停止扫描。见 `scripts/common/runtime.js`、`scripts/melonticket/seat.js`。
- 验证：自动化测试 “melon seat flow picks a seat…”；**未实页验证**。
