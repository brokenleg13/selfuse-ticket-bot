/*--------------------------------- 自定义配置 USERID必填 ---------------------------------*/
let seatSelect = []; // 没用 todo:增加自定义选座
let blockSelect = ["A2"]; // 自定义选区
let WEBHOOK_URL = ''; // 飞书webhook url
let MAX_SEAT_ID = 100; // ID最大值，超过的票不锁
let REFRESH_INTERVAL = 1000; // 刷新时间间隔 根据网络调整
let GROUP_NUM = 2; // 连坐数，>1时只找连坐锁
let TIMEOUT = 5000; // 等待锁票超时时间

let STRATEGY1_ENABLED = true;
let STRATEGY2_ENABLED = true;
let STRATEGY3_ENABLED = true;


let leftBlock = ["A1","B1","C1"];
let rightBlock = ["A2","B3","C2"];


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
    const rowCounts = {};
    const rowPhysicalIndex = {};
    let physicalIndexCounter = 0;
    const seatIndexInRow = {}; // To track the index of each seat within its row
    const seatCells = doc.querySelectorAll('td[data-info]');

    seatCells.forEach(cell => {
        const title = cell.getAttribute('title');
        if (title) {
            const [row, seatNumStr] = title.split('-');

            // Assign a physical index to each new row found
            if (rowPhysicalIndex[row] === undefined) {
                physicalIndexCounter++;
                rowPhysicalIndex[row] = physicalIndexCounter;
            }

            // Initialize or increment the index for the current row
            if (seatIndexInRow[row] === undefined) {
                seatIndexInRow[row] = 0;
            }
            seatIndexInRow[row]++;
            const currentIndexInRow = seatIndexInRow[row];

            // Update total row counts
            if (rowCounts[row]) {
                rowCounts[row]++;
            } else {
                rowCounts[row] = 1;
            }

            // Check if the seat is available
            const seatDiv = cell.querySelector('div.seatuncheck');
            if (seatDiv) {
                const dataInfo = cell.getAttribute('data-info');
                try {
                    const seatInfo = JSON.parse(dataInfo);
                    availableSeats.push({
                        seat: seatInfo.seat,
                        seatk: seatInfo.seatk,
                        title: title,
                        row: row,
                        seatNum: seatNumStr,
                        indexInRow: currentIndexInRow,
                        physicalRowIndex: rowPhysicalIndex[row]
                    });
                } catch (e) {
                    console.error("Failed to parse data-info JSON:", dataInfo, e);
                }
            }
        }
    });

    return { availableSeats, rowCounts, rowPhysicalIndex };
}   

function getGroupSeats(seats, zone, rowCounts, rowPhysicalIndex) {
    if (GROUP_NUM <= 1) {
        if (leftBlock.includes(zone) && seats.length > 0) {
            return [seats[seats.length - 1]];
        }
        return seats.length > 0 ? [seats[0]] : [];
    }

    // 1. Group seats by row
    const seatsByRow = seats.reduce((acc, seat) => {
        if (!acc[seat.row]) acc[seat.row] = [];
        acc[seat.row].push(seat);
        return acc;
    }, {});

    // ** crucial fix: sort seats within each row by their physical index **
    for (const row in seatsByRow) {
        seatsByRow[row].sort((a, b) => a.indexInRow - b.indexInRow);
    }

    // 2. Separate rows into priority and other
    const sortedRows = Object.keys(seatsByRow).sort((a, b) => rowPhysicalIndex[a] - rowPhysicalIndex[b] );
    const priorityRows = sortedRows.filter(row => rowPhysicalIndex[row] <= 5);
    const otherRows = sortedRows.filter(row => rowPhysicalIndex[row] > 5)

    // --- Priority 1: Center seats in the first 5 rows ---
    if (STRATEGY1_ENABLED) {
        let result = findCenterGroupInRows(priorityRows, seatsByRow, rowCounts, zone);
        if (result) {
            console.log("策略1命中: 在前5排中间区域找到座位。", result);
            return result;
        }
    }

    // --- Priority 2: Any other seats in the first 5 rows (carpet search) ---
    if (STRATEGY2_ENABLED) {
        let result = findFirstGroupInRows(priorityRows, seatsByRow, zone);
        if (result) {
            console.log("策略2命中: 在前5排找到座位。", result);
            return result;
        }
    }

    // --- Priority 3: Any seats in the remaining rows ---
    if (STRATEGY3_ENABLED) {
        let result = findFirstGroupInRows(otherRows, seatsByRow, zone);
        if (result) {
            console.log("策略3命中: 在其他排找到座位。", result);
            return result;
        }
    }

    console.log(`未找到 ${GROUP_NUM} 个连续的座位。`);
    return [];
}

