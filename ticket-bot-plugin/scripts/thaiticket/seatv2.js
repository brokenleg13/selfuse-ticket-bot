/*--------------------------------- 自定义配置 USERID必填 ---------------------------------*/
let seatSelect = []; // 没用 todo:增加自定义选座
let blockSelect = [306, 307, 308, 316, 317, 318,302,312,102,105,101,103,104,106]; // 自定义选区
let SEAT_MAX_CLICK_COUNT = 30; // 单个座位最大点击次数
let WEBHOOK_URL = 'https://open.feishu.cn/open-apis/bot/v2/hook/1b4f1f86-5ba8-4506-81b5-a025de08d4cd'; // 飞书webhook url
let USERID = 'N20250630175245a0a'; // 用户id 抓包自己看
let MAX_SEAT_ID = 200; // 站票区刷到ID最大值，超过的票不锁  不需要筛ID请填9999
let REFRESH_INTERVAL = 700; // 刷新时间间隔 根据网络调整


/*--------------------------------- 勿修改 ---------------------------------*/
let isSuccess = false; // 是否成功
let successZone = "";
let successSeat = null;
let successId = "";
let sendedIdList = [];

let K_VALUE = "";
let BASE_URL = "";
let RD_ID = "";

// region 队列 
let seatQueue = [];// 可选座位队列
let secondSeatQueue = [];// 被锁过的座位队列 碰运气
function addSeatToQueue(seat) {
    seatQueue.push(seat);
}

function getSeatFromQueue() {
    return seatQueue[0];
}

function popSeatFromQueue() {
    return seatQueue.shift()
}
// endregion


//region 页面操作
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
    // 直接触发自定义事件，而不是依赖storage事件
    const clickEvent = new CustomEvent('tampermonkey-click', {
        detail: { timestamp: Date.now() }
    });
    window.dispatchEvent(clickEvent);
}


function theFrame() {
    return window.frames[0].document;
}

function theTopWindow() {
    return window.document;
}

// 获取cookie
function getCookie() {
    let frame = theTopWindow();
    return frame.cookie;
}

// 获取iframe中的idHall, idTime, idCustomer
function getUserInfo() {

}

function getKValue() {
    const kElement = document.querySelector('input[name="k"]');
    if (kElement) {
        return kElement.value;
    }
    console.error('Could not find input element with name "k"');
    return null;
}

function getrdId() {
    const rdIdElement = document.getElementById("rdId").children;
    if (rdIdElement && rdIdElement.length > 0) {
        return rdIdElement[0].value;
    }
    console.error('Could not find input element with name "rdId"');
    return null;
}

function getBaseUrl() {
    const baseUrlElement = document.getElementsByClassName("mn-item");
    if (baseUrlElement && baseUrlElement.length > 0) {
        return baseUrlElement[0].baseURI;
    }
    console.error('Could not find input element with name "baseUrl"');
    return null;
}


// 断言锁定成功
function assertLockSuccess() {
    let frame = theTopWindow();
    const el = frame.querySelector('#StepCtrlBtn03');
    if (el && el.style.display === 'block') {
        console.log('✅ class 正确：m03 on');
        return true;
    } else {
        console.log('❌ class 不匹配');
        return false;
    }
}


// endregion

//region 接口操作

async function sendSearchSeatRequest(block) {

}

async function sendSeatLockRequest(block,seatId,sendmsg=false) {

}

function parseLayoutData(xmlString) {
    
}

function parseResponse(htmlstring) {
}
// endregion


//region 主流程
// producer：搜索可用座位添加到列表
async function searchSeat() {
    getUserInfo();
    await sleep(1000);
    let i = 0;
    let requestCount = 0;
    await sleep(1000);
    while (!isSuccess) {
        if (seatQueue.length > 0) {
            await sleep(10);
            continue;
        }
        if (isSuccess) {
            break;
        }
        // 一直循环遍历blockSelect
        sendSearchSeatRequest(blockSelect[i]);
        i = (i + 1) % blockSelect.length;
        requestCount++;
        await sleep(50);
        if (requestCount % 8 === 0) {
            requestCount = 0;
            await sleep(REFRESH_INTERVAL);
        }
    }
}

function initEnv() {
    let k = getKValue();
    let baseUrl = getBaseUrl();
    let rdId = getrdId();
    K_VALUE = k;
    BASE_URL = baseUrl;
    RD_ID = rdId;
}


