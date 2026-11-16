const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const until = async (check, message, timeoutMs = 3000) => {
    const deadline = Date.now() + timeoutMs;
    while (!check()) {
        if (Date.now() > deadline) throw new Error(message);
        await new Promise(resolve => setTimeout(resolve, 10));
    }
};

// 模拟 chrome.storage.sync + onChanged，让多个“页面”共享同一份运行状态。
function createStore(initial = {}) {
    const data = { ...initial };
    const listeners = new Set();
    return {
        data,
        listeners,
        get: async key => data[key],
        set: async (key, value) => {
            const oldValue = data[key];
            data[key] = value;
            listeners.forEach(fn => fn({ [key]: { oldValue, newValue: value } }, 'sync'));
        },
    };
}

function page(html, url, store, extra = {}) {
    const dom = new JSDOM(html, { url, runScripts: 'outside-only' });
    const w = dom.window;
    const messages = [];
    const notifications = [];
    const sounds = [];
    let messageListener;
    w.console.log = () => {};
    const local = {};
    w.chrome = {
        runtime: { onMessage: { addListener(fn) { messageListener = fn; } }, sendMessage() {} },
        storage: {
            onChanged: { addListener(fn) { store.listeners.add(fn); } },
            local: {
                get(key, callback) { callback({ [key]: local[key] }); },
                set(value, callback) { Object.assign(local, value); callback && callback(); },
                remove(key, callback) { delete local[key]; callback && callback(); },
            },
        },
    };
    w.get_stored_value = store.get;
    w.store_value = store.set;
    w.sendFeiShuMsg = (url, text) => notifications.push(text);
    w.eval(read('config/config.js'));
    Object.assign(w.TicketBotConfig.runtime, extra.runtime || {});
    Object.assign(w.TicketBotConfig.melon, extra.melon || {});
    w.eval(read('scripts/common/sleep.js'));
    w.eval(read('scripts/common/hourToPm.js'));
    w.eval(read('scripts/common/sound.js'));
    w.eval(read('scripts/common/status-panel.js'));
    w.eval(read('scripts/common/journal.js'));
    w.TicketBotSound.play = async kind => { sounds.push(kind); return true; };
    w.eval(read('scripts/common/runtime.js'));
    return {
        sounds,
        journal: async () => { await w.TicketBotJournal.flush(); return local.ticketBotJournal || []; },
        w, messages, notifications,
        send: message => new Promise(resolve => messageListener(message, {}, resolve)),
        close: () => w.close(),
    };
}

const RUN_KEY = 'ticketBotRunState';

test('stop written by the popup reaches a bot whose tab never receives the message', async t => {
    const store = createStore();
    const p = page('<body></body>', 'https://example.com/', store); t.after(p.close);
    let loops = 0;
    const bot = p.w.TicketBotRuntime.createBot({
        platform: 'melon',
        async onStart(ctx, gen) { while (ctx.isActive(gen)) { loops++; await ctx.sleep(5); } },
    });
    await bot.start({ 'concert-id': '1' });
    await until(() => loops > 2, 'loop should run');
    await store.set(RUN_KEY, { running: false, platform: 'melon' });
    const count = loops;
    await new Promise(resolve => setTimeout(resolve, 40));
    assert.ok(loops <= count + 1, 'loop must exit after storage stop');
    assert.equal(bot.ctx.isRunning(), false);
});

test('pause from another page halts the flow, resume restarts it once', async t => {
    const store = createStore();
    const p = page('<body></body>', 'https://example.com/', store); t.after(p.close);
    let starts = 0;
    let halts = 0;
    const bot = p.w.TicketBotRuntime.createBot({
        platform: 'yes24',
        async onStart(ctx, gen) { starts++; while (ctx.isActive(gen)) await ctx.sleep(5); },
        onHalt() { halts++; },
    });
    await store.set(RUN_KEY, { running: true, platform: 'yes24', config: {} });
    await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal(starts, 0, 'start is not broadcast through storage');
    await bot.start({});
    await until(() => starts === 1, 'explicit start');
    await store.set(RUN_KEY, { running: true, paused: true, platform: 'yes24', config: {} });
    assert.equal(bot.ctx.isPaused(), true);
    assert.equal(halts, 1);
    await store.set(RUN_KEY, { running: true, paused: false, platform: 'yes24', config: {} });
    await until(() => starts === 2, 'resume should run onStart again');
    assert.equal(bot.ctx.isPaused(), false);
});

