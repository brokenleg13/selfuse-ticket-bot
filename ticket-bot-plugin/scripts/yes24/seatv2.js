/*--------------------------------- 自定义配置 USERID必填 ---------------------------------*/
let seatSelect = []; // 没用 todo:增加自定义选座
let blockSelect = [301,302,303,306,307,308,311,312,313,316,317,318,101,102,103,104,105,106]; // 自定义选区
let SEAT_MAX_CLICK_COUNT = 30; // 单个座位最大点击次数
let WEBHOOK_URL = ''; // 飞书webhook url
let USERID = ''; // 用户id 抓包自己看
let MAX_SEAT_ID = 9999; // 每个区刷到ID最大值，超过的票不锁  不需要筛ID请填9999


/*--------------------------------- 勿修改 ---------------------------------*/
let isSuccess = false; // 是否成功
let currentSeatLayer = null;
let blackList = [];
let concertcfg = {};// 存储当前页面的concertcfg
concertcfg.idCustomer = USERID // idCustomer

let seatQueue = [];// 可选座位队列
function addSeatToQueue(seat) {
    seatQueue.push(seat);
}

function getSeatFromQueue() {
    return seatQueue[0];
}

function removeSeatFromQueue() {
    seatQueue.shift()
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

async function sendSearchSeatRequest(block) {
    console.log(`[DEBUG] 开始发送请求，区块: ${block}`);

    // 检查必要参数
    if (!concertcfg.idHall || !concertcfg.idTime || !concertcfg.idCustomer) {
        console.error('[DEBUG] 缺少必要参数:', {
            idHall: concertcfg.idHall,
            idTime: concertcfg.idTime,
            idCustomer: concertcfg.idCustomer
        });
        return;
    }

    const url = 'https://ticket.yes24.com/OSIF/Book.asmx/GetBookWholeFN';
    let cookie = getCookie();

    console.log(`[DEBUG] Cookie长度: ${cookie ? cookie.length : 0}`);
    console.log(`[DEBUG] URL: ${url}`);

    const body = new URLSearchParams({
        idHall: concertcfg.idHall,
        idTime: concertcfg.idTime,
        block: block,
        channel: '1',
        idCustomer: concertcfg.idCustomer,
        idOrg: '1'
    });

    console.log(`[DEBUG] 请求体:`, body.toString());

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

    console.log(`[DEBUG] 准备发送fetch请求...`);

    // 发送请求
    fetch(url, {
        method: 'POST',
        headers: headers,
        body: body,
        credentials: 'include',
    })
        .then(response => response.text())
        .then(data => {
            console.log(`[DEBUG] 响应数据长度:`, data.length);
            parseResponse(data);
            console.log(`[YES24 info] Block ${block} 请求成功`);
        })
        .catch(err => {
            console.error(`[YES24 Error] Block ${block} 请求失败:`, err.message);
            console.error(`[DEBUG] 错误详情:`, err);
            // 如果是超时或网络错误，可以考虑重试
            if (err.message.includes('超时') || err.message.includes('Failed to fetch')) {
                console.log(`[YES24 info] Block ${block} 将在下次循环中重试`);
            }
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
                    //不在blacklst的加入，且座位号不超过200
                    if (!blackList.some(blackSeat => blackSeat === seatId)) {
                        addSeatToQueue(seat);
                        sendFeiShuMsg(WEBHOOK_URL,`刷到座位 block:${block} seat:${seat.id}`)
                    }
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
    console.log('[DEBUG] 开始获取用户信息...');

    const iframe = document.querySelector('iframe');
    if (!iframe) {
        console.error('[DEBUG] 未找到iframe元素');
        return;
    }

    console.log('[DEBUG] 找到iframe:', iframe.src);

    let src = iframe.src;
    //https://ticket.yes24.com/Pages/English/Sale/FnPerfSaleHtmlSeat.aspx?idTime=1366809&idHall=13219&block=0&stMax=10&pHCardAppOpt=0
    try {
        let idHall = src.split("idHall=")[1].split("&")[0];
        let idTime = src.split("idTime=")[1].split("&")[0];

        console.log('[DEBUG] 解析的参数:', { idHall, idTime });

        concertcfg.idHall = idHall;
        concertcfg.idTime = idTime;

        console.log('[DEBUG] 设置后的concertcfg:', concertcfg);
    } catch (error) {
        console.error('[DEBUG] 解析iframe URL失败:', error);
        console.error('[DEBUG] iframe src:', src);
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
            await sleep(300);
        }
        else {
            selectRange(1);
            await sleep(300);
        }
    }

    // 遍历找到block
    frame = theFrame();
    let seatLayerChildren = frame.getElementsByClassName("seat_layer")[0].children;
    for (let i = 0; i < seatLayerChildren.length; i++) {
        let seatLayerChild = seatLayerChildren[i];
        if (seatLayerChild.textContent.includes(block)) {
            seatLayerChild.click();
            await sleep(300);
            return;
        }
    }
    // 如果遍历完没有找到block，说明在另一个page
    if (block.toString().startsWith("1")) {
        selectRange(2);
        await sleep(300);
    }
    else {
        selectRange(1);
        await sleep(300);
    }
    frame = theFrame();
    seatLayerChildren = frame.getElementsByClassName("seat_layer")[0].children;
    for (let i = 0; i < seatLayerChildren.length; i++) {
        let seatLayerChild = seatLayerChildren[i];
        if (seatLayerChild.textContent.includes(block)) {
            seatLayerChild.click();
            await sleep(300);
            return;
        }
    }
}

async function getSeat(block, seatId) {
    let frame = theFrame();
    let seatArray = frame.getElementById("divSeatArray").children;
    for (let i = 0; i < seatArray.length; i++) {
        let seat = seatArray[i];
        // 大于200的不要
        if (seat.id === "t" + seatId.toString() && i > MAX_SEAT_ID) {
            sendFeiShuMsg(WEBHOOK_URL, `超过ID最大值，不锁票 block:${block} seat:${seatId} index:${i}`)
            blackList.push(seatId)
            removeSeatFromQueue();
            return false;
        }
    }
    // 尝试锁定座位
    for (let j = 0; j < SEAT_MAX_CLICK_COUNT; j++) {
        let frame = theFrame();
        let seat = frame.getElementById("t" + seatId.toString());
        console.error(seat)
        if (seat && !seat.className.includes("s13")) {
            // 如果seat的class不包含son，则点击 son说明已选中
            if (!seat.className.includes("son")) {
                seat.click();
            }
            await sleep(200);
            TampermonkeyClick();
            await sleep(1500);
            assertLockSuccess();
            if (isSuccess) {
                removeSeatFromQueue();
                return true;
            }
        }
        else {
            // 如果座位还是选中状态 刷新页面
            await enterPage(block);
        }
    }
    removeSeatFromQueue();
    return false;
}

// producer：搜索可用座位添加到列表
async function searchSeat() {
    getUserInfo();
    await sleep(1000);
    let i = 0;
    let requestCount = 0;
    await sleep(1000);
    while (!isSuccess) {
        if (seatQueue.length > 10) {
            await sleep(300);
            continue;
        }
        // 一直循环遍历blockSelect
        sendSearchSeatRequest(blockSelect[i]);
        i = (i + 1) % blockSelect.length;
        requestCount++;
        if (requestCount % 10 === 0) {
            requestCount = 0;
            await sleep(800);
        }
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
    selectRange(1);
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
    sendFeiShuMsg(WEBHOOK_URL, `抢票成功`);
    await sleep(1000);
    clickStepCtrlBtn03();
    await sleep(2000);
    clickStepCtrlBtn04();
    await sleep(1000);
    // openPayment();
}

lockSeat();
