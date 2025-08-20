/*--------------------------------- 自定义配置 USERID必填 ---------------------------------*/
let seatSelect = []; // 没用 todo:增加自定义选座
let blockSelect = ["A2"]; // 自定义选区
let WEBHOOK_URL = ''; // 飞书webhook url
let MAX_SEAT_ID = 100; // ID最大值，超过的票不锁
let REFRESH_INTERVAL = 1000; // 刷新时间间隔 根据网络调整
let GROUP_NUM = 2; // 连坐数，>1时只找连坐锁
let TIMEOUT = 5000; // 等待锁票超时时间


/*--------------------------------- 勿修改 ---------------------------------*/
let isSuccess = false; // 是否成功
let successZone = "";
let successSeat = null;
let successId = "";
let successNum = 0;
let failedNum = 0;

let K_VALUE = "";
let BASE_URL = "";
let RD_ID = "";

let botRunning = false;
let mainLoopInterval;


// region 页面操作
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


function initEnv() {
    let k = getKValue();
    let baseUrl = getBaseUrl();
    let rdId = getrdId();
    K_VALUE = k;
    BASE_URL = baseUrl;
    RD_ID = rdId;
}

function parseSeatsFromHTML(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    const availableSeats = [];
    const seatCells = doc.querySelectorAll('td[data-info]');

    //超过max_seat_id的seat不加入列表
    let idx = 0;
    seatCells.forEach(cell => {
        if (idx > MAX_SEAT_ID) {
            return;
        }
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
        idx++;
    });

    return availableSeats;
}

function getGroupSeats(seats) {
    console.log("seats", seats);
    //筛选连坐 row一样 num连坐
    if (GROUP_NUM > 1) {
        for (let i = 0; i <= seats.length - GROUP_NUM; i++) {
            const potentialGroup = seats.slice(i, i + GROUP_NUM);
            
            const firstRow = potentialGroup[0].row;
            if (potentialGroup.every(seat => seat.row === firstRow)) {
                let isConsecutive = true;
                for (let j = 1; j < GROUP_NUM; j++) {
                    if (parseInt(potentialGroup[j].seatNum) !== parseInt(potentialGroup[0].seatNum) + j) {
                        isConsecutive = false;
                        break;
                    }
                }
                
                if (isConsecutive) {
                    console.log(`找到一组 ${GROUP_NUM} 连坐:`, potentialGroup);
                    return potentialGroup; // 找到立即返回
                }
            }
        }
        
        console.log(`未找到 ${GROUP_NUM} 个连续的座位。`);
        return []; // 未找到，返回空数组
    }
    // 如果 GROUP_NUM <= 1，直接返回单个座位的数组
    return seats.length > 0 ? [seats[0]] : [];
}

//endregion

//region 接口操作
async function getFixedPage(k, zone, round) {
    const url = `https://booking.thaiticketmajor.com/booking/3m/fixed.php?k=${k}&zone=${zone}&round=${round}`;
    let cookie = getCookie();

    const headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "Connection": "keep-alive",
        "Cookie": cookie,
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
        if (data.result) {
            successNum++;
        }else{
            failedNum++;
        }
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        return null;
    }
} 


