/*
 * TicketBotRuntime —— 所有平台共用的运行框架（content script）。
 *
 * 平台脚本只写“业务步骤”，启停、暂停/人工接管、运行状态同步、看门狗、
 * 状态小框、飞书推送都由这里统一处理。用法：
 *
 *   const bot = TicketBotRuntime.createBot({
 *       platform: "melon",                       // 与 TicketBotConfig.platforms 的 key 一致
 *       getConcertId() { return "123"; },         // 当前页面对应的演出 ID，用于匹配卡片
 *       matchesConfig(config) { return true; },   // 可选：卡片是否适用于当前页面
 *       async onStart(ctx, gen) { ... },          // 开始/继续时调用；循环里用 ctx.isActive(gen) 判断是否该退出
 *       onHalt(ctx) { ... },                      // 可选：停止/暂停时清理定时器等
 *       stallTimeouts: { scanning: 0 },           // 可选：按状态覆盖卡住阈值，0 表示该状态不检测
 *       states: [                                 // 可选：状态机，显示在状态小框里（scripts/common/status-panel.js）
 *           { key: "wait_open", label: "等待开售" },
 *           { key: "captcha", label: "验证码", step: false },  // step:false 不进步骤条，只提供中文名
 *       ],
 *   });
 *   bot.autoStart();                              // 页面加载时按 runState 自动恢复
 *
 * ctx 常用方法：
 *   ctx.config                 当前卡片配置
 *   ctx.num(key, fallback)     读数字配置：卡片 > config.js 平台默认 > runtime 默认 > fallback
 *   ctx.value(key, fallback)   读任意配置
 *   ctx.isActive(gen)          仍在运行且未暂停，且 gen 是最新一轮（停止/暂停/继续都会让旧循环失效）
 *   ctx.setState(state, text)  切换流程状态（会记录日志、刷新状态小框、重置卡住计时）
 *   ctx.status(text)           更新状态文字（同时算作“有进展”）
 *   ctx.notify(event, text)    推送飞书并按配置播放提示音，event 见 config.runtime.notifyEvents
 *                              text 只写“结果：详情”，平台名、事件、当前步骤、时间由 formatMessage 统一加上
 *
 * 提示文字约定（状态小框、飞书都一样）：中文，“结果：详情”，多项用“，”分隔，结尾不加句号，
 * 例如 “锁座成功：区域 004，2 排，12 号”。只把关键结果交给 notify，过程信息用 ctx.status()。
 *   ctx.needHuman(text)        需要人工操作（例如手动输入验证码）：响提示音、推送、小框高亮；同一状态只提醒一次
 *   ctx.sound(kind)            直接播放提示音：takeover / alert / success / info
 *   ctx.success(text)          成功：推送并停止
 *   ctx.stop(reason)           脚本主动停止：推送 stop 事件
 *   ctx.pause(reason)          暂停并等待人工接管：推送 pause 事件，可从小框/插件点“继续”
 *   ctx.handoff(text)          本页工作已完成，交给下一个页面继续（不改变全局运行状态）
 *   ctx.observe(kind, text)    上报一个运行信号（例如 kind="api", text="HTTP 429"），按卡点规则处理并写运行记录
 *
 * 卡点规则（config.js 的 platforms.<平台>.rules，详见 docs/incidents.md）：
 *   { id, on: "dialog"|"page-text"|"api"|"any", match: "正则", state?: "只在某状态生效",
 *     action: "alert"|"human"|"pause"|"stop"|"ignore", message: "给人看的说明", ref: "来源/issue" }
 * 浏览器弹窗（alert/confirm/prompt）会被 beforeunload-blocker.js 自动关闭并转给这里：
 * 命中规则按规则处理；没命中的也会推送 alert，并在运行记录里标成 unhandled，等 Agent 补规则。
 *
 * 运行状态保存在 chrome.storage.sync[storageKeys.botRunState]：
 *   { running, paused, platform, concertId, config, updatedAt }
 * 所有页面都监听它的变化，所以在任意标签页/弹出窗口/插件里点“停止”“接管”“继续”都会同步生效。
 * “开始”只作用于当前标签页，以及之后新打开的匹配页面（页面加载时 autoStart）。
 */
