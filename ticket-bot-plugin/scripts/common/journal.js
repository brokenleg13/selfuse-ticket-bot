/*
 * TicketBotJournal —— 运行记录（给 Agent 复盘卡点用）。
 *
 * runtime 会自动记录：状态切换、状态文字、推送、浏览器弹窗、命中的卡点规则、
 * 没有规则处理的异常（unhandled）、脚本错误。平台脚本可以用 ctx.observe() 补充接口返回等信号。
 *
 * 存在 chrome.storage.local["ticketBotJournal"]，只保留最近 N 条（config.runtime.journalSize）。
 * 插件首页可以“导出运行记录”，把 JSON 交给 Agent 分析，流程见 docs/incidents.md。
 * 不记录飞书 Webhook、Cookie、账号等敏感信息；页面地址只记路径。
 */
(function(global) {
    if (global.TicketBotJournal) {
        return;
    }

    const KEY = "ticketBotJournal";
    const FLUSH_MS = 1500;
    let pending = [];
    let timer = null;

    function storage() {
        try {
            return typeof chrome !== "undefined" && chrome.storage && chrome.storage.local || null;
        } catch (error) {
            return null;
        }
    }

    function limit() {
        const config = global.TicketBotConfig && global.TicketBotConfig.runtime || {};
        return Math.max(50, Number(config.journalSize) || 500);
    }

    function flush() {
        timer = null;
        const area = storage();
        const batch = pending;
        pending = [];
        if (!area || !batch.length) return Promise.resolve();
        return new Promise(resolve => {
            try {
                area.get(KEY, value => {
                    const list = (value && value[KEY] || []).concat(batch).slice(-limit());
                    area.set({ [KEY]: list }, resolve);
                });
            } catch (error) {
                resolve(); // 插件被重新加载后上下文失效
            }
        });
    }

    function add(entry) {
        pending.push(Object.assign({ t: new Date().toISOString() }, entry));
        if (!timer) timer = setTimeout(flush, FLUSH_MS);
    }

    function read() {
        const area = storage();
        if (!area) return Promise.resolve(pending.slice());
        return new Promise(resolve => area.get(KEY, value => resolve((value && value[KEY] || []).concat(pending))));
    }

    function clear() {
        pending = [];
        const area = storage();
        if (!area) return Promise.resolve();
        return new Promise(resolve => area.remove(KEY, resolve));
    }

    global.TicketBotJournal = { add, read, clear, flush, KEY };
})(typeof window !== "undefined" ? window : globalThis);