test('a page that handed off is not restarted by later pause/resume', async t => {
    const store = createStore();
    const p = page('<body></body>', 'https://example.com/', store); t.after(p.close);
    let starts = 0;
    const bot = p.w.TicketBotRuntime.createBot({
        platform: 'melon',
        async onStart(ctx) { starts++; ctx.handoff('done'); },
    });
    await store.set(RUN_KEY, { running: true, platform: 'melon', config: {} });
    await bot.start({});
    await until(() => starts === 1, 'should start');
    await store.set(RUN_KEY, { running: true, paused: true, platform: 'melon', config: {} });
    await store.set(RUN_KEY, { running: true, paused: false, platform: 'melon', config: {} });
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal(starts, 1);
    assert.equal(bot.ctx.state, 'handoff');
});

test('notify respects the card event filter and stall watchdog fires once', async t => {
    const store = createStore();
    const p = page('<body></body>', 'https://example.com/', store, { runtime: { pageAlertCheckMs: 500 } }); t.after(p.close);
    const bot = p.w.TicketBotRuntime.createBot({
        platform: 'melon',
        async onStart(ctx, gen) { ctx.setState('stuck'); while (ctx.isActive(gen)) await ctx.sleep(20); },
    });
    await bot.start({ 'feishu-bot-id': 'https://open.feishu.cn/hook', notifyEvents: 'stalled', stallTimeoutMs: 100 });
    bot.ctx.notify('detail', 'filtered out');
    await until(() => p.notifications.length === 1, 'stall notification expected', 3000);
    assert.match(p.notifications[0], /^【Melon】卡住\n已 \d+ 秒没有进展.*\n步骤：stuck \| 时间：/s);
    await new Promise(resolve => setTimeout(resolve, 700));
    assert.equal(p.notifications.length, 1, 'stall must not repeat');
    await bot.stop();
});

test('page text matching a melon rule ("try again") asks for a human', async t => {
    const store = createStore();
    const p = page('<body><div id="msg"></div></body>', 'https://example.com/', store, { runtime: { pageAlertCheckMs: 500 } }); t.after(p.close);
    const bot = p.w.TicketBotRuntime.createBot({
        platform: 'melon',
        async onStart(ctx, gen) { while (ctx.isActive(gen)) await ctx.sleep(20); },
    });
    await bot.start({ 'feishu-bot-id': 'https://open.feishu.cn/hook' });
    p.w.document.getElementById('msg').textContent = 'Please try again later.';
    await until(() => p.notifications.some(text => /^【Melon】需要人工\nMelon 提示稍后再试.*try again/s.test(text)), 'human notification expected', 3000);
    assert.ok(p.sounds.includes('takeover'));
    const entries = await p.journal();
    assert.ok(entries.some(entry => entry.type === 'rule' && entry.rule === 'melon-try-again' && entry.kind === 'page-text'));
    await bot.stop();
});

const melonSeatPage = `<body>
    <input id="prodId" value="123">
    <div id="certification" style="display:none"></div>
    <iframe id="oneStopFrame"></iframe>
</body>`;

function buildMelonFrame(p, events) {
    const doc = p.w.document.getElementById('oneStopFrame').contentWindow.document;
    doc.body.innerHTML = `<div class="seat_name">range</div>
        <div><span class="area_tit">Floor A</span></div>
        <div id="ez_canvas"><svg><rect fill="#DDDDDD"></rect><rect fill="#FF0000" id="free"></rect></svg></div>`;
    doc.querySelector('.area_tit').parentElement.onclick = () => events.push('area');
    doc.getElementById('free').addEventListener('click', () => {
        events.push('seat');
        const next = doc.createElement('button');
        next.id = 'nextTicketSelection';
        next.onclick = () => events.push('next');
        doc.body.append(next);
    });
}