(function(global) {
    if (global.TicketBotRuntime) {
        return;
    }

    const appConfig = global.TicketBotConfig || {};
    const storageKeys = appConfig.storageKeys || { botRunState: "ticketBotRunState" };
    const actions = Object.assign({
        startBot: "startTicketBot",
        stopBot: "stopTicketBot",
        pauseBot: "pauseTicketBot",
        resumeBot: "resumeTicketBot",
    }, appConfig.actions || {});
    const runtimeDefaults = Object.assign({
        stallTimeoutMs: 180000,
        pageAlertCheckMs: 3000,
        pageAlertRepeatMs: 60000,
        notifyEvents: "human,stalled,alert,error,pause,success,stop",
        statusPanel: true,
        soundEnabled: true,
        soundEvents: "human,pause,stop,stalled,alert,error,success",
        soundVolume: 0.6,
    }, appConfig.runtime || {});
    const RUN_STATE_KEY = storageKeys.botRunState || "ticketBotRunState";
    const EVENT_LABELS = {
        start: "开始",
        detail: "进度",
        human: "需要人工",
        stalled: "卡住",
        alert: "页面提示",
        error: "异常",
        pause: "已暂停",
        success: "成功",
        stop: "已停止",
    };

    // 事件对应的提示音类型
    const EVENT_SOUNDS = {
        human: "takeover",
        pause: "takeover",
        stop: "takeover",
        stalled: "alert",
        alert: "alert",
        error: "alert",
        success: "success",
    };

    function isEmpty(value) {
        return value === undefined || value === null || value === "";
    }

    function hasChrome() {
        return typeof chrome !== "undefined" && chrome && chrome.runtime;
    }

    function readStore(key) {
        if (typeof get_stored_value === "function") {
            return get_stored_value(key);
        }
        return Promise.resolve(undefined);
    }

    function writeStore(key, value) {
        if (typeof store_value === "function") {
            return store_value(key, value);
        }
        return Promise.resolve();
    }

    function createBot(def) {
        const platform = def.platform;
        const platformMeta = appConfig.platforms && appConfig.platforms[platform] || {};
        const label = def.label || platformMeta.label || platform;
        // 卡点规则：config.js 的 platforms.<平台>.rules + createBot({ rules })
        const rules = (platformMeta.rules || []).concat(def.rules || []).map(rule => Object.assign({}, rule, {
            pattern: rule.match instanceof RegExp ? rule.match : new RegExp(rule.match || "(?!)", "i"),
            on: rule.on || "any",
            action: rule.action || "alert",
        }));
        const isTopFrame = (() => {
            try {
                return global.top === global;
            } catch (error) {
                return false;
            }
        })();

        let running = false;
        let paused = false;
        let generation = 0;
        let config = {};
        let state = "idle";
        let stateDetail = "";
        let message = "";
        let lastProgressAt = Date.now();
        let stallNotified = false;
        let watchdogTimer = null;
        let flowState = "";       // 最近一个属于状态机步骤的状态，暂停/停止时步骤条仍停在这里
        let flowDetail = "";
        let attentionKey = "";    // needHuman 去重
        const recentAlerts = new Map();
        const stepKeys = new Set((def.states || []).filter(item => item.step !== false).map(item => item.key));
        const stateLabels = {
            idle: "未运行", starting: "启动中", paused: "已暂停", stopped: "已停止", handoff: "已交给下一页面", success: "成功",
        };
        (def.states || []).forEach(item => { stateLabels[item.key] = item.label || item.key; });

        function stateText() {
            const name = stateLabels[state] || state;
            return stateDetail ? `${name}（${stateDetail}）` : name;
        }

        // 飞书消息统一格式：
        //   【Interpark】成功
        //   锁座成功：区域 004，2 排，12 号
        //   步骤：刷座位（004） | 时间：2026/11/16 20:00:00
        function formatMessage(event, text) {
            const eventLabel = EVENT_LABELS[event] || event;
            return `【${label}】${eventLabel}\n${text}\n步骤：${stateText()} | 时间：${new Date().toLocaleString()}`;
        }

        function log(text) {
            console.log(`[${label}] ${text}`);
        }

        function getValue(key, fallback) {
            if (config && !isEmpty(config[key])) return config[key];
            const platformDefaults = appConfig[platform] || {};
            if (!isEmpty(platformDefaults[key])) return platformDefaults[key];
            if (!isEmpty(runtimeDefaults[key])) return runtimeDefaults[key];
            return fallback;
        }

        function getNumber(key, fallback) {
            const number = Number(getValue(key, fallback));
            return Number.isFinite(number) ? number : fallback;
        }

        function enabledEvents() {
            return String(getValue("notifyEvents", "")).split(",").map(item => item.trim()).filter(Boolean);
        }

        function playSound(kind) {
            if (!isTopFrame || typeof TicketBotSound === "undefined") return;
            const enabled = String(getValue("soundEnabled", true)) !== "false";
            if (!enabled) return;
            TicketBotSound.play(kind, { volume: getNumber("soundVolume", 0.6) });
        }

        function soundForEvent(event) {
            const events = String(getValue("soundEvents", "")).split(",").map(item => item.trim()).filter(Boolean);
            if (events.includes("none") || !events.includes(event)) return;
            playSound(EVENT_SOUNDS[event] || "info");
        }

        function notify(event, text) {
            log(`notify(${event}): ${text}`);
            soundForEvent(event);
            const webhookUrl = config && config["feishu-bot-id"];
            if (!webhookUrl || typeof sendFeiShuMsg !== "function") {
                return;
            }
            if (!enabledEvents().includes(event)) {
                return;
            }
            sendFeiShuMsg(webhookUrl, formatMessage(event, text));
        }

        // ---------- 运行记录 & 卡点规则 ----------

        function journal(type, text, extra) {
            if (typeof TicketBotJournal === "undefined") return;
            TicketBotJournal.add(Object.assign({
                platform,
                page: location.pathname,
                state,
                type,
                text: String(text || "").slice(0, 500),
            }, extra || {}));
        }

        function findRule(kind, text) {
            return rules.find(rule => (rule.on === "any" || rule.on === kind)
                && (!rule.state || rule.state === state)
                && rule.pattern.test(text));
        }

        // 同一条规则/同一段文字在 pageAlertRepeatMs 内只处理一次，避免刷屏
        function isRepeated(key) {
            const now = Date.now();
            const lastAt = recentAlerts.get(key) || 0;
            if (now - lastAt < getNumber("pageAlertRepeatMs", 60000)) return true;
            recentAlerts.set(key, now);
            return false;
        }

        function applyRule(rule, kind, text) {
            const summary = rule.message ? `${rule.message}：${text}` : text;
            journal("rule", text, { kind, rule: rule.id, action: rule.action });
            if (rule.action === "ignore") return;
            status(summary);
            if (rule.action === "human") needHuman(summary);
            else if (rule.action === "pause") pauseLocal(summary);
            else if (rule.action === "stop") stopLocal(summary, { event: "stop" });
            else notify("alert", summary);
            if (def.onRule) def.onRule(ctx, rule, text);
        }

        // kind: dialog / page-text / api / 其他自定义信号
        function observe(kind, text, options = {}) {
            const value = String(text || "").replace(/\s+/g, " ").trim();
            if (!value) return null;
            const rule = findRule(kind, value);
            if (rule) {
                if (!isRepeated(`${rule.id}|${value}`)) applyRule(rule, kind, value);
                return rule;
            }
            if (options.unhandled !== false) {
                if (!isRepeated(`unhandled|${kind}|${value}`)) {
                    journal("unhandled", value, { kind });
                    if (options.notify) {
                        status(options.notify);
                        notify("alert", options.notify);
                    }
                }
            }
            return null;
        }

        function getConcertId() {
            try {
                return def.getConcertId ? def.getConcertId() : "";
            } catch (error) {
                return "";
            }
        }

        // 卡片/运行状态是否适用于当前页面：优先用平台自己的 matchesConfig，否则比较演出 ID。
        function matchesConfig(candidate, concertId) {
            if (def.matchesConfig) {
                return def.matchesConfig(candidate || {});
            }
            const currentId = getConcertId();
            return !concertId || !currentId || String(concertId) === String(currentId);
        }

        async function writeRunState(patch) {
            const current = await readStore(RUN_STATE_KEY) || {};
            const base = current.platform === platform ? current : {};
            await writeStore(RUN_STATE_KEY, Object.assign({}, base, {
                platform,
                concertId: base.concertId || getConcertId(),
                updatedAt: Date.now(),
            }, patch));
        }

        function progress() {
            lastProgressAt = Date.now();
            stallNotified = false;
        }

        function setState(next, detail) {
            const changed = next !== state || (detail || "") !== stateDetail;
            state = next;
            stateDetail = detail || "";
            if (stepKeys.has(next)) {
                flowState = next;
                flowDetail = stateDetail;
            }
            progress();
            if (changed) {
                attentionKey = "";
                log(`state -> ${next}${detail ? `: ${detail}` : ""}`);
                if (panel) panel.record(next, detail);
                journal("state", detail || "", { to: next });
            }
            renderPanel();
        }

        function status(text) {
            if (text !== message) journal("status", text);
            message = text;
            progress();
            log(text);
            renderPanel();
        }

        function needHuman(text) {
            const key = `${state}|${text}`;
            status(text);
            // 只在运行中提醒；已暂停说明人已经在接管了
            if (!running || paused || attentionKey === key) return;
            attentionKey = key;
            renderPanel();
            journal("human", text);
            notify("human", text);
        }

        // ---------- 生命周期 ----------

        function halt() {
            generation += 1;
            try {
                def.onHalt && def.onHalt(ctx);
            } catch (error) {
                console.error(`[${label}] onHalt failed`, error);
            }
        }

        function runStep(gen) {
            Promise.resolve()
                .then(() => def.onStart(ctx, gen))
                .catch(error => {
                    console.error(`[${label}] flow error`, error);
                    if (gen !== generation) {
                        return;
                    }
                    journal("error", error && (error.stack || error.message) || String(error));
                    notify("error", `脚本异常：${error && error.message || error}`);
                    pauseLocal(`脚本异常：${error && error.message || error}`, { persist: true, silent: true });
                });
        }

        async function start(newConfig, options = {}) {
            if (newConfig) {
                config = newConfig;
            }
            if (running && !paused) {
                return;
            }
            running = true;
            paused = false;
            if (!options.resumed) {
                flowState = "";
                flowDetail = "";
            }
            attentionKey = "";
            generation += 1; // 让旧一轮循环失效
            const gen = generation;
            setState("starting");
            status(options.resumed ? "已继续运行" : "已开始");
            if (!options.resumed && !options.silent) {
                notify("start", `开始运行：${location.pathname}`);
            }
            startWatchdog();
            runStep(gen);
        }

        async function stopLocal(reason, options = {}) {
            const wasActive = running;
            running = false;
            paused = false;
            halt();
            stopWatchdog();
            setState("stopped", reason || "");
            status(reason ? `已停止：${reason}` : "已停止");
            if (options.persist !== false) {
                await writeRunState({ running: false, paused: false, concertId: getConcertId() });
            }
            if (wasActive && options.event) {
                notify(options.event, reason || "");
            }
        }

        async function pauseLocal(reason, options = {}) {
            if (!running || paused) {
                return;
            }
            paused = true;
            halt();
            setState("paused", reason || "");
            status(`已暂停${reason ? `：${reason}` : ""}，可手动操作，点“继续”恢复`);
            if (options.persist !== false) {
                await writeRunState({ running: true, paused: true });
            }
            if (!options.silent) {
                notify("pause", reason || "人工接管");
            }
        }

        async function resumeLocal(options = {}) {
            if (!running || !paused) {
                return;
            }
            paused = false;
            if (options.persist !== false) {
                await writeRunState({ running: true, paused: false });
            }
            running = false;
            await start(null, { resumed: true });
        }

        function handoff(text) {
            running = false;
            paused = false;
            halt();
            stopWatchdog();
            setState("handoff", text || "");
            status(text || "本页已完成，交给下一页面继续");
        }

        // ---------- 看门狗 ----------

        function getStallTimeout() {
            const overrides = def.stallTimeouts || {};
            if (Object.prototype.hasOwnProperty.call(overrides, state)) {
                return Number(overrides[state]) || 0;
            }
            return getNumber("stallTimeoutMs", 0);
        }

        function collectPageText() {
            const texts = [];
            const docs = [document];
            Array.from(document.querySelectorAll("iframe")).forEach(frame => {
                try {
                    if (frame.contentDocument) docs.push(frame.contentDocument);
                } catch (error) {
                    // 跨域 iframe 读不到，忽略。
                }
            });
            docs.forEach(doc => {
                const body = doc && doc.body;
                if (!body) return;
                texts.push(typeof body.innerText === "string" ? body.innerText : body.textContent || "");
            });
            return texts.join("\n");
        }

        // 定期扫描页面（含同源 iframe）可见文字，交给 on: "page-text" / "any" 的规则
        function checkPageAlerts() {
            if (!rules.some(rule => rule.on === "page-text" || rule.on === "any")) return;
            const text = collectPageText();
            rules.forEach(rule => {
                if (!(rule.on === "page-text" || rule.on === "any") || (rule.state && rule.state !== state)) return;
                const match = text.match(rule.pattern);
                if (!match) return;
                const start = Math.max(0, match.index - 40);
                const snippet = text.slice(start, match.index + match[0].length + 40).replace(/\s+/g, " ").trim();
                if (!isRepeated(`${rule.id}|${snippet}`)) applyRule(rule, "page-text", snippet);
            });
        }

        function watchdogTick() {
            if (!running || paused) return;
            const stallMs = getStallTimeout();
            if (stallMs > 0 && !stallNotified && Date.now() - lastProgressAt > stallMs) {
                stallNotified = true;
                const seconds = Math.round((Date.now() - lastProgressAt) / 1000);
                status(`已 ${seconds} 秒没有进展，请检查页面`);
                stallNotified = true; // status() 会重置，这里重新标记，避免重复推送
                notify("stalled", `已 ${seconds} 秒没有进展，请检查页面，最后信息：${message}`);
            }
            try {
                checkPageAlerts();
            } catch (error) {
                console.warn(`[${label}] page alert check failed`, error);
            }
        }

        function startWatchdog() {
            stopWatchdog();
            progress();
            watchdogTimer = setInterval(watchdogTick, Math.max(500, getNumber("pageAlertCheckMs", 3000)));
        }

        function stopWatchdog() {
            if (watchdogTimer) {
                clearInterval(watchdogTimer);
                watchdogTimer = null;
            }
        }

        // ---------- 状态小框（组件见 scripts/common/status-panel.js） ----------

        const panel = isTopFrame && runtimeDefaults.statusPanel && typeof TicketBotStatusPanel !== "undefined"
            ? TicketBotStatusPanel.create({
                label,
                states: def.states || [],
                onPause: () => pauseLocal("在页面上点击了接管"),
                onResume: () => resumeLocal(),
                onStop: () => stopLocal("在页面上点击了停止"),
            })
            : null;

        function renderPanel() {
            if (!panel || (!running && !paused && state === "idle")) {
                return;
            }
            panel.update({
                state,
                detail: stateDetail,
                message,
                running,
                paused,
                flowState,
                flowDetail,
                attention: !!attentionKey,
            });
        }

        // 被屏蔽的浏览器弹窗（beforeunload-blocker.js 在页面环境里转发过来）
        if (isTopFrame && typeof global.addEventListener === "function") {
            global.addEventListener("message", event => {
                const data = event && event.data;
                if (!data || data.source !== "ticket-bot-dialog") return;
                const text = String(data.message || "");
                journal("dialog", text, { dialog: data.type, frame: data.frame });
                if (!running || paused) return;
                observe("dialog", text, { notify: `浏览器弹窗（已自动关闭）：${text || "(空)"}` });
            });
        }

        // ---------- 消息与存储同步 ----------

        function isForThisPlatform(request) {
            return !request.platform || request.platform === platform;
        }

        if (hasChrome() && chrome.runtime.onMessage) {
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                if (!request || !isForThisPlatform(request)) {
                    return;
                }
                if (request.action === actions.startBot) {
                    if (matchesConfig(request.config, request.concertId)) {
                        start(request.config);
                    }
                    sendResponse({ status: "started" });
                    return true;
                }
                if (request.action === actions.stopBot) {
                    stopLocal("插件中点击了停止");
                    sendResponse({ status: "stopped" });
                    return true;
                }
                if (request.action === actions.pauseBot) {
                    pauseLocal("插件中点击了接管");
                    sendResponse({ status: "paused" });
                    return true;
                }
                if (request.action === actions.resumeBot) {
                    resumeLocal();
                    sendResponse({ status: "resumed" });
                    return true;
                }
            });
        }

        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
            chrome.storage.onChanged.addListener((changes, area) => {
                if (area !== "sync" || !changes[RUN_STATE_KEY]) {
                    return;
                }
                const next = changes[RUN_STATE_KEY].newValue;
                if (!next || next.platform !== platform) {
                    if (running || paused) {
                        stopLocal("已切换到其他平台", { persist: false });
                    }
                    return;
                }
                if (!next.running) {
                    if (running || paused) {
                        stopLocal("运行状态已停止", { persist: false });
                    }
                    return;
                }
                if (next.paused && running && !paused) {
                    pauseLocal("其他页面或插件点击了接管", { persist: false, silent: true });
                    return;
                }
                if (!next.paused && paused) {
                    resumeLocal({ persist: false });
                }
                // “开始”不通过存储广播：只启动当前标签页（插件消息）和之后新打开的页面（autoStart），
                // 避免后台残留的旧页面（例如已点过购买的演出页）被重新拉起。
            });
        }

        async function autoStart() {
            const runState = await readStore(RUN_STATE_KEY);
            if (!runState || !runState.running || runState.platform !== platform) {
                return false;
            }
            if (!matchesConfig(runState.config, runState.concertId)) {
                return false;
            }
            config = runState.config || {};
            if (runState.paused) {
                running = true;
                paused = true;
                setState("paused", "页面刷新前处于暂停");
                status("处于暂停状态，点“继续”恢复");
                return true;
            }
            await start(config, { silent: true });
            return true;
        }

        const ctx = {
            platform,
            label,
            get config() { return config; },
            set config(value) { config = value || {}; },
            get state() { return state; },
            get generation() { return generation; },
            isRunning: () => running,
            isPaused: () => paused,
            isActive: gen => running && !paused && (gen === undefined || gen === generation),
            num: getNumber,
            value: getValue,
            url(name, values) {
                const template = platformMeta.urls && platformMeta.urls[name];
                return appConfig.formatUrl ? appConfig.formatUrl(template, values) : template;
            },
            setState,
            status,
            notify,
            needHuman,
            sound: playSound,
            observe,
            log,
            sleep: ms => new Promise(resolve => setTimeout(resolve, ms)),
            success: text => {
                notify("success", text || "成功"); // 先推送，消息里的“步骤”是成功前的最后一步
                setState("success", text || "");
                return stopLocal(text || "成功");
            },
            stop: reason => stopLocal(reason, { event: "stop" }),
            pause: reason => pauseLocal(reason),
            handoff,
            markRunStateStopped: () => writeRunState({ running: false, paused: false, concertId: getConcertId() }),
        };

        return {
            ctx,
            start,
            stop: reason => stopLocal(reason),
            pause: reason => pauseLocal(reason),
            resume: () => resumeLocal(),
            autoStart,
        };
    }

    global.TicketBotRuntime = { createBot, actions, RUN_STATE_KEY };
})(typeof window !== "undefined" ? window : globalThis);
