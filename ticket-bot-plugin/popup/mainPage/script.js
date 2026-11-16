import { delete_value, get_stored_value, store_value } from "../module/storage.js";

const config = window.TicketBotConfig || {};
const storageKeys = config.storageKeys || {
    autoBooking: "autoBooking",
    botRunState: "ticketBotRunState",
};
const actions = Object.assign({
    startBot: "startTicketBot",
    stopBot: "stopTicketBot",
    pauseBot: "pauseTicketBot",
    resumeBot: "resumeTicketBot",
}, config.actions || {});
const platforms = config.platforms || {};

function getBookingValue(booking, key, fallback) {
    return config.getValue ? config.getValue(booking.platform, booking, key, fallback) : fallback;
}

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
    return extractIdFromUrl(concertId, platforms[platform] && platforms[platform].idParam);
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

    // 显示 config.js 里标了 summary 的字段（卡片值或默认值）。
    const fields = platforms[booking.platform] && platforms[booking.platform].fields || [];
    fields.filter(field => field.summary).forEach(field => {
        let line = document.createElement("p");
        line.textContent = `${field.summary}: ${getBookingValue(booking, field.key, "-")}`;
        concertInfo.appendChild(line);
    });

    let platformImage = document.createElement("img");
    platformImage.classList.add("platform-image");
    platformImage.src = getPlatformImageSrc(booking.platform);
    platformImage.alt = booking.platform;

    let actionsContainer = document.createElement("div");
    actionsContainer.classList.add("booking-actions");
    actionsContainer.appendChild(createCardAction("开始", "start-action", () => startBooking(booking)));
    actionsContainer.appendChild(createCardAction("接管", "pause-action", () => setPaused(booking.platform, true)));
    actionsContainer.appendChild(createCardAction("继续", "resume-action", () => setPaused(booking.platform, false)));
    actionsContainer.appendChild(createCardAction("停止", "stop-action", () => stopBooking(booking.platform)));
    actionsContainer.appendChild(createCardAction("编辑", "edit-action", () => editBooking(booking)));

    div.appendChild(concertInfo);
    div.appendChild(platformImage);
    div.appendChild(actionsContainer);
    div.appendChild(deleteButton);

    // 点卡片空白处只打开购票页，不再顺带停止脚本（停止会同步到所有页面，容易误触）。
    div.addEventListener("click", () => {
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
    return {
        action: actions.startBot,
        platform: booking.platform,
        concertId,
        config: booking,
    };
}

async function startBooking(booking) {
    const concertId = normalizeConcertId(booking.platform, booking["concert-id"]);

    await store_value(storageKeys.botRunState, {
        running: true,
        paused: false,
        updatedAt: Date.now(),
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

// 停止/接管/继续只需要改运行状态：所有购票页（包括 Melon 选座弹窗）都监听它，
// 不依赖“当前标签页”能收到消息。
async function stopBooking(platform) {
    await store_value(storageKeys.botRunState, {
        running: false,
        paused: false,
        updatedAt: Date.now(),
        platform,
    });
}

async function setPaused(platform, paused) {
    const runState = await get_stored_value(storageKeys.botRunState);
    if (!runState || !runState.running || runState.platform !== platform) {
        alert("该平台当前没有在运行");
        return;
    }
    await store_value(storageKeys.botRunState, Object.assign({}, runState, {
        paused,
        updatedAt: Date.now(),
    }));
}

function editBooking(booking) {
    const platform = booking.platform;
    const concertId = encodeURIComponent(booking["concert-id"]);
    window.location.href = `../${getPlatformFormPath(platform)}?editId=${concertId}&platform=${platform}`;
}

function openBookingUrl(platform, concertId) {
    const meta = platforms[platform];
    if (!meta) {
        console.error("Unknown platform", platform);
        return;
    }

    const url = platform === "interpark"
        ? getInterparkBookingUrl(concertId)
        : config.formatUrl(meta.urls && meta.urls.start, { id: concertId });

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
        return config.formatUrl(platforms.interpark.urls.productByQuery, { productId: queryPlaceMatch[1], placeId: queryPlaceMatch[2] });
    }

    const pairMatch = value.match(/(?:places\/)?(\d+)[/:|, -]+(?:products\/)?(\d+)/i);
    if (pairMatch) {
        return config.formatUrl(platforms.interpark.urls.productByPlace, { placeId: pairMatch[1], productId: pairMatch[2] });
    }

    return "";
}

function getPlatformFormPath(platform) {
    return platforms[platform] && platforms[platform].form || "form/form.html";
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
    const logo = platforms[platform] && platforms[platform].logo;
    return logo ? `../../${logo}` : "";
}

// 测试提示音：确认电脑音量和声音通道正常（走后台 offscreen 播放，与购票页一致）。
const soundTestButton = document.getElementById("sound-test");
if (soundTestButton && window.TicketBotSound) {
    soundTestButton.addEventListener("click", async() => {
        const volume = Number(config.runtime && config.runtime.soundVolume) || 0.6;
        const played = await window.TicketBotSound.play("takeover", { volume, repeat: 1 });
        soundTestButton.textContent = played ? "🔔 已播放，听到了吗？" : "🔇 播放失败，请检查插件权限";
        setTimeout(() => { soundTestButton.textContent = "🔔 测试提示音"; }, 2500);
    });
}

// 运行记录：导出给 Agent 分析卡点（流程见 docs/incidents.md），复现问题前可以先清空。
const journalExportButton = document.getElementById("journal-export");
const journalClearButton = document.getElementById("journal-clear");
if (journalExportButton && window.TicketBotJournal) {
    journalExportButton.addEventListener("click", async() => {
        const entries = await window.TicketBotJournal.read();
        const payload = {
            exportedAt: new Date().toISOString(),
            extensionVersion: chrome.runtime.getManifest().version,
            count: entries.length,
            unhandled: entries.filter(entry => entry.type === "unhandled").length,
            entries,
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `ticket-bot-journal-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 5000);
    });
}
if (journalClearButton && window.TicketBotJournal) {
    journalClearButton.addEventListener("click", async() => {
        if (!confirm("清空所有运行记录？")) return;
        await window.TicketBotJournal.clear();
        journalClearButton.textContent = "🧹 已清空";
        setTimeout(() => { journalClearButton.textContent = "🧹 清空"; }, 2000);
    });
}

loadAutoBooking();
