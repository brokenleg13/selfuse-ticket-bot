<div align="center">
    <h1>EasyConcertKorea</h1>
<br>
</div>

## FolkDes:

### 2025-06-27 update
- 换了个更高效的方法，接口直接爬取座位数据；
需要打开`ticket-bot-plugin/scripts/yes24/seatv2.js`文件手动填写USERID
- USERID可在选区接口里查到，idCustomer字段即是

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
