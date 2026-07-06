import { delete_value, get_stored_value, store_value } from "../module/storage.js";

const config = window.TicketBotConfig || {};
const storageKeys = config.storageKeys || {
    autoBooking: "autoBooking",
    botRunState: "ticketBotRunState",
};
const actions = config.actions || {
    startBot: "startTicketBot",
    stopBot: "stopTicketBot",
    startThaiTicket: "startThaiticket",
    stopThaiTicket: "stopThaiticket",
};
const platformStartUrls = config.platformStartUrls || {};
const interparkDefaults = config.interpark || {};

function getBookingValue(booking, key, fallback) {
    const value = booking && booking[key];
    return value === undefined || value === null || value === "" ? fallback : value;
}

const platformIdParams = { melon: "prodId" };

function extractIdFromUrl(value, paramName) {
    const trimmed = (value || "").toString().trim();
    if (!paramName || !/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }

    try {
        return new URL(trimmed).searchParams.get(paramName) || trimmed;
    } catch (error) {
        return trimmed;
    }
}

function normalizeConcertId(platform, concertId) {
    return extractIdFromUrl(concertId, platformIdParams[platform]);
}

let loadAutoBooking = async () => {
    let autoBooking = await get_stored_value(storageKeys.autoBooking);
    let listContainer = document.getElementById("list-booking");
    listContainer.innerHTML = "";

    if (!autoBooking || autoBooking.length < 1) {
        listContainer.textContent = "暂无自动抢票配置";
        return;
    }

    let fragment = document.createDocumentFragment();

    autoBooking.forEach((booking, index) => {
        let concertItem = createConcertItem(booking, index);
        fragment.appendChild(concertItem);
    });

    listContainer.appendChild(fragment);
};

function createCardAction(label, className, handler) {
    let button = document.createElement("button");
    button.classList.add("booking-action", className);
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", async(event) => {
        event.stopPropagation();
        button.disabled = true;
        try {
            await handler(event);
        } finally {
            button.disabled = false;
        }
    });
    return button;
}

function createConcertItem(booking, index) {
    let div = document.createElement("div");
    div.classList.add("booking-item");
    div.setAttribute("data-index", index);

    let deleteButton = document.createElement("button");
    deleteButton.classList.add("delete-button");
    deleteButton.innerHTML = "&#10006;"; // Cross symbol
    deleteButton.addEventListener("click", async(event) => {
        event.stopPropagation();
        let dataIndex = event.currentTarget.parentNode.getAttribute("data-index");
        await deleteConcertItem(dataIndex);
    });

    let concertInfo = document.createElement("div");
    concertInfo.classList.add("concert-info");
    let concertName = document.createElement("p");
    concertName.classList.add("concert-name");
    concertName.textContent = booking["concert-name"] || "";

    let concertId = document.createElement("p");
    concertId.textContent = `演出链接/ID: ${booking["concert-id"] || ""}`;

    let date = document.createElement("p");
    date.textContent = `日期: ${booking.date || ""}`;

    let time = document.createElement("p");
    time.textContent = `时间: ${booking.time || ""}`;

    let section = document.createElement("p");
    section.textContent = `区域: ${Array.isArray(booking.section) ? booking.section.join(", ") : ""}`;

    concertInfo.appendChild(concertName);
    concertInfo.appendChild(concertId);
    concertInfo.appendChild(date);
    concertInfo.appendChild(time);
    concertInfo.appendChild(section);

    if (booking.platform === "interpark") {
        let polling = document.createElement("p");
        polling.textContent = `轮询: 每轮 ${getBookingValue(booking, "refreshIntervalMs", interparkDefaults.refreshIntervalMs || 2000)}ms + 抖动 ${getBookingValue(booking, "refreshJitterMs", interparkDefaults.refreshJitterMs || 600)}ms / 区域 ${getBookingValue(booking, "areaScanIntervalMs", interparkDefaults.areaScanIntervalMs || 800)}ms`;
        concertInfo.appendChild(polling);

        let maxAreas = document.createElement("p");
        maxAreas.textContent = `最多区域: ${getBookingValue(booking, "maxAreaClicksPerRefresh", interparkDefaults.maxAreaClicksPerRefresh || 12)}`;
        concertInfo.appendChild(maxAreas);

        let maxSeatRow = document.createElement("p");
        const seatRowValue = getBookingValue(booking, "maxSeatRow", interparkDefaults.maxSeatRow || 0);
        maxSeatRow.textContent = Number(seatRowValue) > 0 ? `座位排过滤: 前 ${seatRowValue} 排` : "座位排过滤: 不限制";
        concertInfo.appendChild(maxSeatRow);

        let timeout = document.createElement("p");
        const timeoutValue = getBookingValue(booking, "bookingSessionTimeoutMinutes", interparkDefaults.bookingSessionTimeoutMinutes || 9.5);
        timeout.textContent = Number(timeoutValue) > 0 ? `订购页重开: ${timeoutValue} 分钟` : "订购页重开: 关闭";
        concertInfo.appendChild(timeout);
    }

    let platformImage = document.createElement("img");
    platformImage.classList.add("platform-image");
    platformImage.src = getPlatformImageSrc(booking.platform);
    platformImage.alt = booking.platform;

    let actionsContainer = document.createElement("div");
    actionsContainer.classList.add("booking-actions");
    actionsContainer.appendChild(createCardAction("开始", "start-action", () => startBooking(booking)));
    actionsContainer.appendChild(createCardAction("停止", "stop-action", () => stopBooking(booking.platform)));
    actionsContainer.appendChild(createCardAction("编辑", "edit-action", () => editBooking(booking)));

    div.appendChild(concertInfo);
    div.appendChild(platformImage);
    div.appendChild(actionsContainer);
    div.appendChild(deleteButton);

    div.addEventListener("click", async() => {
        await stopBooking(booking.platform);
        openBookingUrl(booking.platform, normalizeConcertId(booking.platform, booking["concert-id"]));
    });

    return div;
}

