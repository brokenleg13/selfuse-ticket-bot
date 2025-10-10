window.isSuccess = false; // 是否成功

async function sleep(t) {
    return await new Promise(resolve => setTimeout(resolve, t));
}

function theFrame() {
    if (window._theFrameInstance == null) {
      window._theFrameInstance = document.getElementById('oneStopFrame').contentWindow;
    }
  
    return window._theFrameInstance;
}

function getConcertId() {
    return document.getElementById("prodId").value;
}

function openRangeList() {
    if (window.isSuccess) {
        return;
    }
    let frame = theFrame();
    // 查找 class 包含 seat_name 但不包含 open 的元素
    let sectionToOpen = frame.document.querySelector(".seat_name:not(.open)");

    // 如果找到了，就点击它
    if (sectionToOpen) {
        sectionToOpen.click();
    }
    return;
}

function clickOnArea(area) {
    let frame = theFrame();
    let section = frame.document.getElementsByClassName("area_tit");
    for (let i = 0; i < section.length; i++) {
        let reg = new RegExp(area + "\$","g");
        if (section[i].innerHTML.match(reg)) {
            section[i].parentElement.click();
            return;
        }
    }
}

async function findSeat() {
    let frame = theFrame();
    let canvas = frame.document.getElementById("ez_canvas");
    let seat = canvas.getElementsByTagName("rect");
    await sleep(750);
    for (let i = 0; i < seat.length; i++) {
        let fillColor = seat[i].getAttribute("fill");
    
        // Check if fill color is different from #DDDDDD or none
        if (fillColor !== "#DDDDDD" && fillColor !== "none") {
            console.log("Rect with different fill color found:", seat[i]);
            var clickEvent = new Event('click', { bubbles: true });

            seat[i].dispatchEvent(clickEvent);
            frame.document.getElementById("nextTicketSelection").click();
            return true;
        }
    }
    return false;
}

async function checkCaptchaFinish() {
    if (document.getElementById("certification").style.display != "none") {
        await sleep(1000);
        checkCaptchaFinish();
        return;
    }
    let frame = theFrame();
    await sleep(500);
    frame.document.getElementById("nextTicketSelection").click();
    return;
}

async function searchSeat(data) {
    for (sec of data.section) {
        openRangeList();
        clickOnArea(sec);
        if (await findSeat()) {
            checkCaptchaFinish();
            return;
        }
        await sleep(600 + Math.random() * 500);
    }
    await searchSeat(data);
}

async function waitForVerifyCaptchaClose() {
    console.log("waitForVerifyCaptchaClose");
    console.log(window.document.getElementById("certification").style.display);
    if (window.document.getElementById("certification").style.display == "none") {
        return;
    }
    await sleep(1000);
    await waitForVerifyCaptchaClose();
}

async function waitFirstLoad() {
    let concertId = getConcertId();
    let data = await get_stored_value(concertId);
    let feishuBotId = data["feishu-bot-id"];
    console.log("feishuBotId:", feishuBotId);
    if (!data) {
        return;
    }
    await sleep(5000);
    await waitForVerifyCaptchaClose();
    openRangeList();
    await sleep(1000);
    await searchSeat(data);
    sendFeiShuMsg(feishuBotId, `[${new Date().toLocaleString()}]抢票成功`);
}


waitFirstLoad();