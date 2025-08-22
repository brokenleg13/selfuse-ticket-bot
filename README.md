<div align="center">
    <h1>EasyConcertKorea</h1>
<br>
</div>

# FolkDes:

## 2025-08-25 update
### feat:
- 更新ThaiTicket抢票助手，增加自定义配置页面和手动启停

### How to use
- 点击ThaiTicket页面先配置抢票信息
    - Sections：要抢的分区
    - Left Right Block：定义分区在舞台左侧还是右侧，用于策略1找到中心座位，不填时默认按座位序号从小到大抢票
    - 舞台侧面区域：定义哪些是在侧面的，对于侧面舞台优先抢靠舞台内侧的票
    - Group Size：抢连号用
    - Refresh Interval：刷新页面间隔时间
    - 中心排数下限，中心排数上限：定义策略1、2优先抢的座位范围，0-40%则优先筛选前40%的座位查询
    - 中心列数下限、中心列数上限:定义策略1需要优先筛选的列数，配合Left Right Block可以找到靠近舞台的座位，同样也可以通过只配置这个来选某个区正中间的位置比如配置25%-75%
    - TimeOut：等待请求超时时间
    - WebHook：飞书机器人通知地址
    - 策略：目前定义了三种策略

- 配置完成后点击保存，进入抢票页面在选区页面点击Start即可开始刷票（不要进到具体区的选座页面）
- 如果刷新过快被判定为脚本需要手动点击任意选区输入验证码解除再回到选区页面重新点Start
- 抢票成功机器人通知后需要手动去对应选区选座然后进入下一步付款，如果遇到提示座位被锁或者无法进入付款页面多刷新重选一下


## 2025-06-27 update
- 换了个更高效的方法，接口直接爬取座位数据；
需要打开`ticket-bot-plugin/scripts/yes24/seatv2.js`文件手动填写USERID
- USERID可在选区接口里查到，idCustomer字段即是

## First Update
### feat：
- YES24刷票自用适配版 twice抢票适配
- 配合油猴脚本实现锁座一直到信用卡付款操作
- 填写WEBHOOK_URL可实现刷票成功飞书通知

### how to use
- ticket-bot-plugin文件夹拖到chrome插件安装，按照源项目步骤配置
- 添加TampermonkeyScript目录下的两个油猴脚本并启用
- 部分配置项请看 ticket-bot-plugin/scripts/yes24/seat.js 文件开头自行修改
- 点开Booking后进入选座网站将自动运行脚本

## :notebook: Description :notebook:

This Chrome extension streamlines the process of finding and booking concert tickets on popular Korean platforms. such as <a href="https://tkglobal.melon.com/main/index.htm?langCd=EN">Melon Ticket</a>, <a href="http://ticket.yes24.com/English">Yes24</a> and <a href="https://www.globalinterpark.com/?lang=en">Interpark</a>. The extension includes a user-friendly popup with the ability to register for automatic booking. Once a concert page is opened, the extension automates the process, ensuring a hassle-free experience in securing a seat for the event.

> [!NOTE]
> This extension is designed for use on the global versions of the platforms and may not be compatible with the Korean versions.

## :cd: Usage :cd:

- Clone the repository.
- Load the extension in Chrome via `chrome://extensions/` and select "Load unpacked."
- Open the extension popup and register for automatic booking on the global versions of Melon Ticket, Yes24, and Interpark.
- Upon visiting a supported concert page on the global version of the platforms, the extension automates the booking process.

> [!CAUTION]
> Using this extension for automated booking may lead to a ban on the respective platforms. It is important to note that the developers of this extension are not responsible for any account bans or consequences that may arise from using the automated booking feature. Use at your own discretion.

## Development

### Popup and Form
- `form`: HTML, CSS, and JavaScript for the main popup form.
- `interparkForm`, `melonticketForm`, `yes24Form`: Platform-specific registration forms.
- `mainPage`: HTML, CSS, and JavaScript for the main extension popup.

### Script for Auto Booking
- `melonticket`, `yes24`, `interpark `: JavaScript logic for executing auto booking on each site.
- `common`: Utility scripts shared across platforms.

## :camera_flash: Demo video :camera_flash:

![Demo of the chrome extension](./assets/demo.gif)

## Credits

* <strong><a href="https://github.com/BastienBoymond">Bastien Boymond</a></strong>