async function sendLockRequest(seatInfoList,paymentFormParams) {
    const targetUrl = `https://booking.thaiticketmajor.com/booking/3m/bookingseats.php?k=${K_VALUE}`;
    const refererUrl = `https://booking.thaiticketmajor.com/booking/3m/fixed.php?k=${K_VALUE}&zone=${paymentFormParams.zone}&round=${RD_ID}`;

    // Add the rule before sending the request
    await new Promise(resolve => {
        chrome.runtime.sendMessage({
            action: 'addRefererRule',
            data: { targetUrl: targetUrl, refererUrl: refererUrl }
        }, response => {
            if (response && response.success) {
                console.log('Lock request rule added, proceeding with fetch.');
            } else {
                console.error('Failed to add lock request rule:', response ? response.error : 'No response');
            }
            resolve();
        });
    });

    const cookie = getCookie();

    const headers = {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Origin': 'https://booking.thaiticketmajor.com',
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
        'travelChild2':paymentFormParams.travelChild2,
        'enroll_val': paymentFormParams.enroll_val,
        'dval': paymentFormParams.dval, // 注意: 这个值可能是用户标识
        'companyid': paymentFormParams.companyid,
        'ks': paymentFormParams.ks,
        'inclvat': paymentFormParams.inclvat,
        'seatklist': seatklist // e.g. '8ee2c8a5a250fcdf14bc4454910e30d4,'
    });
    console.log("body", body);

    try {
        const response = await fetch(targetUrl, {
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
        if (data.result) {
            isSuccess = true;
            console.log("锁票成功");
            if (WEBHOOK_URL) {
                sendFeiShuMsg(WEBHOOK_URL, `[${new Date().toLocaleString()}]抢票成功 successBlock:${paymentFormParams.zone} successSeat:${seatlist}`);
            }
        }
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        return null;
    } finally {
        // Always remove the rule after the request is done
        chrome.runtime.sendMessage({ action: 'removeRefererRule' }, response => {
            if (response && response.success) {
                console.log('Lock request rule removed successfully.');
            } else {
                console.error('Failed to remove lock request rule:', response ? response.error : 'No response');
            }
        });
    }
}   
// endregion

// main
// consumer：从列表中获取座位并尝试锁定
async function tryLockSeat(seatsToLock, paymentFormParams) {
    // Reset counters for this attempt
    successNum = 0;
    failedNum = 0;

    let startTime = Date.now();
    for (let seat of seatsToLock) {
        sendValidateRequest(seat, paymentFormParams);
    }
    while (successNum + failedNum < seatsToLock.length) {
        await sleep(100);
        if (Date.now() - startTime > TIMEOUT) {
            console.error("Timeout: " + TIMEOUT + "ms");
            break;
        }
    }
    if (successNum == seatsToLock.length) {
        await sendLockRequest(seatsToLock, paymentFormParams);
    }
}


async function mainLoop() {
    if (!botRunning) return;
    console.log("Bot loop running...");

    initEnv();
    
    while(botRunning) { // 添加 while 循环
        if (!botRunning) break; 
        
        for (let zone of blockSelect) {
            if (!botRunning) break; 
            console.log(`Checking zone: ${zone}`);
            let data = await getFixedPage(K_VALUE, zone, RD_ID, BASE_URL);
            if (data) {
                let availableSeats = parseSeatsFromHTML(data);
                let paymentFormParams = getPaymentFormParams(data);
                
                let seatsToLock = getGroupSeats(availableSeats);
                if (seatsToLock.length > 0) {
                    console.log("Found seats to lock:", seatsToLock);
                    await tryLockSeat(seatsToLock, paymentFormParams);
                    if (isSuccess) {
                        stopBot();
                        return; // 使用 return 直接退出 mainLoop 函数
                    }
                } else {
                    console.log(`No available seats in zone ${zone}.`);
                }
            }
            await sleep(REFRESH_INTERVAL);
        }
    }
}

function startBot(config) {
    if (config) {
        blockSelect = config.blockSelect || ["A2"];
        GROUP_NUM = config.groupNum || 2;
        REFRESH_INTERVAL = config.refreshInterval || 1000;
        MAX_SEAT_ID = config.maxSeatId || 100;
        TIMEOUT = config.timeout || 5000;
        WEBHOOK_URL = config.webhookUrl || '';
        console.log("Configuration updated:", {
            blockSelect,
            GROUP_NUM,
            REFRESH_INTERVAL,
            MAX_SEAT_ID,
            TIMEOUT,
            WEBHOOK_URL
        });
    }

    if (!botRunning) {
        botRunning = true;
        console.log("ThaiTicket Bot started!");
        // sendFeiShuMsg(WEBHOOK_URL, "ThaiTicket Bot started!");
        mainLoop(); 
    }
}

function stopBot() {
    if (botRunning) {
        botRunning = false;
        isSuccess = false;
        console.log("ThaiTicket Bot stopped!");
        // sendFeiShuMsg(WEBHOOK_URL, "ThaiTicket Bot stopped!");
    }
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "startThaiticket") {
        startBot(request.config);
        sendResponse({status: "started"});
    } else if (request.action === "stopThaiticket") {
        stopBot();
        sendResponse({status: "stopped"});
    }
});