test('melon seat flow picks a seat, moves to next step, reports success and stops scanning', async t => {
    const store = createStore({ [RUN_KEY]: { running: true, platform: 'melon', concertId: '123',
        config: { 'concert-id': '123', section: ['A'], 'feishu-bot-id': 'https://open.feishu.cn/hook' } } });
    const p = page(melonSeatPage, 'https://tkglobal.melon.com/reservation/popup/onestop.htm', store, {
        melon: { initialSeatDelayMs: 0, sectionOpenDelayMs: 0, seatRenderDelayMs: 0, elementWaitTimeoutMs: 200 },
    }); t.after(p.close);
    const events = [];
    buildMelonFrame(p, events);
    p.w.eval(read('scripts/melonticket/seat.js'));
    await until(() => store.data[RUN_KEY].running === false, 'melon flow should finish');
    assert.deepEqual(events.filter(e => e !== 'area'), ['seat', 'next', 'next']);
    assert.ok(p.notifications.some(text => /^【Melon】成功\n区域 A 已选座[^\n]*\n步骤：下一步 → 后续请人工完成（A） \| 时间：/.test(text)));
    assert.equal(p.notifications.filter(text => /进度/.test(text)).length, 0, 'no detail pushes by default');
    const count = events.length;
    await new Promise(resolve => setTimeout(resolve, 100));
    assert.equal(events.length, count, 'no more clicks after success');
});

test('melon seat flow ignores a run state for another performance', async t => {
    const store = createStore({ [RUN_KEY]: { running: true, platform: 'melon', concertId: '999',
        config: { 'concert-id': '999', section: ['A'] } } });
    const p = page(melonSeatPage, 'https://tkglobal.melon.com/reservation/popup/onestop.htm', store); t.after(p.close);
    const events = [];
    buildMelonFrame(p, events);
    p.w.eval(read('scripts/melonticket/seat.js'));
    await new Promise(resolve => setTimeout(resolve, 50));
    assert.deepEqual(events, []);
    assert.equal(store.data[RUN_KEY].running, true);
});

test('config: every platform field is readable and manifest loads runtime before platform scripts', () => {
    const dom = new JSDOM('', { runScripts: 'outside-only' });
    dom.window.eval(read('config/config.js'));
    const config = dom.window.TicketBotConfig;
    for (const [platform, meta] of Object.entries(config.platforms)) {
        for (const field of meta.fields.filter(item => item.key && (!item.type || item.type === 'number'))) {
            assert.ok(Number.isFinite(config.getNumber(platform, {}, field.key, NaN)), `${platform}.${field.key} needs a default`);
        }
    }
    assert.equal(config.getNumber('melon', { seatRenderDelayMs: '10' }, 'seatRenderDelayMs', 0), 10);
    assert.equal(config.getNumber('melon', { seatRenderDelayMs: '' }, 'seatRenderDelayMs', 0), 750);

    const manifest = JSON.parse(read('manifest.json'));
    for (const entry of manifest.content_scripts.filter(item => item.js.includes('config/config.js'))) {
        const runtimeIndex = entry.js.indexOf('scripts/common/runtime.js');
        assert.ok(runtimeIndex > 0, `runtime missing in ${entry.matches[0]}`);
        const platformIndex = entry.js.findIndex(file => !file.startsWith('scripts/common/') && file !== 'config/config.js');
        assert.ok(runtimeIndex < platformIndex);
    }
    assert.equal(JSON.stringify(manifest).includes('thaiticket'), false);
});

test('yes24 script registers with the runtime and reads URLs from config', async t => {
    const store = createStore();
    const p = page('<body></body>', 'https://ticket.yes24.com/Pages/English/Sale/FnPerfSaleProcess.aspx?IdPerf=1', store); t.after(p.close);
    // 顶层 let/const 在 eval 里是局部的，测试钩子和脚本放在同一次 eval 里。
    p.w.eval(read('scripts/yes24/seatv2.js') + `
        window.__yes24 = { setCfg(time, hall) { concertcfg.idTime = time; concertcfg.idHall = hall; }, bot: yes24Bot };`);
    assert.equal(p.w.yes24Url('lock'), 'https://ticket.yes24.com/OSIF/Book.asmx/Lock');
    p.w.__yes24.setCfg(11, 22);
    assert.equal(p.w.yes24SeatPageUrl(3),
        'https://ticket.yes24.com/Pages/English/Sale/FnPerfSaleHtmlSeat.aspx?idTime=11&idHall=22&block=3&stMax=10&pHCardAppOpt=0');
    await p.w.__yes24.bot.start({ section: [], 'feishu-bot-id': 'https://open.feishu.cn/hook' });
    await until(() => store.data[RUN_KEY] && store.data[RUN_KEY].running === false, 'missing customer id must stop');
    assert.ok(p.notifications.some(text => /YES24 用户 ID 为空/.test(text)));
});