// consumer：从列表中获取座位并尝试锁定
async function lockSeat() {
    console.log("bot is running");
    await sleep(3000);
    initEnv();
    console.log("baseUrl", BASE_URL);
    console.log("k", K_VALUE);
    console.log("rdId", RD_ID);
    await sleep(2000);
    let data = await getFixedPage(K_VALUE, "D1", RD_ID,BASE_URL);
    let seats = parseSeatsFromHTML(data);
    let paymentFormParams = getPaymentFormParams(data);
    console.log("seats", seats);
    console.log("paymentFormParams", paymentFormParams);
    // await sleep(2000);
    sendValidateRequest(seats[0],paymentFormParams);
    sendValidateRequest(seats[1],paymentFormParams);
    await sleep(2000);
    sendLockRequest([seats[0],seats[1]],paymentFormParams);
    await sleep(1000);
    sendLockRequest([seats[0],seats[1]],paymentFormParams);
    // await sleep(5000);
    // // getUserInfo();
    // searchSeat(); // 启动爬虫
    // selectRange(1);
    // while (!isSuccess) {
    //     if (seatQueue.length > 0) {
    //         let seat = getSeatFromQueue();
    //         if (seat) {
    //             sendSeatLockRequest(seat.block,seat.id,true)
    //         }
    //         popSeatFromQueue();
    //         await sleep(300)
    //     }else{
    //         await sleep(10);
    //     }
    //     // sendSeatLockRequest(102,3700229)
    //     // await sleep(500)
    // }
    // // 接口锁成功的处理一下选座
    // sendFeiShuMsg(WEBHOOK_URL, `[${new Date().toLocaleString()}]抢票成功 successBlock:${successBlock} successId:${successId}`);
    // await chooseSeatAndGotoPayment(successBlock,successId);
    // await sleep(1000);
    // clickStepCtrlBtn03();
    // await sleep(2000);
    // clickStepCtrlBtn04();
    // await sleep(1000);
    // openPayment();
}

lockSeat();


// endregion   

async function getFixedPage(k, zone, round) {
    const url = `https://booking.thaiticketmajor.com/booking/3m/fixed.php?k=${k}&zone=${zone}&round=${round}`;
    let cookie = getCookie();

    const headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "Connection": "keep-alive",
        "Cookie": cookie,
        "Referer": "https://booking.thaiticketmajor.com/booking/3m/zones.php?query=608",
        "sec-ch-ua": "\"Not;A=Brand\";v=\"99\", \"Google Chrome\";v=\"139\", \"Chromium\";v=\"139\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-User": "?1",
        "sec-gpc": "1",
        "Upgrade-Insecure-Requests": "1",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"
    };

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            return null;
        }

        const data = await response.text();
        return data;

    } catch (error) {
        console.error('Fetch error:', error);
        return null;
    }
}

function parseSeatsFromHTML(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    const availableSeats = [];
    const seatCells = doc.querySelectorAll('td[data-info]');

    seatCells.forEach(cell => {
        const seatDiv = cell.querySelector('div.seatuncheck');
        if (seatDiv) {
            const dataInfo = cell.getAttribute('data-info');
            try {
                const seatInfo = JSON.parse(dataInfo);
                const title = cell.getAttribute('title');
                if (title) {
                    const [row, seatNum] = title.split('-');
                    availableSeats.push({
                        seat: seatInfo.seat,
                        seatk: seatInfo.seatk,
                        title: title,
                        row: row,
                        seatNum: seatNum
                    });
                }
            } catch (e) {
                console.error("Failed to parse data-info JSON:", dataInfo, e);
            }
        }
    });

    return availableSeats;
}

function getPaymentFormParams(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const form = doc.getElementById('frmPayment');

    if (!form) {
        console.error('Payment form with id "frmPayment" not found.');
        return null;
    }

    const inputs = form.querySelectorAll('input');
    const params = {};

    inputs.forEach(input => {
        if (input.name) {
            params[input.name] = input.value;
        }
    });

    return params;
}

