let botRunning = false;

function getConcertId() {
    return document.getElementById("prodIdNum").value;
}

async function waitForChildren(id, timeoutMs = 3000, intervalMs = 100) {
    const deadline = Date.now() + timeoutMs;
    let element = document.getElementById(id);
    while ((!element || element.childElementCount === 0) && Date.now() < deadline) {
        await sleep(intervalMs);
        element = document.getElementById(id);
    }
    return element;
}

async function select_day(day) {
    let daysAvaible = await waitForChildren("list_date");
    if (!daysAvaible) return;

    let num = daysAvaible.childElementCount;
    if (num <= 1) return;

    for (let i = 0; i < num; i++) {
        let dayElement = daysAvaible.children[i];
        if (dayElement.getAttribute("data-perfday") == day) {
            dayElement.children[0].click();
            return;
        }
    }
    return;
}

async function select_time(time) {
    let timesAvaible = await waitForChildren("list_time");
    if (!timesAvaible) return;

    let num = timesAvaible.childElementCount;
    if (num <= 1) return;

    for (let i = 0; i < num; i++) {
        let timeElement = timesAvaible.children[i];
        if (timeElement.children[0].children[0].innerHTML.includes(time)) {
            timeElement.children[0].click();
            return;
        }
    }
    return;
}

async function isPlaceOpen() {
    let selector = document.getElementsByClassName("box_ticketing_process")[0];
    
    if (selector.style.display == "none") {
        return false;
    }
    return true;
}

async function searchConcert(startConfig) {
    let concertId = getConcertId();
    let data = startConfig || await get_stored_value(concertId);

    if (!botRunning || !data) {
        return;
    }
    if (!await isPlaceOpen()) {
        console.log("not open");
        await sleep(200);
        searchConcert(data);
        return;
    }
    await sleep(500);
    if (!botRunning) {
        return;
    }
    await select_day(data.date.replaceAll("-", ""));
    await sleep(500);
    await select_time(formatTime(data.time));
    await sleep(500);

    await sleep(5000);
    
    document.getElementsByClassName("reservationBtn")[0].click();


    console.log("clicked reservation");
}

function simulateMouseEvent(element, eventType) {
    const event = new MouseEvent(eventType, {
        bubbles: true,
        cancelable: true,
        isTrusted: true,
    });

    element.dispatchEvent(event);
}

function startBot(config) {
    if (botRunning) {
        return;
    }

    botRunning = true;
    searchConcert(config);
}

function stopBot() {
    botRunning = false;
    markRunStateStopped();
    console.log("[Melon] Concert bot stopped.");
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
