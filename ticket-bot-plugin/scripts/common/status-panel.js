/*
 * TicketBotStatusPanel —— 购票页右下角状态小框组件（显示状态机进度 + 控制按钮）。
 *
 * 平台脚本不用直接调用：在 TicketBotRuntime.createBot({ states: [...] }) 里声明状态机，
 * runtime 会自动创建小框并在每次 ctx.setState()/ctx.status() 时刷新。
 *
 *   states: [
 *       { key: "wait_open", label: "等待开售" },          // 按流程顺序排列，显示为步骤条
 *       { key: "captcha", label: "验证码", step: false },  // step:false 只提供中文名，不进步骤条
 *   ]
 *
 * 也可以单独使用：
 *   const panel = TicketBotStatusPanel.create({ label: "Melon", states, onPause, onResume, onStop });
 *   panel.update({ state, detail, message, running, paused, flowState });
 */
(function(global) {
    if (global.TicketBotStatusPanel) {
        return;
    }

    // runtime 自带的生命周期状态
    const LIFECYCLE_LABELS = {
        idle: "未运行",
        starting: "启动中",
        paused: "已暂停 · 等待人工",
        stopped: "已停止",
        handoff: "已交给下一页面",
        success: "成功",
    };
    const MAX_HISTORY = 6;

    function formatTime(date) {
        return date.toTimeString().slice(0, 8);
    }

    function create(options = {}) {
        const label = options.label || "TicketBot";
        const states = Array.isArray(options.states) ? options.states : [];
        const steps = states.filter(item => item.step !== false);
        const labels = Object.assign({}, LIFECYCLE_LABELS);
        states.forEach(item => { labels[item.key] = item.label || item.key; });

        let host = null;
        let parts = null;
        let collapsed = false;
        let lastView = {};
        const history = [];

        function stateLabel(key) {
            return labels[key] || key || "";
        }

        function mount() {
            if (parts && host && host.isConnected) return parts;
            if (!document.documentElement) return null;
            host = document.createElement("div");
            host.id = "ticket-bot-status";
            const root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
            root.innerHTML = `
                <style>
                    .box { position: fixed; right: 12px; bottom: 12px; z-index: 2147483647; width: 300px;
                        padding: 10px 12px; background: #111827; color: #f9fafb; border-radius: 8px;
                        font: 12px/1.45 Arial, "Microsoft YaHei", sans-serif; box-shadow: 0 8px 24px rgba(0,0,0,.3); }
                    .box.attention { box-shadow: 0 0 0 3px #f59e0b, 0 8px 24px rgba(0,0,0,.3); }
                    .head { display: flex; align-items: center; gap: 6px; font-weight: 700; }
                    .title { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                    .badge { font-weight: 400; font-size: 11px; padding: 1px 6px; border-radius: 9px; background: #374151; }
                    .badge.running { background: #065f46; } .badge.paused { background: #b45309; }
                    .badge.stopped { background: #4b5563; } .badge.success { background: #1d4ed8; }
                    .toggle { cursor: pointer; border: 0; background: transparent; color: #9ca3af; font-size: 14px; padding: 0 2px; }
                    .body[hidden] { display: none; }
                    ol { list-style: none; margin: 8px 0 0; padding: 0; }
                    li { display: flex; gap: 6px; color: #6b7280; padding: 1px 0; }
                    li.done { color: #9ca3af; } li.current { color: #fde68a; font-weight: 700; }
                    .detail { color: #d1d5db; font-weight: 400; }
                    .msg { margin-top: 8px; padding-top: 6px; border-top: 1px solid #374151;
                        white-space: pre-wrap; word-break: break-word; }
                    .history { margin-top: 6px; color: #9ca3af; font-size: 11px; max-height: 84px; overflow: auto; }
                    .btns { display: flex; gap: 6px; margin-top: 8px; }
                    .btns button { flex: 1; border: 0; border-radius: 4px; padding: 4px 6px; cursor: pointer;
                        font: 12px Arial, "Microsoft YaHei", sans-serif; color: #111827; background: #e5e7eb; }
                    .btns button.stop { background: #fca5a5; }
                    .btns button[hidden] { display: none; }
                </style>
                <div class="box">
                    <div class="head">
                        <span class="title"></span><span class="badge"></span>
                        <button class="toggle" type="button" title="折叠/展开">▾</button>
                    </div>
                    <div class="body">
                        <ol class="steps"></ol>
                        <div class="msg"></div>
                        <div class="history"></div>
                    </div>
                    <div class="btns">
                        <button class="pause" type="button">接管（暂停）</button>
                        <button class="resume" type="button">继续</button>
                        <button class="stop" type="button">停止</button>
                    </div>
                </div>`;
            parts = {
                box: root.querySelector(".box"),
                title: root.querySelector(".title"),
                badge: root.querySelector(".badge"),
                toggle: root.querySelector(".toggle"),
                body: root.querySelector(".body"),
                steps: root.querySelector(".steps"),
                msg: root.querySelector(".msg"),
                history: root.querySelector(".history"),
                pause: root.querySelector(".pause"),
                resume: root.querySelector(".resume"),
                stop: root.querySelector(".stop"),
            };
            parts.toggle.addEventListener("click", () => {
                collapsed = !collapsed;
                render(lastView);
            });
            parts.pause.addEventListener("click", () => options.onPause && options.onPause());
            parts.resume.addEventListener("click", () => options.onResume && options.onResume());
            parts.stop.addEventListener("click", () => options.onStop && options.onStop());
            document.documentElement.appendChild(host);
            return parts;
        }

        function renderSteps(view) {
            parts.steps.textContent = "";
            if (!steps.length) {
                parts.steps.hidden = true;
                return;
            }
            parts.steps.hidden = false;
            const currentIndex = steps.findIndex(item => item.key === view.flowState);
            steps.forEach((item, index) => {
                const li = document.createElement("li");
                const done = view.state === "success" || (currentIndex >= 0 && index < currentIndex);
                const current = index === currentIndex && view.state !== "success";
                li.className = done ? "done" : current ? "current" : "";
                const mark = document.createElement("span");
                mark.textContent = done ? "✓" : current ? "▶" : "○";
                const text = document.createElement("span");
                text.textContent = item.label || item.key;
                li.append(mark, text);
                if (current && view.flowDetail) {
                    const detail = document.createElement("span");
                    detail.className = "detail";
                    detail.textContent = `· ${view.flowDetail}`;
                    li.append(detail);
                }
                parts.steps.append(li);
            });
        }

        function render(view) {
            lastView = view || {};
            if (!mount()) return;
            const { state, detail, message, running, paused } = lastView;
            const badgeClass = paused ? "paused" : state === "success" ? "success" : running ? "running" : "stopped";
            const badgeText = paused ? "已暂停" : state === "success" ? "成功" : running ? "运行中" : stateLabel(state);
            const currentLabel = stateLabel(state);
            parts.title.textContent = `[${label}] ${currentLabel}${detail ? ` · ${detail}` : ""}`;
            parts.badge.textContent = badgeText;
            parts.badge.className = `badge ${badgeClass}`;
            parts.box.classList.toggle("attention", !!lastView.attention || !!paused);
            parts.body.hidden = collapsed;
            parts.toggle.textContent = collapsed ? "▸" : "▾";
            renderSteps(lastView);
            parts.msg.textContent = message || "";
            parts.history.textContent = history.join("\n");
            parts.history.style.whiteSpace = "pre-wrap";
            parts.pause.hidden = !running || paused;
            parts.resume.hidden = !paused;
            parts.stop.hidden = !running && !paused;
        }

        return {
            update: render,
            // 记录一条状态切换，显示在小框底部的历史里。
            record(state, detail) {
                history.unshift(`${formatTime(new Date())} ${stateLabel(state)}${detail ? ` · ${detail}` : ""}`);
                history.length = Math.min(history.length, MAX_HISTORY);
            },
            label: stateLabel,
            isStep: key => steps.some(item => item.key === key),
            destroy() {
                if (host) host.remove();
                host = null;
                parts = null;
            },
        };
    }

    global.TicketBotStatusPanel = { create, LIFECYCLE_LABELS };
})(typeof window !== "undefined" ? window : globalThis);
