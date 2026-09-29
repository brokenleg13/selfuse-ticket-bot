// Runs only in the page MAIN world, through the extension service worker.
// API names and response layouts verified against NOL onestop-v2 e6a330.
(function () {
    if (window.ticketBotOnestopBridge) return;
    let runtime;
    let service;
    let cachedKey = "";
    let blocks = [];
    const metadata = new Map();
    let selectionEpoch = 0;

    function getService() {
        if (service) return service;
        const chunks = window.webpackChunk_N_E;
        if (!chunks || typeof chunks.push !== "function") throw new Error("新版页面尚未加载请求客户端");
        if (!runtime) chunks.push([[`ticket-bot-${Date.now()}`], {}, require => { runtime = require; }]);
        if (!runtime?.m) throw new Error("新版页面模块结构发生变化");
        // Discover by API shape, not deployment-specific webpack module numbers.
        for (const [id, factory] of Object.entries(runtime.m)) {
            const source = Function.prototype.toString.call(factory);
            if (!source.includes("getSeatsStatus:") || !source.includes("getSeatsMeta:")) continue;
            for (const value of Object.values(runtime(id))) {
                if (typeof value?.getSeatsStatus === "function" && typeof value?.getSeatsMeta === "function") {
                    service = value;
                    return service;
                }
            }
        }
        throw new Error("找不到新版区域查询客户端；请更新适配器");
    }

    function context() {
        const data = JSON.parse(sessionStorage.getItem("interpark/context") || "{}");
        const goods = data.goods;
        const playSeq = data.playSeq?.playSeq;
        if (!goods?.goodsCode || !goods.placeCode || !playSeq) throw new Error("等待页面选择日期和场次");
        const key = `${goods.goodsCode}/${goods.placeCode}/${playSeq}`;
        if (key !== cachedKey) {
            cachedKey = key;
            blocks = [];
            metadata.clear();
        }
        return { data, goods, playSeq: String(playSeq), key };
    }

    function assertContext(expectedKey) {
        const current = context();
        if (expectedKey && current.key !== expectedKey) throw new Error("场次已改变，丢弃上次请求结果");
        return current;
    }

    function decodeStatus(hex) {
        if (typeof hex !== "string" || !/^[\da-f]*$/i.test(hex)) throw new Error("区域状态不是有效十六进制位图");
        return Array.from(hex, digit => parseInt(digit, 16).toString(2).padStart(4, "0")).join("");
    }

    async function snapshot() {
        const ctx = context();
        if (!blocks.length) {
            const result = await getService().getSeatBlocks(ctx.goods.goodsCode, ctx.goods.placeCode, ctx.playSeq);
            assertContext(ctx.key);
            if (!Array.isArray(result) || result.some(block => !block.blockKey)) throw new Error("区域列表响应格式发生变化");
            blocks = result;
        }
        return {
            key: ctx.key, goodsCode: ctx.goods.goodsCode, playSeq: ctx.playSeq,
            date: ctx.data.playSeq.playDate, time: ctx.data.playSeq.playTime,
            blocks: blocks.map(block => ({
                blockKey: block.blockKey,
                code: String(block.selfDefineBlock ?? block.blockKey.split(":").pop()),
                name: String(block.blockName || block.selfDefineBlockName || ""),
                left: block.absoluteLeft, right: block.absoluteRight,
                top: block.absoluteTop, bottom: block.absoluteBottom,
            })),
            selected: (ctx.data.seats || []).map(seat => ({ seatInfoId: seat.seatInfoId, blockKey: seat.blockKey })),
        };
    }

    // Data access only: no map state, viewport, clicks or CAPTCHA actions.
    async function pollBatch(requestedKeys, expectedKey) {
        const ctx = assertContext(expectedKey);
        const keys = [...new Set(requestedKeys)];
        if (!keys.length || keys.length > 16 || keys.some(key => !blocks.some(block => block.blockKey === key))) {
            throw new Error("查询批次必须包含当前场次的 1 至 16 个区域");
        }
        const api = getService();
        const prefix = [ctx.goods.goodsCode, ctx.goods.placeCode, ctx.playSeq];
        const state = await (ctx.goods.isInterlocking
            ? api.getSeatsStatusExternal(...prefix, keys) : api.getSeatsStatus(...prefix, keys));
        assertContext(ctx.key);
        if (!Array.isArray(state.blockKeys) || !Array.isArray(state.statuses)) throw new Error("区域状态响应缺失");
        const bitmaps = new Map(keys.map(key => {
            const index = state.blockKeys.indexOf(key);
            if (index < 0 || index >= state.statuses.length) throw new Error("区域状态响应没有目标区域");
            return [key, decodeStatus(state.statuses[index])];
        }));
        const revision = String(state.seatModifiedAt || "");
        const missing = keys.filter(key => {
            const cached = metadata.get(key);
            return !cached || cached.revision !== revision || Date.now() - cached.at > 60000;
        });
        if (missing.length) {
            const result = await (ctx.goods.isInterlocking
                ? api.getSeatsMetaExternal(...prefix, missing) : api.getSeatsMeta(...prefix, missing));
            assertContext(ctx.key);
            const entries = missing.map(key => {
                const entry = Array.isArray(result) && result.find(item => item.blockKey === key);
                if (!entry || !Array.isArray(entry.seats)) throw new Error("区域座位元数据缺失");
                return entry;
            });
            for (const entry of entries) metadata.set(entry.blockKey, { seats: entry.seats, revision, at: Date.now() });
        }
        return { key: ctx.key, blocks: keys.map(blockKey => {
            const seats = metadata.get(blockKey).seats;
            const bits = bitmaps.get(blockKey);
            if (bits.length < seats.length) {
                metadata.delete(blockKey);
                throw new Error("区域位图长度与座位列表不一致，停止本轮选座");
            }
            return availableSeats(ctx.key, blockKey, seats, bits);
        }) };
    }

    async function poll(blockKey, expectedKey) {
        return (await pollBatch([blockKey], expectedKey)).blocks[0];
    }

    function availableSeats(key, blockKey, seats, bits) {
        const available = seats.filter((seat, index) => bits[index] === "1" && seat.seatGrade);
        const rowIndexes = [...new Set(seats.map(seat => seat.rowIdx).filter(value => value !== null && value !== undefined))]
            .sort((a, b) => Number(a) - Number(b));
        return { key: key, blockKey, total: seats.length, seats: available.map(seat => ({
            seatInfoId: seat.seatInfoId, seatGrade: seat.seatGrade, seatGradeName: seat.seatGradeName,
            floor: seat.floor, rowNo: seat.rowNo, seatNo: seat.seatNo,
            rowIdx: seat.rowIdx, colIdx: seat.colIdx, seatGroupId: seat.seatGroupId,
            visualRow: rowIndexes.indexOf(seat.rowIdx) + 1,
            groupSize: seat.seatGroupId ? seats.filter(item => item.seatGroupId === seat.seatGroupId).length : 1,
            posLeft: seat.posLeft, posTop: seat.posTop,
        })) };
    }

    function findSelectionHandler() {
        const roots = document.querySelectorAll('[class*="SeatMap_seatGroup"], [class*="seatInfo"]');
        for (const node of roots) {
            const fiberKey = Object.keys(node).find(key => key.startsWith("__reactFiber$"));
            let current = node[fiberKey];
            let root = current;
            while (root?.return) root = root.return;
            if (root?.stateNode?.current && root.stateNode.current !== root) current = current?.alternate || current;
            for (let fiber = current; fiber; fiber = fiber.return) {
                const props = fiber.memoizedProps;
                if (props && typeof props.seatSelectHandler === "function") return props.seatSelectHandler;
            }
        }
        throw new Error("新版选座处理函数尚未就绪");
    }

    async function select(payload) {
        const epoch = selectionEpoch;
        const ctx = assertContext(payload.key);
        if (location.pathname !== "/onestop/seat" || new URLSearchParams(location.search).get("step")) {
            throw new Error("当前已离开选座步骤");
        }
        // Recheck status immediately before calling the site's own GraphQL preselection flow.
        const fresh = await poll(payload.blockKey, ctx.key);
        assertContext(ctx.key);
        if (epoch !== selectionEpoch) throw new Error("选座已取消");
        const ids = Array.isArray(payload.seatInfoIds) ? payload.seatInfoIds : [];
        if (!ids.length || ids.some(id => !fresh.seats.some(seat => seat.seatInfoId === id))) {
            throw new Error("目标座位状态已改变");
        }
        const allSeats = metadata.get(payload.blockKey).seats;
        const seats = ids.map(id => allSeats.find(seat => seat.seatInfoId === id));
        const groupId = seats[0].seatGroupId;
        if (seats.length > 1 && (!groupId || seats.some(seat => seat.seatGroupId !== groupId))) {
            throw new Error("单次批量预选仅接受页面定义的座位组");
        }
        if (groupId && allSeats.filter(seat => seat.seatGroupId === groupId).length !== seats.length) {
            throw new Error("必须完整选择页面定义的座位组");
        }
        await findSelectionHandler()(true, seats[0], payload.blockKey, !!ctx.goods.isInterlocking, undefined,
            groupId ? seats.map(seat => ({ blockKey: payload.blockKey, seat })) : undefined);
        const latest = assertContext(ctx.key);
        const selected = (latest.data.seats || []).map(seat => seat.seatInfoId);
        return { selected: ids.every(id => selected.includes(id)), ids: selected };
    }

    window.ticketBotOnestopBridge = {
        async run(mode, payload = {}) {
            try {
                if (mode === "cancel") {
                    selectionEpoch += 1;
                    return { success: true };
                }
                if (location.hostname !== "tickets.interpark.com" || !location.pathname.startsWith("/onestop/")) {
                    throw new Error("非新版订购页");
                }
                const result = mode === "snapshot" ? await snapshot()
                    : mode === "poll" ? (Array.isArray(payload.blockKeys)
                        ? await pollBatch(payload.blockKeys, payload.key) : await poll(payload.blockKey, payload.key))
                    : mode === "select" ? await select(payload)
                    : (() => { throw new Error("未知新版操作"); })();
                return { success: true, result };
            } catch (error) {
                // Never send session IDs, auth headers, request configs or member data to the content script.
                const status = Number(error.response?.status || error.status || 0);
                const code = String(error.response?.data?.errorCode || error.data?.backendErrorCode || "");
                const retryHeader = error.response?.headers?.get?.('retry-after') || error.response?.headers?.['retry-after'];
                const retryAfterMs = retryHeader ? (/^\d+$/.test(String(retryHeader))
                    ? Number(retryHeader) * 1000 : Math.max(0, Date.parse(retryHeader) - Date.now())) : 0;
                return { success: false, status, code, retryAfterMs: Number.isFinite(retryAfterMs) ? retryAfterMs : 0,
                    error: status ? `区域接口返回 HTTP ${status}` : String(error.message || "新版接口调用失败").slice(0, 180) };
            }
        },
    };
})();
