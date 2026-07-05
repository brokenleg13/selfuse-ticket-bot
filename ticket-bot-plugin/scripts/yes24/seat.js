let seatSelect = []; // unused todo: add custom seat selection
let blockSelect = [101,102,103,104,105,106,306,307,308,318,317,316]; // custom selected blocks
let blackList = []; // blacklist dictionary
let SEAT_MAX_CLICK_COUNT = 5; // max click count per seat
let currentLoopCount = 0; // current loop count, used to clear the blacklist
let CLEAR_BLACK_LIST_COUNT = 10; // number of loops after which to clear the blacklist
let WEBHOOK_URL = ''; // Feishu webhook URL
window.isSuccess = false; // whether it succeeded

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
        console.log("WEBHOOK_URL not set");
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
    .then(json => console.log('Result:', json))
    .catch(err => console.error('Error:', err));

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

// Bring up credit card payment
function openPayment() {
    let frame = theTopWindow();
    frame.getElementById("rdoPays2").click();
    frame.getElementById("cbxUserInfoAgree").click();
    frame.getElementById("cbxCancelFeeAgree").click();
    frame.getElementById("StepCtrlBtn05").children[1].click();
}

// Assert lock success
function assertLockSuccess() {
    let frame = theTopWindow();
    const el = frame.querySelector('#StepCtrlBtn03');
    if (el && el.style.display === 'block') {
        console.log('✅ class correct: m03 on');
        window.isSuccess = true;
    } else {
        console.log('❌ class mismatch');
    }
}

async function getSeat() {
    let frame = theFrame();
    let seatArray = frame.getElementById("divSeatArray").children;
    for (let i = 0; i < seatArray.length; i++) {
        let seat = seatArray[i];
        if (!seat.className.includes("s13") && !blackList.includes(seat.id)) {
            // Get the seat's ID
            let seatId = seat.id;
            // Try to lock the seat
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
            // If locking fails after the max number of attempts, add to the blacklist
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
        // If the text contains a number from blockSelect, click it
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

    // End the loop immediately once isSuccess becomes true
    while (!window.isSuccess) {
        // Alternate between selecting 1 and 2
        await selectRange(1);
        await findSeat();
        await selectRange(2);
        await findSeat();
        // Clear the blacklist every 10 loops
        currentLoopCount++;
        if (currentLoopCount >= CLEAR_BLACK_LIST_COUNT) {
            blackList = [];
            currentLoopCount = 0;
        }
    }
    sendFeiShuMsg("Ticket grab succeeded");
    await sleep(1000);
    clickStepCtrlBtn03();
    await sleep(2000);
    clickStepCtrlBtn04();
    await sleep(1000);
    openPayment();
}

searchSeat();
