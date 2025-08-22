/*--------------------------------- 自定义配置 USERID必填 ---------------------------------*/
let blockSelect = ["A2"]; // 自定义选区
let WEBHOOK_URL = ''; // 飞书webhook url
let REFRESH_INTERVAL = 1000; // 刷新时间间隔 根据网络调整
let GROUP_NUM = 2; // 连坐数，>1时只找连坐锁
let TIMEOUT = 5000; // 等待锁票超时时间
let MAX_LOCK_ATTEMPTS = 3; // 最大锁票尝试次数
let TARGET_GROUP_COUNT = 3; // 每次刷新尝试锁定座位组数
let ROW_PCT_MIN = 0;    // "中心"排数下限百分比
let ROW_PCT_MAX = 20;   // "中心"排数上限百分比
let COL_PCT_MIN = 0;   // "中心"列下限百分比
let COL_PCT_MAX = 50;   // "中心"列上限百分比
let SIDEWAYS_ZONES = []; // 侧面舞台区域

let STRATEGY1_ENABLED = true;
let STRATEGY2_ENABLED = true;
let STRATEGY3_ENABLED = true;

let seatGroupFailureCount = new Map();
let seatGroupBlacklist = new Set();


let leftBlock = ["A1","B1","C1"];
let rightBlock = ["A2","B3","C2"];


/*--------------------------------- 勿修改 ---------------------------------*/
let isSuccess = false; // 是否成功
let successZone = "";
let successSeat = null;
let successId = "";
let successNum = 0;
let failedNum = 0;
let seatQueue = []; // 可选座位队列
let secondSeatQueue = []; // 次要座位队列

// --- Main Data Structure ---
let virtualZoneMap = []; // The complete 2D map of the zone

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

// Function to parse seat data from HTML and build the virtual map
function parseSeatsAndBuildMap(htmlString, zone) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const rows = doc.querySelectorAll('table#tableseats tr');
    
    const tempMap = [];
    let maxWidth = 0;

    let currentRowName = null;
    rows.forEach((row, rowIndex) => {
        let colIndex = 0;
        const rowMap = [];
        
        const firstCell = row.firstElementChild;
        if (firstCell && (firstCell.tagName === 'TH' || firstCell.classList.contains('headrow'))) {
            currentRowName = firstCell.textContent.trim();
        }

        row.querySelectorAll('td').forEach(cell => {
            if (cell.classList.contains('headrow')) {
                return; // Skip the header cell itself from being processed as a seat/skip
            }

            if (cell.classList.contains('skiprow')) {
                const colspan = parseInt(cell.getAttribute('colspan') || '1', 10);
                for (let i = 0; i < colspan; i++) {
                    rowMap.push(null);
                }
                colIndex += colspan;
            } else {
                const title = cell.getAttribute('title');
                if (title) {
                    const [_row, seatNumStr] = title.split('-');
                    const finalRowName = currentRowName || _row;
                    const seatDiv = cell.querySelector('div.seatuncheck');
                    let seatData = null;

                    if (seatDiv) {
                        const dataInfo = cell.getAttribute('data-info');
                        try {
                            const seatInfo = JSON.parse(dataInfo);
                            seatData = {
                                seat: seatInfo.seat,
                                seatk: seatInfo.seatk,
                                title: title,
                                row: finalRowName,
                                seatNum: seatNumStr,
                                rowIndex: tempMap.length,
                                colIndex: colIndex
                            };
                        } catch (e) { console.error("JSON parse error:", e); }
                    }
                    rowMap.push(seatData);
                    colIndex++;
                }
            }
        });

        if (rowMap.length > 0) {
            tempMap.push(rowMap);
        }
        if (colIndex > maxWidth) {
            maxWidth = colIndex;
        }
    });
    
    // Normalize the map to a perfect rectangle
    let initialMap = tempMap.map(row => {
        const newRow = [...row];
        while (newRow.length < maxWidth) {
            newRow.push(null);
        }
        return newRow;
    });

    // --- Rotate matrix and update coordinates if it's a sideways zone ---
    const isLeft = leftBlock.includes(zone);
    let finalMap = initialMap;
    if (SIDEWAYS_ZONES.includes(zone)) {
        if (isLeft) {
            finalMap = rotateMatrixCounterClockwise(initialMap);
        } else {
            finalMap = rotateMatrixClockwise(initialMap);
        }
    }

    virtualZoneMap = finalMap;
}