function findCenterGroupInRows(rows, seatsByRow, rowCounts, zone) {
    for (const row of rows) {
        const rowSeats = seatsByRow[row]; // Sorted by indexInRow
        if (!rowSeats || rowSeats.length < GROUP_NUM) continue;

        const totalSeatsInRow = rowCounts[row] || 20; // Fallback

        let centerStart, centerEnd;
        const isLeftZone = leftBlock.includes(zone);

        if (isLeftZone) {
            // For left zones, the "center" is the right half of the section
            centerStart = Math.floor(totalSeatsInRow / 2);
            centerEnd = totalSeatsInRow;
        } else {
            // For right/center zones, the "center" is the left half of the section
            centerStart = 0;
            centerEnd = Math.ceil(totalSeatsInRow / 2);
        }

        const seatsToSearch = rowSeats.filter(seat => seat.indexInRow >= centerStart && seat.indexInRow <= centerEnd);
        if (seatsToSearch.length < GROUP_NUM) continue;

        if (isLeftZone) {
            // Iterate backwards for left blocks (priority to higher indexInRow)
            for (let i = seatsToSearch.length - GROUP_NUM; i >= 0; i--) {
                const potentialGroup = seatsToSearch.slice(i, i + GROUP_NUM);
                if (checkConsecutive(potentialGroup)) {
                    return potentialGroup;
                }
            }
        } else { // Right or center zone
            // Iterate forwards for right/center blocks (priority to lower indexInRow)
            for (let i = 0; i <= seatsToSearch.length - GROUP_NUM; i++) {
                const potentialGroup = seatsToSearch.slice(i, i + GROUP_NUM);
                if (checkConsecutive(potentialGroup)) {
                    return potentialGroup;
                }
            }
        }
    }
    return null;
}

function findFirstGroupInRows(rowsToSearch, seatsByRow, zone) {
    for (const row of rowsToSearch) {
        const rowSeats = seatsByRow[row];
        if (!rowSeats || rowSeats.length < GROUP_NUM) continue;

        const searchDirection = leftBlock.includes(zone) ? 'desc' : 'asc';

        if (searchDirection === 'desc') {
            for (let i = rowSeats.length - GROUP_NUM; i >= 0; i--) {
                const potentialGroup = rowSeats.slice(i, i + GROUP_NUM);
                if (checkConsecutive(potentialGroup)) {
                    return potentialGroup;
                }
            }
        } else { // 'asc'
            for (let i = 0; i <= rowSeats.length - GROUP_NUM; i++) {
                const potentialGroup = rowSeats.slice(i, i + GROUP_NUM);
                if (checkConsecutive(potentialGroup)) {
                    return potentialGroup;
                }
            }
        }
    }
    return null;
}

function checkConsecutive(group) {
    if (group.length < 2) return true;
    const firstIndex = group[0].indexInRow;
    for (let i = 1; i < group.length; i++) {
        if (group[i].indexInRow !== firstIndex + i) {
            return false;
        }
    }
    return true;
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
            let data = await getFixedPage(K_VALUE, zone, RD_ID);
            if (data) {
                const { availableSeats, rowCounts, rowPhysicalIndex } = parseSeatsFromHTML(data);
                console.log(`Row physical indices for zone ${zone}:`, rowPhysicalIndex);
                console.log(`Seat counts for zone ${zone}:`, rowCounts);
                let paymentFormParams = getPaymentFormParams(data);

                let seatsToLock = getGroupSeats(availableSeats, zone, rowCounts, rowPhysicalIndex);
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
        STRATEGY1_ENABLED = config.strategy1 !== false;
        STRATEGY2_ENABLED = config.strategy2 !== false;
        STRATEGY3_ENABLED = config.strategy3 !== false;

        console.log("Configuration updated:", {
            blockSelect,
            GROUP_NUM,
            REFRESH_INTERVAL,
            MAX_SEAT_ID,
            TIMEOUT,
            WEBHOOK_URL,
            STRATEGY1_ENABLED,
            STRATEGY2_ENABLED,
            STRATEGY3_ENABLED
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