test('captcha client posts to the configured service and never throws', async t => {
    const dom = new JSDOM('', { runScripts: 'outside-only' });
    const w = dom.window; t.after(() => w.close());
    w.eval(read('config/config.js'));
    w.TicketBotConfig.services.captcha.baseUrl = 'http://ocr.local:9000/';
    w.TicketBotConfig.services.captcha.headers = { Authorization: 'Bearer x' };
    w.eval(read('scripts/common/captcha-client.js'));
    const calls = [];
    w.fetch = async (url, options) => {
        calls.push({ url, body: JSON.parse(options.body), auth: options.headers.Authorization });
        return { ok: true, json: async () => ({ ok: true, text: 'ABCD' }) };
    };
    const ok = await w.TicketBotCaptcha.recognizeText('data:image/png;base64,AA==', { codeLength: 4, charset: 'alnum' });
    assert.equal(ok.text, 'ABCD');
    assert.deepEqual(calls[0], { url: 'http://ocr.local:9000/ocr',
        body: { image: 'data:image/png;base64,AA==', codeLength: 4, charset: 'alnum' }, auth: 'Bearer x' });

    w.fetch = async () => { throw new Error('ECONNREFUSED'); };
    const down = await w.TicketBotCaptcha.detectSliderGap('x');
    assert.equal(down.ok, false);
    assert.match(down.error, /unavailable/);

    w.TicketBotConfig.services.captcha.provider = 'custom';
    w.TicketBotCaptcha.registerProvider('custom', { recognizeText: async () => ({ ok: true, text: 'ZZ' }) });
    assert.equal((await w.TicketBotCaptcha.recognizeText('x')).text, 'ZZ');
});

test('status panel shows the declared state machine and lifecycle', async t => {
    const store = createStore();
    const p = page('<body></body>', 'https://example.com/', store); t.after(p.close);
    const bot = p.w.TicketBotRuntime.createBot({
        platform: 'melon',
        states: [{ key: 'a', label: '第一步' }, { key: 'b', label: '第二步' }, { key: 'c', label: '第三步' },
            { key: 'cap', label: '验证码', step: false }],
        async onStart(ctx, gen) { ctx.setState('b', 'A区'); while (ctx.isActive(gen)) await ctx.sleep(10); },
    });
    await bot.start({});
    await until(() => bot.ctx.state === 'b', 'state b');
    const root = p.w.document.getElementById('ticket-bot-status').shadowRoot;
    const items = Array.from(root.querySelectorAll('li')).map(li => [li.className, li.textContent]);
    assert.deepEqual(items, [['done', '✓第一步'], ['current', '▶第二步· A区'], ['', '○第三步']]);
    assert.match(root.querySelector('.title').textContent, /第二步/);
    bot.ctx.setState('cap');
    assert.match(root.querySelector('.title').textContent, /验证码/);
    assert.equal(root.querySelector('li.current').textContent.includes('第二步'), true, 'non-step state keeps flow position');
    await bot.pause('test');
    assert.equal(root.querySelector('.badge').textContent, '已暂停');
    assert.equal(root.querySelector('.resume').hidden, false);
    assert.equal(root.querySelector('.pause').hidden, true);
    root.querySelector('.stop').click();
    await until(() => !bot.ctx.isRunning() && !bot.ctx.isPaused(), 'panel stop button stops the bot');
});

