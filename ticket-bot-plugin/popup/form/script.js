import { delete_value, get_stored_value, store_value } from "../module/storage.js";

const config = window.TicketBotConfig || {};
const storageKeys = config.storageKeys || { autoBooking: "autoBooking" };
const params = new URLSearchParams(window.location.search);
const editId = params.get("editId");
const platformParam = params.get("platform");
const preserveEmptyFields = new Set([
    "refreshIntervalMs",
    "refreshJitterMs",
    "areaScanIntervalMs",
    "maxAreaClicksPerRefresh",
    "maxSeatRow",
    "bookingSessionTimeoutMinutes",
    "delivery",
    "phoneNo",
    "mobileNo",
    "snsChannel",
    "snsId",
    "autoNext",
    "customer-id",
]);

window.onclick = function(event) {
    const target = event.target;
    if (target.classList.contains("close")) {
        window.history.back();
    }
}

function waitForIncludedFields() {
    if (document.querySelector('[name="concert-id"]')) {
        return new Promise(resolve => setTimeout(resolve, 0));
    }

    return new Promise(resolve => {
        document.addEventListener("include-html-loaded", () => {
            setTimeout(resolve, 0);
        }, { once: true });
    });
}

function getSubmitButton(form) {
    return form.querySelector('button[type="submit"]');
}

function normalizeBookingData(form) {
    let data = {};
    const formData = new FormData(form);
    for (const [key, value] of formData.entries()) {
        data[key] = value;
    }

    data.section = (data.section || "")
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);
    data.platform = platformParam || getSubmitButton(form).id;
    return data;
}

function mergeBookingData(existing, incoming) {
    const existingFlat = Object.assign({}, existing || {}, existing && existing.deliveryConfirmation || {});
    const merged = Object.assign({}, existing || {}, incoming);

    preserveEmptyFields.forEach(field => {
        if (incoming[field] === "" && existingFlat[field] !== undefined && existingFlat[field] !== null && existingFlat[field] !== "") {
            merged[field] = existingFlat[field];
        }
    });

    if (Array.isArray(incoming.section) && incoming.section.length === 0 && existing && Array.isArray(existing.section) && existing.section.length) {
        merged.section = existing.section;
    }

    return merged;
}

function fillForm(data) {
    const flatData = Object.assign({}, data, data.deliveryConfirmation || {});
    Object.entries(flatData).forEach(([key, value]) => {
        const input = document.querySelector(`[name="${key}"]`);
        if (!input) {
            return;
        }

        input.value = Array.isArray(value) ? value.join(",") : value;
    });
}

async function loadEditData(form) {
    if (!editId) {
        return;
    }

    const data = await get_stored_value(editId);
    if (!data) {
        return;
    }

    fillForm(data);
    getSubmitButton(form).textContent = "Update Configuration";
}

async function saveBooking(form) {
    const data = normalizeBookingData(form);
    let autoBooking = await get_stored_value(storageKeys.autoBooking) || [];
    const oldId = editId || data["concert-id"];
    const oldIndex = autoBooking.findIndex(booking => booking["concert-id"] === oldId);
    const storedOldData = oldId ? await get_stored_value(oldId) : null;
    const existingData = storedOldData || (oldIndex >= 0 ? autoBooking[oldIndex] : null);
    const mergedData = mergeBookingData(existingData, data);

    if (oldIndex >= 0) {
        autoBooking[oldIndex] = mergedData;
    } else {
        autoBooking.push(mergedData);
    }

    if (editId && editId !== mergedData["concert-id"]) {
        await delete_value(editId);
    }

    await store_value(mergedData["concert-id"], mergedData);
    await store_value(storageKeys.autoBooking, autoBooking);
}

document.addEventListener('DOMContentLoaded', async function() {
    await waitForIncludedFields();
    const form = document.querySelector('form');
    await loadEditData(form);

    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        const submitButton = getSubmitButton(form);
        submitButton.disabled = true;
        await saveBooking(form);
        window.history.back();
    });
});
