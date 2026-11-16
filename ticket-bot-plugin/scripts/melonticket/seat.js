/*
 * Melon 选座弹窗（onestop.htm）：等待安全验证 -> 轮询配置区域 -> 点可选座位 -> 下一步。
 * 启停/接管/通知/卡住检测/页面提示（try again 等）由 scripts/common/runtime.js 统一处理，
 * 卡点规则（try again 等）在 config.js 的 platforms.melon.rules 配置，记录见 docs/incidents/melon.md。
 */
(function() {
    const PLATFORM = "melon";
    const STATE = {
        WAIT_LOAD: "wait_load",
        WAIT_CERT: "wait_certification",
        SCANNING: "scanning",
        CAPTCHA: "captcha",
        NEXT_STEP: "next_step",
    };

    const bot = TicketBotRuntime.createBot({
        platform: PLATFORM,
        getConcertId,
        matchesConfig: config => matchesConcert(config),
        // 人工输入验证码可能较慢，不做卡住检测。
        stallTimeouts: { [STATE.WAIT_CERT]: 0, [STATE.CAPTCHA]: 0 },
        states: [
            { key: STATE.WAIT_LOAD, label: "等待选座页加载" },
            { key: STATE.WAIT_CERT, label: "安全验证码（人工）" },
            { key: STATE.SCANNING, label: "轮询区域找座位" },
            { key: STATE.CAPTCHA, label: "选座后验证码（人工）" },
            { key: STATE.NEXT_STEP, label: "下一步 → 后续请人工完成" },
        ],
        onStart: runFlow,
    });
    const ctx = bot.ctx;

    function getConcertId() {
        const input = document.getElementById("prodId");
        return input ? input.value : "";
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

    function frameDocument() {
        const frame = document.getElementById("oneStopFrame");
        return frame && frame.contentWindow && frame.contentWindow.document;
    }

    function isCertificationVisible() {
        const cert = document.getElementById("certification");
        return !!cert && cert.style.display !== "none";
    }

    async function waitForElement(doc, id, timeoutMs, intervalMs = 100) {
        const deadline = Date.now() + timeoutMs;
        let element = doc && doc.getElementById(id);
        while (!element && Date.now() < deadline) {
            await ctx.sleep(intervalMs);
            element = doc && doc.getElementById(id);
        }
        return element;
    }

    function openRangeList() {
        const doc = frameDocument();
        const closed = doc && doc.querySelector(".seat_name:not(.open)");
        if (closed) closed.click();
    }

    function clickOnArea(area) {
        const doc = frameDocument();
        if (!doc) return false;
        const pattern = new RegExp(`${String(area).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
        for (const title of doc.getElementsByClassName("area_tit")) {
            if (pattern.test(title.innerHTML)) {
                title.parentElement.click();
                return true;
            }
        }
        return false;
    }

    function unavailableFills() {
        return String(ctx.value("unavailableSeatFills", "#DDDDDD,none"))
            .split(",").map(item => item.trim().toUpperCase()).filter(Boolean);
    }

    // 点第一个可选座位并点“下一步”，成功返回 true。
    async function pickSeat() {
        const doc = frameDocument();
        const canvas = await waitForElement(doc, "ez_canvas", ctx.num("elementWaitTimeoutMs", 3000));
        if (!canvas) return false;
        await ctx.sleep(ctx.num("seatRenderDelayMs", 750));
        const blocked = unavailableFills();
        for (const rect of canvas.getElementsByTagName("rect")) {
            const fill = String(rect.getAttribute("fill") || "none").toUpperCase();
            if (blocked.includes(fill)) continue;
            rect.dispatchEvent(new Event("click", { bubbles: true }));
            const nextBtn = await waitForElement(doc, "nextTicketSelection", ctx.num("elementWaitTimeoutMs", 3000));
            if (!nextBtn) {
                // 选座没生效（例如被退回区域列表），试下一个座位。
                continue;
            }
            nextBtn.click();
            return true;
        }
        return false;
    }

    async function waitCertification(gen, state) {
        if (!isCertificationVisible()) return true;
        ctx.setState(state);
        ctx.needHuman("等待安全验证码，请手动输入");
        while (isCertificationVisible()) {
            if (!ctx.isActive(gen)) return false;
            await ctx.sleep(ctx.num("captchaPollIntervalMs", 1000));
        }
        return true;
    }

    // ---------- 流程 ----------

    async function runFlow(ctx, gen) {
        const sections = Array.isArray(ctx.config.section) ? ctx.config.section : [];
        if (!sections.length) {
            await ctx.pause("卡片没有配置区域");
            return;
        }

        ctx.setState(STATE.WAIT_LOAD);
        await ctx.sleep(ctx.num("initialSeatDelayMs", 5000));
        if (!await waitCertification(gen, STATE.WAIT_CERT) || !ctx.isActive(gen)) return;

        openRangeList();
        await ctx.sleep(ctx.num("sectionOpenDelayMs", 1000));

        ctx.setState(STATE.SCANNING, sections.join(","));
        let round = 0;
        while (ctx.isActive(gen)) {
            round += 1;
            for (const section of sections) {
                if (!ctx.isActive(gen)) return;
                ctx.status(`第 ${round} 轮，检查区域 ${section}`);
                openRangeList();
                clickOnArea(section);
                if (await pickSeat()) {
                    if (!ctx.isActive(gen)) return;
                    if (!await waitCertification(gen, STATE.CAPTCHA)) return;
                    ctx.setState(STATE.NEXT_STEP, section);
                    await ctx.sleep(500);
                    const nextBtn = await waitForElement(frameDocument(), "nextTicketSelection", ctx.num("elementWaitTimeoutMs", 3000));
                    if (nextBtn) nextBtn.click();
                    await ctx.success(`区域 ${section} 已选座并进入下一步，请在页面完成后续步骤；如被退回选区页，可重新点开始`);
                    return;
                }
                await ctx.sleep(ctx.num("areaRetryIntervalMs", 750) + Math.random() * ctx.num("areaRetryJitterMs", 500));
            }
            await ctx.sleep(ctx.num("seatRetryDelayMs", 1000));
        }
    }

    bot.autoStart();
})();
