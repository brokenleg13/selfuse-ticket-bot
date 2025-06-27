/*--------------------------------- 自定义配置 USERID必填 ---------------------------------*/
let seatSelect = []; // 没用 todo:增加自定义选座
let blockSelect = [301,302,303,304,305,306,307,308,309,310,311,312,313,314,315,316,317,318,319,320,101,102,103,104,105,106]; // 自定义选区
let SEAT_MAX_CLICK_COUNT = 5; // 座位最大点击次数
let WEBHOOK_URL = ''; // 飞书webhook url
let USERID = ''; // 用户id 抓包自己看

/*--------------------------------- 勿修改 ---------------------------------*/
let isSuccess = false; // 是否成功
let concertcfg = {};// 存储当前页面的concertcfg
concertcfg.idCustomer = USERID // 固定idCustomer 抓包自己看
let currentSeatLayer = null;

let seatQueue = [];// 可选座位队列
function addSeatToQueue(seat) {
    seatQueue.push(seat);
}

function getSeatFromQueue() {
    return seatQueue.shift();
}

function getConcertId() {
    let url = window.location.href;
    let concertId = url.split("=")[1];
    return concertId;
}

async function selectDate(data) {
    let date = data.date;
    let time = data.time;
    if (date) {
        document.getElementById(date).click();
        await sleep(500);
        if (time) {
            console.log("time", time);
            console.log(document.getElementsByTagName("li"));
            let lis = document.getElementsByTagName("li");
            for (let i = 0; i < lis.length; i++) {
                if (lis[i].innerText.includes(time)) {
                    lis[i].click();
                }
            }
        }
    }
    document.getElementById("btnSeatSelect").click();
}

function TampermonkeyClick() {
    localStorage.setItem("CLICK_NOW", "YES");
}


function theFrame() {
    return window.frames[0].document;
}

function theTopWindow() {
    return window.document;
}

function sendSearchSeatRequest(block) {
    const url = 'https://ticket.yes24.com/OSIF/Book.asmx/GetBookWholeFN';
    let cookie = getCookie();

    const body = new URLSearchParams({
        idHall: concertcfg.idHall,
        idTime: concertcfg.idTime,
        block: block,
        channel: '1',
        idCustomer: concertcfg.idCustomer,
        idOrg: '1'
    });

    const headers = {
        'Host': 'ticket.yes24.com',
        'Connection': 'keep-alive',
        'Content-Length': '85',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': navigator.userAgent,
        'Accept': 'application/xml, text/xml, */*; q=0.01',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Origin': 'https://ticket.yes24.com',
        'Referer': `https://ticket.yes24.com/Pages/English/Sale/FnPerfSaleHtmlSeat.aspx?idTime=${concertcfg.idTime}&idHall=${concertcfg.idHall}&block=${block}&stMax=10&pHCardAppOpt=0`,
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Cookie': cookie
    };

    fetch(url, {
        method: 'POST',
        headers: headers,
        body: body,
        credentials: 'include'
    })
        .then(response => response.text())
        .then(data => {
            parseResponse(data);
            console.log('[YES24 info]search seat request sent');
        })
        .catch(err => {
            console.error('[YES24 Error]', err);
        });
}

function parseResponse(xmlString) {
    // 使用正则表达式解析XML，避免使用DOMParser
    
    // 获取 Block 值
    const blockMatch = xmlString.match(/<Block>(.*?)<\/Block>/);
    const block = blockMatch ? blockMatch[1] : null;

    // 获取 BlockSeat 内容
    const blockSeatMatch = xmlString.match(/<BlockSeat>(.*?)<\/BlockSeat>/);
    const blockSeatData = blockSeatMatch ? blockSeatMatch[1] : "";
    
    if (blockSeatData) {
        // 使用 ^ 分割每个座位数据
        const seats = blockSeatData.split('^');
        
        seats.forEach(seatData => {
            if (seatData.trim()) {
                // 使用 @ 分割座位信息，第一个是座位ID
                const seatInfo = seatData.split('@');
                if (seatInfo.length > 0) {
                    const seatId = seatInfo[0];
                    
                    let seat = {};
                    seat.id = seatId;
                    seat.block = block;
                    addSeatToQueue(seat);
                }
            }
        });
    }
}

// 获取cookie
function getCookie() {
    let frame = theTopWindow();
    return frame.cookie;
}

// 获取iframe中的idHall, idTime, idCustomer
function getUserInfo() {
    const iframe = document.querySelector('iframe');
    if (iframe) {
        let src = iframe.src;
        //https://ticket.yes24.com/Pages/English/Sale/FnPerfSaleHtmlSeat.aspx?idTime=1366809&idHall=13219&block=0&stMax=10&pHCardAppOpt=0
        let idHall = src.split("idHall=")[1].split("&")[0];
        let idTime = src.split("idTime=")[1].split("&")[0];
        concertcfg.idHall = idHall;
        concertcfg.idTime = idTime;
    }
}

