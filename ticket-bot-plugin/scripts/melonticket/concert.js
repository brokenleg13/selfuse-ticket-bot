/*
 * Melon 演出详情页：等待开售 -> 选日期 -> 选场次 -> 点击预约。
 * 点击预约后会打开选座弹窗（onestop.htm），本页交接给 scripts/melonticket/seat.js。
 * 启停/接管/通知由 scripts/common/runtime.js 统一处理，这里只写页面步骤。
 */
(function() {
    const PLATFORM = "melon";
    const STATE = {
        WAIT_OPEN: "wait_open",
        SELECT_DATE: "select_date",
        SELECT_TIME: "select_time",
        RESERVE: "reserve",
    };

    const bot = TicketBotRuntime.createBot({
        platform: PLATFORM,
        getConcertId,
        matchesConfig: config => matchesConcert(config),
        // 开售前可能等很久，不做卡住检测。
        stallTimeouts: { [STATE.WAIT_OPEN]: 0 },
        states: [
            { key: STATE.WAIT_OPEN, label: "等待开售" },
            { key: STATE.SELECT_DATE, label: "选择日期" },
            { key: STATE.SELECT_TIME, label: "选择场次" },
            { key: STATE.RESERVE, label: "点击预约 → 选座弹窗" },
        ],
        onStart: runFlow,
    });
    const ctx = bot.ctx;

    function getConcertId() {
        const input = document.getElementById("prodIdNum");
        return input ? input.value : new URLSearchParams(location.search).get("prodId") || "";
    }

    function normalizeConcertId(value) {
        const text = String(value || "").trim();
        if (!/^https?:\/\//i.test(text)) return text;
        try {
            return new URL(text).searchParams.get("prodId") || text;
        } catch (error) {
            return text;
        }
    }

    function matchesConcert(config) {
        const target = normalizeConcertId(config && config["concert-id"]);
        const current = getConcertId();
        return !target || !current || target === current;
    }

    // ---------- 页面元素操作 ----------

    async function waitForChildren(id, timeoutMs, intervalMs = 100) {
        const deadline = Date.now() + timeoutMs;
        let element = document.getElementById(id);
        while ((!element || element.childElementCount === 0) && Date.now() < deadline) {
            await ctx.sleep(intervalMs);
            element = document.getElementById(id);
        }
        return element;
    }

    function isPlaceOpen() {
        const box = document.getElementsByClassName("box_ticketing_process")[0];
        return !!box && box.style.display !== "none";
    }

    async function selectDay(day) {
        const list = await waitForChildren("list_date", ctx.num("elementWaitTimeoutMs", 3000));
        if (!list || list.childElementCount <= 1) return;
        for (const item of list.children) {
            if (item.getAttribute("data-perfday") == day) {
                item.children[0].click();
                return;
            }
        }
    }

    async function selectTime(time) {
        const list = await waitForChildren("list_time", ctx.num("elementWaitTimeoutMs", 3000));
        if (!list || list.childElementCount <= 1) return;
        for (const item of list.children) {
            const label = item.children[0] && item.children[0].children[0];
            if (label && label.innerHTML.includes(time)) {
                item.children[0].click();
                return;
            }
        }
    }

    // ---------- 流程 ----------

    async function runFlow(ctx, gen) {
        const data = ctx.config;
        ctx.setState(STATE.WAIT_OPEN);
        while (!isPlaceOpen()) {
            if (!ctx.isActive(gen)) return;
            ctx.status("等待开售");
            await ctx.sleep(ctx.num("concertOpenRetryMs", 200));
        }

        const actionDelay = ctx.num("concertActionDelayMs", 500);
        await ctx.sleep(actionDelay);
        if (!ctx.isActive(gen)) return;

        ctx.setState(STATE.SELECT_DATE, data.date || "");
        await selectDay(String(data.date || "").replaceAll("-", ""));
        await ctx.sleep(actionDelay);
        if (!ctx.isActive(gen)) return;

        ctx.setState(STATE.SELECT_TIME, data.time || "");
        if (data.time) {
            await selectTime(formatTime(data.time));
        }
        await ctx.sleep(actionDelay);

        ctx.setState(STATE.RESERVE);
        ctx.status("准备点击预约");
        await ctx.sleep(ctx.num("reservationClickDelayMs", 5000));
        if (!ctx.isActive(gen)) return;

        const button = document.getElementsByClassName("reservationBtn")[0];
        if (!button) {
            await ctx.pause("没有找到预约按钮，请手动操作");
            return;
        }
        button.click();
        ctx.handoff("已点击预约，选座弹窗接管后续流程");
    }

    bot.autoStart();
})();