function rotateMatrixClockwise(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const newMatrix = Array.from({ length: cols }, () => Array(rows).fill(null));

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const seat = matrix[i][j];
            if (seat) {
                seat.rowIndex = j;
                seat.colIndex = rows - 1 - i;
            }
            newMatrix[j][rows - 1 - i] = seat;
        }
    }
    return newMatrix;
}

function rotateMatrixCounterClockwise(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const newMatrix = Array.from({ length: cols }, () => Array(rows).fill(null));

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const seat = matrix[i][j];
            if (seat) {
                seat.rowIndex = cols - 1 - j;
                seat.colIndex = i;
            }
            newMatrix[cols - 1 - j][i] = seat;
        }
    }
    return newMatrix;
}

function findAllHorizontalGroups(matrix) {
    const foundGroups = [];
    if (GROUP_NUM <= 0 || !matrix.length) return foundGroups;
    const maxWidth = matrix[0].length;
    const numRows = matrix.length;

    for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
        const row = matrix[rowIndex];
        if (!row) continue;

        for (let colIndex = 0; colIndex <= maxWidth - GROUP_NUM; colIndex++) {
            const potentialGroup = [];
            let isGroupValid = true;

            for (let i = 0; i < GROUP_NUM; i++) {
                const seat = matrix[rowIndex][colIndex + i];
                if (seat) {
                    potentialGroup.push(seat);
                } else {
                    isGroupValid = false;
                    break;
                }
            }

            if (isGroupValid && potentialGroup.length === GROUP_NUM) {
                const groupIdentifier = potentialGroup.map(s => s.seat).sort().join(',');
                if (!seatGroupBlacklist.has(groupIdentifier)) {
                    foundGroups.push(potentialGroup);
                }
            }
        }
    }
    return foundGroups;
}


