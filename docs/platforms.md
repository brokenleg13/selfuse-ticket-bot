# 平台说明

各平台卡片字段、运行流程和注意事项。通用的启停/接管/通知见 [debug-guide.md](debug-guide.md)，参数默认值以 `ticket-bot-plugin/config/config.js` 为准。

## 通用

- 卡片保存在 `chrome.storage.sync`。飞书 Webhook、YES24 `idCustomer`、Interpark 联系人等敏感信息只放在卡片里，不要写进代码。
- 本地备注或临时复制的敏感信息可以放在 `ticket-bot-plugin/config/local.json`。这个文件被 git 忽略，插件也不会加载。
- `ticket-bot-plugin/_metadata/`（Chrome 生成）和 `ticket-bot-plugin/scripts/yes24/page.html`（YES24 调试快照）都被 git 忽略。
- 点 `编辑` 会回填已保存的配置；高级参数留空保存时保留原值。
- 更新插件代码后要在 `chrome://extensions/` 刷新插件，再刷新购票页。
- 不再需要油猴（Tampermonkey）脚本：弹窗屏蔽由 `scripts/common/beforeunload-blocker.js` 完成，需要在页面环境里点击的按钮由 `scripts/common/main-world.js` 交给插件后台注入执行。旧油猴脚本已从仓库删除，以前装过的可以在 Tampermonkey 里停用或删除。
- 一直用同一个目录加载插件，否则扩展 ID 变化后，之前的卡片看起来会“丢失”。

## Interpark（NOL World）

使用 NOL World 页面流程，配置、启停、验证码和后续确认页信息都通过插件卡片管理。页面为后台刷票，右下角状态小框显示进度。详细状态机、查询和选座规则见 [interpark-onestop-flow.md](interpark-onestop-flow.md)。

### 页面配置

- 在插件首页点击 `Interpark` 新建卡片，或在已有卡片上点 `编辑`。
- `演出 ID / 链接` 支持三种格式：
  - 完整 NOL 链接，例如 `https://world.nol.com/zh-CN/ticket/genre/CONCERT/products/26005759?placeCode=26000413`
  - `productId?placeCode=placeId`
  - `placeId/productId`
- `优先区域` 支持多个区域，用英文逗号分隔，例如 `001,004,025`。脚本会自动把 `1` 补成 `001`。
- `购票数量` 用于控制锁座和价格页选择的票数。
- `每轮间隔（毫秒）` 是一轮区域扫描结束后到下一轮的基础等待时间，默认 `2000`。
- `每轮随机抖动（毫秒）` 会叠加到每轮间隔上，默认 `600`，即实际等待约 `2000~2600ms`。
- `区域间隔（毫秒）` 是同一轮内从一个区域切到下一个区域前的等待时间，默认 `800`。
- `无指定区域时每轮最多扫描区域数` 只在 `优先区域` 为空时生效，默认扫页面列表前 `12` 个区域。
- `只刷前几排座位` 使用座位图视觉排计算，填 `0` 或留空表示不过滤；填 `3` 表示只尝试座位图从上到下前 3 排的可选座。
- `订购页超时重开（分钟）` 用于处理 Interpark 订购页有效期限制，默认 `9.5` 分钟；超过后会回到 NOL 演出详情页并重新开始订购流程，填 `0` 表示禁用。

### 联系人和确认页
自动填写联系人等信息

- `取票方式值`：默认可填 `24000`。
- `联系电话`
- `手机号`
- `Messenger 类型`：Wechat 使用 `SN004`。
- `Messenger ID`
- `填写确认信息后自动下一步`

姓名、生日、邮箱等账号固定信息不会被插件覆盖，仍以页面已带出的信息为准。

### 运行流程

1. 加载插件后，在 Interpark 卡片中保存演出、区域、轮询、联系人配置。
2. 打开对应 NOL 演出页。
3. 在插件首页点击该卡片的 `开始`。
4. 插件会模拟真实点击进入购票页、选择日期和时间。
5. 如果进入 `tickets.interpark.com/waiting` 排队页，插件会静默等待站点自动跳转，不会点击、刷新或开始刷座位。
6. 出现验证码时，优先调用验证码公共服务识别（见 [captcha-service.md](captcha-service.md)）；服务不可用或识别失败时等待人工输入。
7. 验证通过后，脚本按配置区域轮询座位接口并尝试锁座。
8. 只有接口锁座成功后，才进入对应座位详情区并点击该座位；接口没锁到时不会进入座位详情区，会等待下一轮。
9. 选座成功后进入价格、配送确认页，自动填写卡片中的联系人信息，停在支付前流程。
10. 如果配置了飞书机器人 Webhook，锁座或选座成功会发送包含区域、视觉排、座位号的消息。
11. 如果订购页运行超过配置的超时时间，会保持运行状态并跳回 NOL 演出详情页，随后自动重新点击购买，开始新的订购窗口。

