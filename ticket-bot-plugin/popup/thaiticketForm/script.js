import {
    get_stored_value,
    store_value
} from "../../utils/storage.js";

document.addEventListener('DOMContentLoaded', () => {
    loadThaiConfig();

    document.getElementById('thai-start-button').addEventListener('click', () => {
        const config = getThaiConfigFromInputs();
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "startThaiticket", config: config });
        });
    });

    document.getElementById('thai-stop-button').addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "stopThaiticket" });
        });
    });

    document.getElementById('thai-save-button').addEventListener('click', saveThaiConfig);
});

function getThaiConfigFromInputs() {
    const blockSelect = document.getElementById('blockSelect').value.split(',').map(s => s.trim()).filter(Boolean);
    const leftBlock = document.getElementById('leftBlock').value.split(',').map(s => s.trim()).filter(Boolean);
    const rightBlock = document.getElementById('rightBlock').value.split(',').map(s => s.trim()).filter(Boolean);
    const groupNum = parseInt(document.getElementById('groupNum').value, 10);
    const refreshInterval = parseInt(document.getElementById('refreshInterval').value, 10);
    const maxSeatId = parseInt(document.getElementById('maxSeatId').value, 10);
    const timeout = parseInt(document.getElementById('timeout').value, 10);
    const webhookUrl = document.getElementById('webhookUrl').value;
    const strategy1 = document.getElementById('strategy1').checked;
    const strategy2 = document.getElementById('strategy2').checked;
    const strategy3 = document.getElementById('strategy3').checked;

    return {
        blockSelect,
        leftBlock,
        rightBlock,
        groupNum,
        refreshInterval,
        maxSeatId,
        timeout,
        webhookUrl,
        strategy1,
        strategy2,
        strategy3
    };
}

async function saveThaiConfig() {
    const config = getThaiConfigFromInputs();
    await store_value("thaiConfig", config);
    alert('Configuration saved!');
}

async function loadThaiConfig() {
    const config = await get_stored_value('thaiConfig');
    if (config) {
        document.getElementById('blockSelect').value = Array.isArray(config.blockSelect) ? config.blockSelect.join(',') : (config.blockSelect || '');
        document.getElementById('leftBlock').value = Array.isArray(config.leftBlock) ? config.leftBlock.join(',') : (config.leftBlock || 'A1,B1,C1');
        document.getElementById('rightBlock').value = Array.isArray(config.rightBlock) ? config.rightBlock.join(',') : (config.rightBlock || 'A2,B3,C2');
        document.getElementById('groupNum').value = config.groupNum || 2;
        document.getElementById('refreshInterval').value = config.refreshInterval || 1500;
        document.getElementById('maxSeatId').value = config.maxSeatId || 999;
        document.getElementById('timeout').value = config.timeout || 1500;
        document.getElementById('webhookUrl').value = config.webhookUrl || '';
        document.getElementById('strategy1').checked = config.strategy1 !== false;
        document.getElementById('strategy2').checked = config.strategy2 !== false;
        document.getElementById('strategy3').checked = config.strategy3 !== false;
    }
} 