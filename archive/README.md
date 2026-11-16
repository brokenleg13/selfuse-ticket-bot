# Archive

这里存放已停止维护的代码，插件不会加载这些文件，仅供参考或自行恢复。

- `thaiticket/`：ThaiTicketMajor 抢票脚本与配置页（2026-11 停止维护）。原路径为 `ticket-bot-plugin/scripts/thaiticket/`、`ticket-bot-plugin/popup/thaiticketForm/`。
- `yes24-v1/seat.js`：YES24 旧版前端点选脚本，已被 `scripts/yes24/seatv2.js`（接口刷座）取代，manifest 早已不再加载。

恢复方法：把目录移回原路径，并在 `manifest.json`、`popup/mainPage` 中重新注册。注意旧代码未接入 `scripts/common/runtime.js` 框架。