test('needHuman plays the takeover sound once per state and pause/stop/success make sounds', async t => {
    const store = createStore();
    const p = page('<body></body>', 'https://example.com/', store); t.after(p.close);
    const bot = p.w.TicketBotRuntime.createBot({
        platform: 'melon',
        async onStart(ctx, gen) { ctx.setState('captcha'); while (ctx.isActive(gen)) await ctx.sleep(10); },
    });
    await bot.start({ 'feishu-bot-id': 'https://open.feishu.cn/hook' });
    await until(() => bot.ctx.state === 'captcha', 'captcha state');
    bot.ctx.needHuman('请输入验证码');
    bot.ctx.needHuman('请输入验证码');
    assert.deepEqual(p.sounds, ['takeover']);
    assert.equal(p.notifications.filter(text => /需要人工/.test(text)).length, 1);
    await bot.pause('人工');
    assert.deepEqual(p.sounds, ['takeover', 'takeover']);
    await bot.resume();
    await bot.ctx.success('ok');
    assert.equal(p.sounds.at(-1), 'success');

    const quiet = page('<body></body>', 'https://example.com/', createStore()); t.after(quiet.close);
    const silentBot = quiet.w.TicketBotRuntime.createBot({ platform: 'melon', async onStart() {} });
    await silentBot.start({ soundEvents: 'none' });
    silentBot.ctx.needHuman('x');
    assert.deepEqual(quiet.sounds, []);
});

test('sound component falls back to page audio when the extension cannot play', async t => {
    const dom = new JSDOM('', { runScripts: 'outside-only' });
    const w = dom.window; t.after(() => w.close());
    w.chrome = { runtime: { sendMessage(message, callback) { callback({ success: false }); } } };
    w.eval(read('scripts/common/sound.js'));
    let started = 0;
    w.AudioContext = class {
        constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; }
        async resume() {}
        createOscillator() { return { type: '', frequency: { setValueAtTime() {} }, connect: node => node, start() { started++; }, stop() {} }; }
        createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: node => node }; }
    };
    assert.equal(await w.TicketBotSound.play('takeover', { repeat: 2 }), true);
    assert.equal(started, w.TicketBotSound.PATTERNS.takeover.length * 2);
});

test('main-world click: background clicks the element inside the iframe of the sender tab', async t => {
    const vm = require('node:vm');
    const dom = new JSDOM('<iframe></iframe>', { url: 'https://ticket.yes24.com/', runScripts: 'outside-only' });
    const w = dom.window; t.after(() => w.close());
    const frameDoc = w.frames[0].document;
    frameDoc.body.innerHTML = '<img class="booking" src="/img/btn_booking2.gif">';
    let clicks = 0;
    frameDoc.querySelector('img').addEventListener('click', () => clicks++);

    let listener;
    const executed = [];
    vm.runInNewContext(read('background.js'), {
        console: { log() {}, error() {} },
        URL,
        chrome: {
            runtime: { onMessage: { addListener(fn) { listener = fn; } }, getURL: path => path },
            scripting: { async executeScript(options) {
                executed.push(options);
                w.__args = options.args;
                return [{ result: w.eval(`(${options.func.toString()})(...window.__args)`) }];
            } },
        },
    });
    const send = message => new Promise(resolve => listener(message, { tab: { id: 7 }, frameId: 0 }, resolve));

    const ok = await send({ action: 'mainWorldClick', selector: 'img.booking[src*="btn_booking2.gif"]', frameIndex: 0 });
    assert.equal(JSON.stringify(ok), '{"success":true}');
    assert.equal(clicks, 1);
    assert.equal(executed[0].world, 'MAIN');
    assert.deepEqual(Array.from(executed[0].target.frameIds), [0]);

    const missing = await send({ action: 'mainWorldClick', selector: '#nope', frameIndex: 0 });
    assert.equal(missing.success, false);
    assert.match(missing.error, /没有找到元素/);
    assert.equal((await send({ action: 'mainWorldClick', selector: '' })).success, false);
});