### 点击方式

插件通过 `chrome.scripting.executeScript({ world: "MAIN" })` 在页面主世界执行点击和选座逻辑，不依赖油猴脚本。

### 新版 Onestop 要点

- 购买、下一步、完成选座、验证码提交/刷新使用组件范围内的结构选择器，验证码图片使用组件容器定位；不匹配翻译文案或翻译后的 `alt` / `aria-label`。按钮匹配不唯一时停止操作。日期、时间仍按显示值解析并与配置校验。
- 内容脚本覆盖 `/gates/*`、无尾斜杠的 `/onestop` 入口及其查询参数和子路由，等待网站自行初始化并进入场次页；后台兼容 SPA 跳转后 Chrome 消息仍携带初始入口地址的行为。

- 支持 `tickets.interpark.com/onestop/schedule` 和 `/onestop/seat`，旧版 `BookMain.asp` 分支继续保留。
- 新版按配置范围后台批量调用 `seatStatus` / `seatMeta`，每批最多 16 个区域；区域配置为空时每轮覆盖全场，旧版点击区域数上限不再限制新版查询。区域填接口区域码，例如 `004`，也支持完整 `001:004`；地图上的 `N3` 等文字不一定是接口区域码，未匹配时不会擅自扩大范围。
- 只有区域请求返回 403 才触发一次前台检查；普通网络错误重试，401 停止，429 按服务器要求退避。验证码走公共识别服务。异常检查后的恢复显示与正常后台扫描分离，不等待地图恢复动画。详细状态、查询和选座规则见 [新版业务流程](interpark-onestop-flow.md)。
- 日期和时间必须匹配卡片；支持页面的 `7:45 PM` 格式。前几排过滤使用新版元数据的行索引；多张票只选择同排、同票档连续座位或完整座位组。
- 新版预选走页面自带处理函数与 GraphQL 校验，确认进入 `step=price` 后按锁座数量自动选择票价。每组仅一种票价时自动继续，多种票价不猜测资格；到 `/onestop/payment` 后停止，联系人、条款和支付由用户确认。
- 更新后需要在 Chrome 扩展管理页重新加载插件，再刷新购票页。运行测试：`npm ci --prefix ticket-bot-plugin`，然后 `npm test --prefix ticket-bot-plugin`。

## YES24

- 脚本：`scripts/yes24/seatv2.js`。在选座页通过接口轮询配置区域，发现空座后直接调用接口锁座，成功后选座并进入付款。
- `YES24 用户 ID`（idCustomer）必填，在 YES24 卡片里填写。可以在选区接口的请求里找到 `idCustomer` 字段。
- `优先区域` 填区域 block，逗号分隔。
- 轮询间隔、随机抖动、失败黑名单、待锁队列、随机行为等参数都在卡片的高级设置里，默认值见 `config.js` 的 `yes24`。
- 接口返回 `Block=deny` 表示已被封禁，脚本停止并推送通知；返回 `-1` 表示频率过快，会自动休息。
- 锁座成功后，脚本选中座位、点击选座 iframe 里的“预订”按钮（在页面环境里点击，选择器在 `config.js` 的 `platforms.yes24.selectors.bookingButton`），再点下一步并拉起信用卡付款。点不到预订按钮时会响提示音、推送“需要人工”，请手动点击。
- `rules.json` 用于替换 YES24 的 antibot 脚本（`scripts/yes24/antibot.js`）。

## Melon（tkglobal）

- 演出页脚本 `scripts/melonticket/concert.js`：等待开售 → 选日期 → 选场次 → 点预约，之后交给选座弹窗。
- 选座弹窗脚本 `scripts/melonticket/seat.js`：等待安全验证码（人工输入）→ 按配置区域轮询 → 点第一个可选座位 → 下一步 → 推送成功并停止。
- `演出 ID / 链接` 可以填 prodId 或完整 Melon 链接；`优先区域` 填区域名的结尾部分，例如 `A`。
- 选座弹窗通常没有插件图标，用右下角状态小框的按钮接管或停止。
- 出现 `try again`（无论是页面文字还是浏览器弹窗）时，弹窗会被自动关闭，同时响提示音并推送“需要人工”。规则在 `config.js` 的 `platforms.melon.rules`，记录见 [incidents/melon.md](incidents/melon.md)。
- 如果下一步之后被退回选区页，重新点开始即可。

## 已停止维护

- ThaiTicket：代码在 `archive/thaiticket/`。
- YES24 v1（前端点选）：`archive/yes24-v1/seat.js`。