function getGroupSeats(zone) {
    const allFoundGroups = [];
    const usedSeatKs = new Set();

    const addUniqueGroups = (groups) => {
        for (const group of groups) {
            if (allFoundGroups.length >= TARGET_GROUP_COUNT) return;

            const groupIdentifier = group.map(s => s.seat).sort().join(',');
            if (seatGroupBlacklist.has(groupIdentifier)) {
                continue; // Explicitly skip blacklisted groups here as a safeguard
            }

            const isOverlapping = group.some(seat => usedSeatKs.has(seat.seatk));
            if (!isOverlapping) {
                allFoundGroups.push(group);
                group.forEach(seat => usedSeatKs.add(seat.seatk));
            }
        }
    };

    const isSideways = SIDEWAYS_ZONES.includes(zone);
    const isLeft = leftBlock.includes(zone);

    // --- Strategy-based filtering ---
    // This logic is now universal, operating on the final, standardized virtualZoneMap.
    // "Priority" (front rows) is defined by rowIndex.
    // "Center" is defined by colIndex.

    // 1. Define priority and center limits based on the final map dimensions.
    const totalRows = virtualZoneMap.length;
    const priorityRowMin = Math.floor(totalRows * (ROW_PCT_MIN / 100));
    const priorityRowMax = Math.ceil(totalRows * (ROW_PCT_MAX / 100));

    const mapWidth = virtualZoneMap[0]?.length || 0;
    const minPct = Math.min(COL_PCT_MIN, COL_PCT_MAX);
    const maxPct = Math.max(COL_PCT_MIN, COL_PCT_MAX);
    
    // For sideways zones, the meaning of "left" is inverted after rotation.
    // We use an XOR to determine if we should use the inverted percentage logic.
    const shouldInvertColPct = isLeft ^ isSideways;

    let centerColStart, centerColEnd;
    if (shouldInvertColPct) {
        centerColStart = Math.floor(mapWidth * (100 - maxPct) / 100);
        centerColEnd = Math.floor(mapWidth * (100 - minPct) / 100);
    } else {
        centerColStart = Math.floor(mapWidth * minPct / 100);
        centerColEnd = Math.floor(mapWidth * maxPct / 100);
    }

    // 2. Find all possible groups (always horizontal on the final map)
    const allGroups = findAllHorizontalGroups(virtualZoneMap);

    // 3. Classify all found groups into their respective strategies first.
    const strategy1Groups = [];
    const strategy2Groups = [];
    const strategy3Groups = [];

    for (const group of allGroups) {
        const isInPriority = group.some(seat => seat.rowIndex >= priorityRowMin && seat.rowIndex <= priorityRowMax);
        const isInCenter = group.some(seat => seat.colIndex >= centerColStart && seat.colIndex <= centerColEnd);

        if (isInPriority && isInCenter) {
            strategy1Groups.push(group);
        } else if (isInPriority) {
            strategy2Groups.push(group);
        } else {
            strategy3Groups.push(group);
        }
    }

    // 4. Build the final list by adding groups in strict priority order.
    if (STRATEGY1_ENABLED) {
        addUniqueGroups(strategy1Groups);
    }
    if (allFoundGroups.length < TARGET_GROUP_COUNT && STRATEGY2_ENABLED) {
        addUniqueGroups(strategy2Groups);
    }
    if (allFoundGroups.length < TARGET_GROUP_COUNT && STRATEGY3_ENABLED) {
        addUniqueGroups(strategy3Groups);
    }

    return allFoundGroups;
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
        console.log("[Thaiticket] Validate seat response:", data);
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
                console.log('[Thaiticket] Lock request rule added, proceeding with fetch.');
            } else {
                console.error('[Thaiticket] Failed to add lock request rule:', response ? response.error : 'No response');
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
    // console.log("seatlist", seatlist);
    // console.log("pricelist", pricelist);
    // console.log("seatklist", seatklist);
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
    // console.log("body", body);

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
        console.log("[Thaiticket] Lock response:", data);
        if (data.result) {
            isSuccess = true;
            console.log("[Thaiticket] 锁票成功");
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
                console.log('[Thaiticket] Lock request rule removed successfully.');
            } else {
                console.error('[Thaiticket] Failed to remove lock request rule:', response ? response.error : 'No response');
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
            console.error("[Thaiticket] Timeout: " + TIMEOUT + "ms");
            break;
        }
    }
    if (successNum == seatsToLock.length) {
        await sendLockRequest(seatsToLock, paymentFormParams);
    }

    // 如果尝试锁定失败（成功的票数小于期望的票数），则记录失败
    if (successNum < seatsToLock.length) {
        const groupKey = seatsToLock.map(s => s.seatk).sort().join(',');
        const currentFailures = (seatGroupFailureCount.get(groupKey) || 0) + 1;
        seatGroupFailureCount.set(groupKey, currentFailures);
        console.log(`[Thaiticket] 座位组 ${groupKey} 锁定失败。失败次数: ${currentFailures}`);

        if (currentFailures >= MAX_LOCK_ATTEMPTS) {
            seatGroupBlacklist.add(groupKey);
            console.log(`[Thaiticket] 座位组 ${groupKey} 因失败 ${currentFailures} 次已被加入黑名单。`);
        }
    }
}


