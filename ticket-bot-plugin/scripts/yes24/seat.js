let seatSelect = []; // 没用 todo:增加自定义选座
let blockSelect = [101,102,103,104,105,106,306,307,308,318,317,316]; // 自定义选区
let blackList = []; // 黑名单字典
let SEAT_MAX_CLICK_COUNT = 5; // 座位最大点击次数
let currentLoopCount = 0; // 当前循环次数 用于清除黑名单
let CLEAR_BLACK_LIST_COUNT = 10; // 清除黑名单次数
let WEBHOOK_URL = ''; // 飞书webhook url
window.isSuccess = false; // 是否成功

function getConcertId() {
    let url = window.location.href;
    let concertId = url.split("=")[1];
    return concertId;
}

function TampermonkeyClick() {
    localStorage.setItem("CLICK_NOW", "YES");
}

function sendFeiShuMsg(msg) {
    if (!WEBHOOK_URL) {
        console.log("WEBHOOK_URL未设置");
        return;
    }
    const payload = {
    msg_type: 'text',
    content: {
        text: msg
    }
    };

    fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(json => console.log('结果:', json))
    .catch(err => console.error('错误:', err));

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

function theFrame() {
    if (window.frames[0]) {
        return window.frames[0].document;
    }
    return window.document;
}

function theTopWindow() {
    return window.document;
}

function disableEndButton() {
    const frame = theFrame();
    frame.getElementsByClassName("btn")[0].children[1].children[0].removeAttribute("href");
}

function reactivateEndButton() {
    let href = "javascript:ChoiceEnd();"
    const frame = theFrame();
    frame.getElementsByClassName("btn")[0].children[1].children[0].setAttribute("href", href);
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
        window.isSuccess = true;
    } else {
        console.log('❌ class 不匹配');
    }
}

async function getSeat() {
    let frame = theFrame();
    let seatArray = frame.getElementById("divSeatArray").children;
    for (let i = 0; i < seatArray.length; i++) {
        let seat = seatArray[i];
        if (!seat.className.includes("s13") && !blackList.includes(seat.id)) {
            // 获取seat的ID
            let seatId = seat.id;
            // 尝试锁定座位
            for (let j = 0; j < SEAT_MAX_CLICK_COUNT; j++) {
                let frameNew = theFrame();
                let seatArrayNew = frameNew.getElementById("divSeatArray").children;
                let seatNew = seatArrayNew[i];
                seatNew.click();
                await sleep(200);
                TampermonkeyClick();
                await sleep(200);
                assertLockSuccess();
                if (window.isSuccess) {
                    return true;
                }
                await sleep(300);
            }
            // 如果超过次数锁定失败，则加入黑名单
            blackList.push(seatId);
            return false;
        }
    }
    return false;
}

async function findSeat() {
    if (window.isSuccess) {
        return;
    }
    let frame = theFrame();
    let blockChildren = frame.getElementsByClassName("seat_layer")[0].children
    for (let i = 0; i < blockChildren.length; i++) {
        let block = blockChildren[i];
        let blockText = block.textContent;
        // 如果文本包含blockSelect中的数字，则点击
        if (blockSelect.some(item => blockText.includes(item))) {
            block.click();
            await sleep(500);
            if (await getSeat()) {
                return;
            }
            await sleep(300);
        }
    }
    // if (await getSeat()) {
    //     return;
    // }
    return;    
}

async function selectRange(idx) {
    if (window.isSuccess) {
        return;
    }
    let frame = theFrame();
    if (idx == 1) {
        if (frame.getElementById("grade_지정석")) {
            frame.getElementById("grade_지정석").click()
        }
    } else {
        if (frame.getElementById("grade_스탠딩")) {
            frame.getElementById("grade_스탠딩").click()
        }
    }
    await sleep(500);
}

async function searchSeat() {
    let concertId = getConcertId();
    let data = await get_stored_value(concertId);
    await sleep(1000);
    selectDate(data);
    await sleep(1000);
    console.log("search seat");
    await sleep(1000);

    // 当isSuccess为true时立刻结束循环
    while (!window.isSuccess) {
        // 交替选择1和2
        await selectRange(1);
        await findSeat();
        await selectRange(2);
        await findSeat();
        // 循环10次清除黑名单
        currentLoopCount++;
        if (currentLoopCount >= CLEAR_BLACK_LIST_COUNT) {
            blackList = [];
            currentLoopCount = 0;
        }
    }
    sendFeiShuMsg("抢票成功");
    await sleep(1000);
    clickStepCtrlBtn03();
    await sleep(2000);
    clickStepCtrlBtn04();
    await sleep(1000);
    openPayment();
}

searchSeat();