async function sendLockRequest(seatInfoList,paymentFormParams) {
    const url = `https://booking.thaiticketmajor.com/booking/3m/bookingseats.php?k=${K_VALUE}`;
    const cookie = getCookie();

    const headers = {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Origin': 'https://booking.thaiticketmajor.com',
        'Referer': `https://booking.thaiticketmajor.com/booking/3m/fixed.php?k=${K_VALUE}&zone=${paymentFormParams.zone}&round=${RD_ID}`,
        'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'Cookie': cookie
    };
    //DB-02-P*3000 *分割
    let seatlist = "";
    let pricelist = "";
    let seatklist = "";
    for (let seatInfo of seatInfoList) {
        let seatandprice = seatInfo.seat.split("*");
        seatlist += `${seatandprice[0]},`;
        pricelist += `${seatandprice[1]},`;
        seatklist += `${seatInfo.seatk},`;
    }
    console.log("seatlist", seatlist);
    console.log("pricelist", pricelist);
    console.log("seatklist", seatklist);
    const body = new URLSearchParams({
        'ehId': paymentFormParams.ehId,
        'curentdate': paymentFormParams.curentdate, // 注意: 这个值可能需要动态生成
        'max_payment': paymentFormParams.max_payment,
        'payment_cnt': paymentFormParams.payment_cnt,
        'paytype': paymentFormParams.paytype,
        'performance': paymentFormParams.performance,
        'pricelist': pricelist,
        'rdId': paymentFormParams.rdId,
        'seatlist': seatlist, // e.g. 'DG-21-P,'
        'showdate': paymentFormParams.showdate,
        'showtime': paymentFormParams.showtime,
        'venue': paymentFormParams.venue,
        'zone': paymentFormParams.zone, // e.g. 'D1'
        'zoneDesc': paymentFormParams.zoneDesc, // e.g. 'D1'
        'travelChild1': paymentFormParams.travelChild1,
        'travelChild2': paymentFormParams.travelChild2,
        'enroll_val': paymentFormParams.enroll_val,
        'dval': paymentFormParams.dval, // 注意: 这个值可能是用户标识
        'companyid': paymentFormParams.companyid,
        'ks': paymentFormParams.ks,
        'inclvat': paymentFormParams.inclvat,
        'seatklist': seatklist // e.g. '8ee2c8a5a250fcdf14bc4454910e30d4,'
    });
    console.log("body", body);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: body
        });

        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            return null;
        }

        const data = await response.json();
        console.log("Booking response:", data);
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        return null;
    }
}   

async function sendValidateRequest(seatInfo,paymentFormParams) {
    const url = `https://booking.thaiticketmajor.com/booking/3m/validateseat.php?k=${K_VALUE}&zw=${paymentFormParams.zone}`;
    const cookie = getCookie();

    const headers = {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Origin': 'https://booking.thaiticketmajor.com',
        'Referer': `https://booking.thaiticketmajor.com/booking/3m/fixed.php?k=${K_VALUE}&zone=${paymentFormParams.zone}&round=${RD_ID}`,
        'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'Cookie': cookie
    };

    // The body contains a field 'chkSeats[]' which needs special handling.
    const otherBodyParams = new URLSearchParams({
        'ehId': paymentFormParams.ehId,
        'curentdate': paymentFormParams.curentdate,
        'max_payment': paymentFormParams.max_payment,
        'payment_cnt': paymentFormParams.payment_cnt,
        'paytype': paymentFormParams.paytype,
        'performance': paymentFormParams.performance,
        'pricelist': paymentFormParams.pricelist,
        'rdId': paymentFormParams.rdId,
        'seatlist': paymentFormParams.seatlist,
        'showdate': paymentFormParams.showdate,
        'showtime': paymentFormParams.showtime,
        'venue': paymentFormParams.venue,
        'zone': paymentFormParams.zone,
        'zoneDesc': paymentFormParams.zoneDesc,
        'travelChild1': paymentFormParams.travelChild1,
        'travelChild2': paymentFormParams.travelChild2,
        'enroll_val': paymentFormParams.enroll_val,
        'dval': paymentFormParams.dval,
        'companyid': paymentFormParams.companyid,
        'ks': paymentFormParams.ks,
        'inclvat': paymentFormParams.inclvat,
        'row': seatInfo.row,
        'seat': seatInfo.seatNum,
        'book_type': 'fix'
    });

    const body = `chkSeats[]=${encodeURIComponent(seatInfo.seat)}&${otherBodyParams.toString()}`;

    console.log("body", body);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: body
        });

        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            return null;
        }

        const data = await response.json();
        console.log("Validate seat response:", data);
        successSeat = seatInfo;
        successId = seatInfo.seatNum;
        successZone = paymentFormParams.zone;
        isSuccess = true;
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        return null;
    }
} 