async function mainLoop() {
    if (!botRunning) return;
    console.log("Bot loop running...");

    initEnv();

    try {
        while(botRunning) { // 添加 while 循环
            if (!botRunning) break;

            for (const zone of blockSelect) {
                if (!botRunning) break;

                let data = await getFixedPage(K_VALUE, zone, RD_ID);

                if (!data) {
                    console.error(`Failed to fetch data for zone ${zone}.`);
                    continue;
                }

                if (data.includes("您的请求暂时不能处理")) {
                    console.error("[Thaiticket] 检测到 '您的请求暂时不能处理'。可能需要输入验证码。机器人停止。");
                    await sendFeiShuMsg("Thaiticket Bot: 检测到 '您的请求暂时不能处理'，可能需要验证码。机器人已停止，请检查页面。");
                    stopBot();
                    return; // Exit mainLoop
                }

                parseSeatsAndBuildMap(data, zone);
                
                // --- PRINT THE MAP FOR INSPECTION ---
                // console.log(`[Thaiticket] Virtual map for zone ${zone}:`);
                // console.table(virtualZoneMap);

                let paymentFormParams = getPaymentFormParams(data);
                
                let seatGroups = getGroupSeats(zone);
                
                console.log(`[Thaiticket] Found ${seatGroups.length} group(s) to lock:`, seatGroups);

                if (seatGroups.length > 0) {
                    console.log(`[Thaiticket] Found ${seatGroups.length} group(s) to lock:`, seatGroups);
                    // Sequentially attempt to lock each group
                    for (const group of seatGroups) {
                        console.log(`[Thaiticket] Attempting to lock group:`, group);
                        await tryLockSeat(group, paymentFormParams);
                        
                        // If this attempt was successful, stop the bot and exit
                        if (isSuccess) {
                            stopBot();
                            return; // Exit the main loop entirely
                        }
                        const jitter = Math.random() * 500; // Add a random jitter up to 500ms
                        const totalSleepTime = REFRESH_INTERVAL + jitter;
                        console.log(`[Thaiticket] Waiting for ${totalSleepTime.toFixed(0)}ms (base: ${REFRESH_INTERVAL}ms + jitter: ${jitter.toFixed(0)}ms) before next refresh.`);
                        await sleep(totalSleepTime);
                    }
                } else {
                    console.log(`[Thaiticket] No lockable groups found in zone ${zone}.`);
                }

                // Wait for the next refresh interval with random jitter
                const jitter = Math.random() * 500; // Add a random jitter up to 500ms
                const totalSleepTime = REFRESH_INTERVAL + jitter;
                console.log(`[Thaiticket] Waiting for ${totalSleepTime.toFixed(0)}ms (base: ${REFRESH_INTERVAL}ms + jitter: ${jitter.toFixed(0)}ms) before next refresh.`);
                await sleep(totalSleepTime);
            }
        }
    } catch (error) {
        console.error("[Thaiticket] An error occurred in the main loop:", error);
    }
}

function startBot(config) {
    if (config) {
        blockSelect = config.blockSelect || ["A2"];
        GROUP_NUM = config.groupNum || 2;
        REFRESH_INTERVAL = config.refreshInterval || 1000;
        TIMEOUT = config.timeout || 5000;
        WEBHOOK_URL = config.webhookUrl || '';
        ROW_PCT_MIN = config.rowPctMin ?? 0;
        ROW_PCT_MAX = config.rowPctMax || 20;
        COL_PCT_MIN = config.colPctMin ?? 25;
        COL_PCT_MAX = config.colPctMax || 75;
        SIDEWAYS_ZONES = Array.isArray(config.sidewaysZones) ? config.sidewaysZones : [];
        STRATEGY1_ENABLED = config.strategy1 !== false;
        STRATEGY2_ENABLED = config.strategy2 !== false;
        STRATEGY3_ENABLED = config.strategy3 !== false;

        if (Array.isArray(config.leftBlock) && config.leftBlock.length > 0) {
            leftBlock = config.leftBlock;
        }
        if (Array.isArray(config.rightBlock) && config.rightBlock.length > 0) {
            rightBlock = config.rightBlock;
        }

        console.log("Configuration updated:", {
            blockSelect,
            leftBlock,
            rightBlock,
            GROUP_NUM,
            REFRESH_INTERVAL,
            TIMEOUT,
            WEBHOOK_URL,
            ROW_PCT_MIN,
            ROW_PCT_MAX,
            COL_PCT_MIN,
            COL_PCT_MAX,
            SIDEWAYS_ZONES,
            STRATEGY1_ENABLED,
            STRATEGY2_ENABLED,
            STRATEGY3_ENABLED
        });
    }

    if (!botRunning) {
        botRunning = true;
        console.log("[Thaiticket] ThaiTicket Bot started!");
        // sendFeiShuMsg(WEBHOOK_URL, "ThaiTicket Bot started!");
        mainLoop();
    }
}

function stopBot() {
    if (botRunning) {
        botRunning = false;
        isSuccess = false;
        console.log("[Thaiticket] ThaiTicket Bot stopped!");
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