async function sendActiveTabMessage(message) {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            if (!activeTab || !activeTab.id) {
                reject(new Error("No active tab found."));
                return;
            }

            chrome.tabs.sendMessage(activeTab.id, message, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                resolve(response);
            });
        });
    });
}

function getStartMessage(booking, concertId) {
    if (booking.platform === "thaiticket") {
        return {
            action: actions.startThaiTicket,
            config: booking,
        };
    }

    return {
        action: actions.startBot,
        platform: booking.platform,
        concertId,
        config: booking,
    };
}

function getStopMessage(platform) {
    if (platform === "thaiticket") {
        return { action: actions.stopThaiTicket };
    }

    return {
        action: actions.stopBot,
        platform,
    };
}

async function startBooking(booking) {
    const concertId = normalizeConcertId(booking.platform, booking["concert-id"]);

    await store_value(storageKeys.botRunState, {
        running: true,
        platform: booking.platform,
        concertId,
        config: booking,
    });

    try {
        await sendActiveTabMessage(getStartMessage(booking, concertId));
    } catch (error) {
        console.error("Start failed:", error);
        openBookingUrl(booking.platform, concertId);
    }
}

async function stopBooking(platform) {
    await store_value(storageKeys.botRunState, {
        running: false,
        platform,
    });

    try {
        await sendActiveTabMessage(getStopMessage(platform));
    } catch (error) {
        console.error("Stop failed:", error);
    }
}

function editBooking(booking) {
    const platform = booking.platform;
    const concertId = encodeURIComponent(booking["concert-id"]);
    window.location.href = `../${getPlatformFormPath(platform)}?editId=${concertId}&platform=${platform}`;
}

function openBookingUrl(platform, concertId) {
    let url;
    switch (platform) {
        case "melon":
            url = `${platformStartUrls.melon || "https://tkglobal.melon.com/performance/index.htm?langCd=EN&prodId="}${concertId}`;
            break;
        case "yes24":
            url = `${platformStartUrls.yes24 || "http://ticket.yes24.com/Pages/English/Perf/FnPerfDeail.aspx?IdPerf="}${concertId}`;
            break;
        case "interpark":
            url = getInterparkBookingUrl(concertId);
            break;
        case "thaiticket":
            url = platformStartUrls.thaiticket || "https://www.thaiticketmajor.com/";
            break;
        default:
            console.error("Unknown platform");
            return;
    }

    if (!url) {
        console.error("Missing or invalid booking URL/config for", platform, concertId);
        alert("Missing Interpark place/product config. Use a full NOL URL, productId?placeCode=placeId, or placeId/productId.");
        return;
    }

    window.open(url, "_blank");
}

function getInterparkBookingUrl(concertId) {
    const value = (concertId || "").trim();
    if (/^https?:\/\//i.test(value)) {
        return value;
    }

    const queryPlaceMatch = value.match(/^(\d+)\?placeCode=(\d+)$/i);
    if (queryPlaceMatch) {
        return `https://world.nol.com/zh-CN/ticket/genre/CONCERT/products/${queryPlaceMatch[1]}?placeCode=${queryPlaceMatch[2]}`;
    }

    const pairMatch = value.match(/(?:places\/)?(\d+)[/:|, -]+(?:products\/)?(\d+)/i);
    if (pairMatch) {
        return `https://world.nol.com/zh-CN/ticket/places/${pairMatch[1]}/products/${pairMatch[2]}`;
    }

    return "";
}

function getPlatformFormPath(platform) {
    switch (platform) {
        case "melon":
            return "melonticketForm/melonticket.html";
        case "yes24":
            return "yes24Form/yes24.html";
        case "interpark":
            return "interparkForm/interpark.html";
        default:
            return "form/form.html";
    }
}

async function deleteConcertItem(index) {
    let listContainer = document.getElementById("list-booking");
    let autoBooking = await get_stored_value(storageKeys.autoBooking);
    delete_value(autoBooking[index]["concert-id"]);
    autoBooking.splice(index, 1);

    store_value(storageKeys.autoBooking, autoBooking);

    let deletedElement = listContainer.children[index];
    listContainer.removeChild(deletedElement);

    for (let i = index; i < listContainer.children.length; i++) {
        listContainer.children[i].dataset.index = i;
    }
}

function getPlatformImageSrc(platform) {
    switch (platform) {
        case "melon":
            return "../../assets/melonticket_logo.png";
        case "yes24":
            return "../../assets/yes24_logo.png";
        case "interpark":
            return "../../assets/interpark_logo.png";
        case "thaiticket":
            return "../../assets/thaiticketmajor_logo.png";
        default:
            return "";
    }
}

loadAutoBooking();