test('yes24 booking click goes through the main-world helper and asks for a human when it fails', async t => {
    const store = createStore();
    const p = page('<body></body>', 'https://ticket.yes24.com/Pages/English/Sale/FnPerfSaleProcess.aspx?IdPerf=1', store); t.after(p.close);
    const requests = [];
    let reply = { success: true };
    p.w.chrome.runtime.sendMessage = (message, callback) => { requests.push(message); callback(reply); };
    p.w.eval(read('scripts/common/main-world.js'));
    p.w.eval(read('scripts/yes24/seatv2.js') + `
        window.__yes24 = { bot: yes24Bot, click: clickBookingButton };`);
    await p.w.__yes24.bot.start({ section: ['1'], 'customer-id': 'x', 'feishu-bot-id': 'https://open.feishu.cn/hook' });
    assert.equal(await p.w.__yes24.click(), true);
    const click = requests.find(message => message.action === 'mainWorldClick');
    assert.deepEqual(JSON.parse(JSON.stringify(click)), { action: 'mainWorldClick', selector: 'img.booking[src*="btn_booking2.gif"]', frameIndex: 0 });

    reply = { success: false, error: '没有找到元素' };
    assert.equal(await p.w.__yes24.click(), false);
    assert.ok(p.sounds.includes('takeover'));
    assert.ok(p.notifications.some(text => /没有点到预订按钮/.test(text)));
    await p.w.__yes24.bot.stop();
});

test('blocked browser dialogs are forwarded to the runtime: rule match, unknown dialog, journal', async t => {
    const store = createStore();
    const p = page('<body></body>', 'https://tkglobal.melon.com/reservation/popup/onestop.htm', store); t.after(p.close);
    p.w.eval(read('scripts/common/beforeunload-blocker.js'));
    const bot = p.w.TicketBotRuntime.createBot({
        platform: 'melon',
        async onStart(ctx, gen) { ctx.setState('scanning'); while (ctx.isActive(gen)) await ctx.sleep(10); },
    });
    await bot.start({ 'feishu-bot-id': 'https://open.feishu.cn/hook' });
    await until(() => bot.ctx.state === 'scanning', 'scanning');

    assert.equal(p.w.alert('Please try again later.'), undefined, 'dialog is closed automatically');
    await until(() => p.notifications.some(text => /需要人工/.test(text)), 'try again dialog must notify a human');

    p.w.alert('Some brand new message');
    await until(() => p.notifications.some(text => /浏览器弹窗（已自动关闭）：Some brand new message/.test(text)), 'unknown dialog still notifies');

    const entries = await p.journal();
    assert.ok(entries.some(e => e.type === 'dialog' && e.dialog === 'alert' && /try again/.test(e.text)));
    assert.ok(entries.some(e => e.type === 'rule' && e.rule === 'melon-try-again' && e.kind === 'dialog' && e.state === 'scanning'));
    assert.ok(entries.some(e => e.type === 'unhandled' && e.kind === 'dialog' && e.text === 'Some brand new message'));
    assert.ok(entries.some(e => e.type === 'state' && e.to === 'scanning'));
    await bot.stop();
});

test('observe(): api signals follow rules, unknown ones are journaled without pushing', async t => {
    const store = createStore();
    const p = page('<body></body>', 'https://example.com/', store); t.after(p.close);
    const bot = p.w.TicketBotRuntime.createBot({
        platform: 'yes24',
        rules: [{ id: 'test-stop', on: 'api', match: '^Lock 999', action: 'stop', message: '测试停止' }],
        async onStart(ctx, gen) { while (ctx.isActive(gen)) await ctx.sleep(10); },
    });
    await bot.start({ 'feishu-bot-id': 'https://open.feishu.cn/hook' });
    assert.equal(bot.ctx.observe('api', 'Block=-1').id, 'yes24-block-throttle');
    assert.equal(bot.ctx.observe('api', 'Lock 123 weird'), null);
    assert.equal(p.notifications.length, 0, 'ignore rules and unknown api signals do not push');
    bot.ctx.observe('api', 'Lock 999 sold');
    await until(() => p.notifications.some(text => /^【YES24】已停止\n测试停止：Lock 999 sold/.test(text)), 'stop rule pushes the reason');
    assert.equal(bot.ctx.isRunning(), false);
    const entries = await p.journal();
    assert.ok(entries.some(e => e.type === 'unhandled' && e.kind === 'api' && e.text === 'Lock 123 weird'));
    assert.ok(entries.some(e => e.type === 'rule' && e.rule === 'yes24-block-throttle'));
});
