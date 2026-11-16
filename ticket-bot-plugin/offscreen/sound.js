// 接收后台转发的播放请求，在 offscreen 页面里用 Web Audio 播放。
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!request || request.target !== "offscreen-sound" || request.action !== "playSound") {
        return;
    }
    window.TicketBotSound.playLocal(request.kind, request)
        .then(played => sendResponse({ success: played }));
    return true;
});
