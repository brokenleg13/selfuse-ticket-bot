/*
 * TicketBotMainWorld —— 在页面自己的脚本环境（MAIN world）里点击元素。
 *
 * 内容脚本运行在隔离环境里，有些站点的按钮只有在页面环境里点击才生效
 * （例如 YES24 的预订按钮）。以前这一步靠油猴脚本完成，现在交给插件后台用
 * chrome.scripting.executeScript({ world: "MAIN" }) 注入执行，不再需要油猴。
 *
 *   const r = await TicketBotMainWorld.click('img.booking[src*="btn_booking2.gif"]', { frameIndex: 0 });
 *   if (!r.success) ctx.needHuman("没有点到预订按钮，请手动点击");
 *
 * frameIndex：省略表示当前页面的 document，数字表示 window.frames[n]（必须同源）。
 * 不会抛异常，失败时返回 { success: false, error }。
 */
(function(global) {
    if (global.TicketBotMainWorld) {
        return;
    }

    function click(selector, options = {}) {
        return new Promise(resolve => {
            try {
                chrome.runtime.sendMessage({
                    action: "mainWorldClick",
                    selector,
                    frameIndex: Number.isInteger(options.frameIndex) ? options.frameIndex : null,
                }, response => {
                    if (chrome.runtime.lastError) {
                        resolve({ success: false, error: chrome.runtime.lastError.message });
                        return;
                    }
                    resolve(response || { success: false, error: "后台没有响应" });
                });
            } catch (error) {
                resolve({ success: false, error: error && error.message || String(error) });
            }
        });
    }

    global.TicketBotMainWorld = { click };
})(typeof window !== "undefined" ? window : globalThis);