function clickStepCtrlBtn03() {
    let frame = theTopWindow();
    frame.getElementById("StepCtrlBtn03").children[1].click();
}
function clickStepCtrlBtn04() {
    let frame = theTopWindow();
    frame.getElementById("StepCtrlBtn04").children[1].click();
}

// 拉起信用卡支付
function openPayment() {
    let frame = theTopWindow();
    frame.getElementById("rdoPays2").click();
    frame.getElementById("cbxUserInfoAgree").click();
    frame.getElementById("cbxCancelFeeAgree").click();
    frame.getElementById("StepCtrlBtn05").children[1].click();
}

// 断言锁定成功
function assertLockSuccess() {
    let frame = theTopWindow();
    const el = frame.querySelector('#StepCtrlBtn03');
    if (el && el.style.display === 'block') {
        console.log('✅ class 正确：m03 on');
        isSuccess = true;
    } else {
        console.log('❌ class 不匹配');
    }
}

//选内场/看台 
function selectRange(idx) {
    if (isSuccess) {
        return;
    }
    let frame = theFrame();
    if (idx == 1) {
        // 看台页面
        if (frame.getElementById("grade_지정석")) {
            frame.getElementById("grade_지정석").click()
            currentSeatLayer = 1;
        }
    } else {
        // 内场页面
        if (frame.getElementById("grade_스탠딩")) {
            frame.getElementById("grade_스탠딩").click()
            currentSeatLayer = 2;
        }
    }
}

async function enterPage(block) {
    let frame = theFrame();
    let seatLayer = frame.getElementsByClassName("seat_layer");
    
    // 检查seatLayer是否存在且不为空
    if (!seatLayer || seatLayer.length === 0) {
        // 如果block为1开头为内场 打开内场page
        if (block.toString().startsWith("1")) {
            selectRange(2);
            await sleep(500);
        }
        else {
            selectRange(1);
            await sleep(500);
        }
    }
    
    // 遍历找到block
    frame = theFrame();
    let seatLayerChildren = frame.getElementsByClassName("seat_layer")[0].children;
    for (let i = 0; i < seatLayerChildren.length; i++) {
        let seatLayerChild = seatLayerChildren[i];
        if (seatLayerChild.textContent.includes(block)) {
            seatLayerChild.click();
            await sleep(500);
            return;
        }
    }
    // 如果遍历完没有找到block，说明在另一个page
    selectRange(currentSeatLayer == 1 ? 2 : 1);
    await sleep(500);
    frame = theFrame();
    seatLayerChildren = frame.getElementsByClassName("seat_layer")[0].children;
    for (let i = 0; i < seatLayerChildren.length; i++) {
        let seatLayerChild = seatLayerChildren[i];
        if (seatLayerChild.textContent.includes(block)) {
            seatLayerChild.click();
            await sleep(500);
            return;
        }
    }
}

async function getSeat(block, seatId) {
    // 尝试锁定座位
    for (let j = 0; j < SEAT_MAX_CLICK_COUNT; j++) {
        let frame = theFrame();
        let seat = frame.getElementById("t"+seatId.toString());
        if (!seat.className.includes("s13")) {
            // 如果seat的class不包含son，则点击 son说明已选中
            if (!seat.className.includes("son")) {
                seat.click();
            }
            await sleep(200);
            TampermonkeyClick();
            await sleep(200);
            assertLockSuccess();
            if (isSuccess) {
                return true;
            }
        }
        else {
            // 如果座位还是选中状态 刷新页面
            enterPage(block);
            await sleep(200);
        }
        await sleep(300);
    }
    return false;
}

// producer：搜索可用座位添加到列表
async function searchSeat() {
    getUserInfo();
    await sleep(1000);
    let i = 0;
    await sleep(1000);
    while (!isSuccess) {
        if (seatQueue.length > 10) {
            await sleep(300);
            continue;
        }
        // 一直循环遍历blockSelect
        sendSearchSeatRequest(blockSelect[i]);
        await sleep(300);
        i = (i + 1) % blockSelect.length;
    }
}

// consumer：从列表中获取座位并尝试锁定
async function lockSeat() {
    let concertId = getConcertId();
    let data = await get_stored_value(concertId);
    await sleep(3000);
    selectDate(data);
    await sleep(2000);
    searchSeat(); // 启动爬虫
    while (!isSuccess) {
        if (seatQueue.length > 0) {
            let seat = getSeatFromQueue();
            if (seat) {
                await enterPage(seat.block);
                await getSeat(seat.block, seat.id);
            }
        }
        await sleep(100);
    }
    sendFeiShuMsg(WEBHOOK_URL,"抢票成功");
    await sleep(1000);
    clickStepCtrlBtn03();
    await sleep(2000);
    clickStepCtrlBtn04();
    await sleep(1000);
    // openPayment();
}

lockSeat();
