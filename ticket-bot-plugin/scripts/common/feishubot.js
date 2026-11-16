/*
 * 飞书机器人推送。优先交给后台 Service Worker 发送（不受购票页 CORS 影响），
 * 后台不可用时再直接 fetch。平台脚本请通过 TicketBotRuntime 的 ctx.notify() 调用。
 */
function postFeiShuDirect(webhookUrl, payload) {
    return fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })
        .then(res => res.json())
        .then(json => console.log('飞书推送结果:', json))
        .catch(err => console.error('飞书推送错误:', err));
}

async function sendFeiShuMsg(webhookUrl, msg) {
    if (!webhookUrl) {
        console.log("WEBHOOK_URL未设置");
        return;
    }

    const payload = {
        msg_type: 'text',
        content: {
            text: msg,
        },
    };

    const action = (typeof window !== 'undefined' && window.TicketBotConfig && window.TicketBotConfig.actions || {}).notifyFeishu || 'notifyFeishu';
    try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ action, webhookUrl, payload }, response => {
                if (chrome.runtime.lastError || !response || !response.success) {
                    postFeiShuDirect(webhookUrl, payload);
                }
            });
            return;
        }
    } catch (error) {
        // 扩展上下文失效（插件被重新加载）时走直连。
    }
    postFeiShuDirect(webhookUrl, payload);
}
