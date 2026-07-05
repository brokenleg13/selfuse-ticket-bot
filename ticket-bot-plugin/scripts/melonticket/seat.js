window.isSuccess = false; // whether it succeeded
let botRunning = false;

async function sleep(t) {
    return await new Promise(resolve => setTimeout(resolve, t));
}

function theFrame() {
    if (window._theFrameInstance == null) {
      window._theFrameInstance = document.getElementById('oneStopFrame').contentWindow;
    }

    return window._theFrameInstance;
}

async function waitForElement(doc, id, timeoutMs = 3000, intervalMs = 100) {
    const deadline = Date.now() + timeoutMs;
    let element = doc.getElementById(id);
    while (!element && Date.now() < deadline) {
        await sleep(intervalMs);
        element = doc.getElementById(id);
    }
    return element;
}

function getConcertId() {
    return document.getElementById("prodId").value;
}

function openRangeList() {
    if (window.isSuccess) {
        return;
    }
    let frame = theFrame();
    // Find an element whose class includes seat_name but not open
    let sectionToOpen = frame.document.querySelector(".seat_name:not(.open)");

    // If found, click it
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
            let nextBtn = await waitForElement(frame.document, "nextTicketSelection");
            if (!nextBtn) {
                // Selection didn't go through (e.g. Melon reverted to the
                // section list); try the next colored rect instead of
                // reporting a false success.
                continue;
            }
            nextBtn.click();
            return true;
        }
    }
    return false;
}

async function checkCaptchaFinish() {
    if (document.getElementById("certification").style.display != "none") {
        await sleep(1000);
        return await checkCaptchaFinish();
    }
    let frame = theFrame();
    await sleep(500);
    let nextBtn = await waitForElement(frame.document, "nextTicketSelection");
    if (!nextBtn) {
        return false;
    }
    nextBtn.click();
    return true;
}

async function searchSeat(data) {
    if (!botRunning || window.isSuccess) {
        return;
    }

    for (const sec of data.section) {
        if (!botRunning || window.isSuccess) {
            return;
        }
        openRangeList();
        clickOnArea(sec);
        if (await findSeat() && await checkCaptchaFinish()) {
            return;
        }
        await sleep(750 + Math.random() * 500);
    }
    await searchSeat(data);
}

async function waitForVerifyCaptchaClose() {
    console.log("waitForVerifyCaptchaClose");
    console.log(window.document.getElementById("certification").style.display);
    if (!botRunning || window.document.getElementById("certification").style.display == "none") {
        return;
    }
    await sleep(1000);
    await waitForVerifyCaptchaClose();
}

async function waitFirstLoad(startConfig) {
    let concertId = getConcertId();
    let data = startConfig || await get_stored_value(concertId);
    if (!data) {
        return;
    }
    let feishuBotId = data["feishu-bot-id"];
    await sleep(5000);
    await waitForVerifyCaptchaClose();
    if (!botRunning) {
        return;
    }
    openRangeList();
    await sleep(1000);
    // searchSeat() returns as soon as one seat is picked and confirmed,
    // but Melon can still bounce the user back to the section list
    // afterwards (e.g. pressing back, or the seat becoming unavailable
    // on the next step). Keep retrying until the bot is stopped or a
    // pick actually sticks.
    while (botRunning && !window.isSuccess) {
        await searchSeat(data);
        if (!botRunning || window.isSuccess) {
            break;
        }
        await sleep(1000);
    }
    if (window.isSuccess) {
        sendFeiShuMsg(feishuBotId, `[${new Date().toLocaleString()}] Ticket grab succeeded`);
        markRunStateStopped();
    }
}

function startBot(config) {
    if (botRunning) {
        return;
    }

    window.isSuccess = false;
    botRunning = true;
    waitFirstLoad(config);
}

function stopBot() {
    botRunning = false;
    window.isSuccess = true;
    markRunStateStopped();
    console.log("[Melon] Ticket bot stopped.");
}

function markRunStateStopped() {
    const storageKeys = window.TicketBotConfig && window.TicketBotConfig.storageKeys;
    const runStateKey = storageKeys ? storageKeys.botRunState : "ticketBotRunState";
    store_value(runStateKey, {
        running: false,
        platform: "melon",
        concertId: getConcertId(),
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const actions = window.TicketBotConfig && window.TicketBotConfig.actions;
    const startAction = actions ? actions.startBot : "startTicketBot";
    const stopAction = actions ? actions.stopBot : "stopTicketBot";

    if (request.action === startAction && (!request.platform || request.platform === "melon")) {
        startBot(request.config);
        sendResponse({ status: "started" });
        return true;
    }

    if (request.action === stopAction && (!request.platform || request.platform === "melon")) {
        stopBot();
        sendResponse({ status: "stopped" });
        return true;
    }
});

async function startFromRunState() {
    const storageKeys = window.TicketBotConfig && window.TicketBotConfig.storageKeys;
    const runStateKey = storageKeys ? storageKeys.botRunState : "ticketBotRunState";
    const runState = await get_stored_value(runStateKey);
    if (!runState || !runState.running || runState.platform !== "melon") {
        return;
    }

    const currentConcertId = getConcertId();
    if (runState.concertId && currentConcertId && runState.concertId !== currentConcertId) {
        return;
    }

    startBot(runState.config);
}

startFromRunState();
