const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

async function until(predicate, message) {
    const deadline = Date.now() + 9000;
    while (!predicate() && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 20));
    assert.ok(predicate(), message);
}

function setup(t, { available = true, blockedOnce = false, fromGate = false, fromEntry = false } = {}) {
    const dom = new JSDOM(`<div class="swiper"><h3 class="EntCalendar_month__test">2026.10</h3>
        <div class="swiper-slide-active"><button class="EntCalendar_dateButton__test" aria-pressed="true">7</button></div></div>
        <button class="TimeBlock_timeButton__test" aria-selected="true">7:45 PM</button><div class="ScheduleContent_footerButton__test"><button class="EntButton_primary__test" id="next">Weiter</button></div>`,
    { url: fromGate ? 'https://tickets.interpark.com/gates/zh/global/26006903'
        : fromEntry ? 'https://tickets.interpark.com/onestop' : 'https://tickets.interpark.com/onestop/schedule', runScripts: 'outside-only' });
    const w = dom.window;
    t.after(() => w.close());
    w.console.log = () => {};
    w.HTMLElement.prototype.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 30 });
    w.TicketBotConfig = { interpark: { refreshIntervalMs: 500, refreshJitterMs: 1, areaScanIntervalMs: 200 } };
    let state = { running: true, platform: 'interpark', config: {
        'concert-id': '26000511/26006903', date: '2026-10-07', time: '19:45', section: ['004'], ticket: 1,
    } };
    const context = { goods: { goodsCode: '26006903', placeCode: '26000511' },
        playSeq: { playSeq: '001', playDate: '20261007', playTime: '7:45 PM' }, seats: [] };
    const save = () => w.sessionStorage.setItem('interpark/context', JSON.stringify(context));
    save();
    const events = [];
    const seat = { seatInfoId: 'fixture-a', seatGrade: 'A', rowIdx: 0, colIdx: 0, rowNo: '1', seatNo: '1' };
    const api = {
        async getSeatBlocks() { events.push('blocks'); return [{ blockKey: '001:004', selfDefineBlock: '004',
            absoluteLeft: 0, absoluteRight: 50, absoluteTop: 0, absoluteBottom: 20 }]; },
        async getSeatsStatus() {
            events.push('status');
            if (blockedOnce) { blockedOnce = false; throw { response: { status: 403 } }; }
            return { blockKeys: ['001:004'], statuses: [available ? '8' : '0'] };
        },
        async getSeatsMeta() { events.push('meta'); return [{ blockKey: '001:004', seats: [seat] }]; },
    };
    const requirePage = () => ({ api });
    requirePage.m = { 42: function () { return { getSeatsStatus: 1, getSeatsMeta: 1 }; } };
    w.webpackChunk_N_E = { push: ([,, callback]) => callback(requirePage) };
    let backgroundListener;
    vm.runInNewContext(read('background.js'), {
        console: { log() {} },
        chrome: {
            runtime: { onMessage: { addListener(fn) { backgroundListener = fn; } } },
            scripting: { async executeScript(options) {
                assert.equal(options.world, 'MAIN');
                assert.deepEqual(Array.from(options.target.frameIds), [0]);
                if (options.files) { options.files.forEach(file => w.eval(read(file))); return []; }
                return [{ result: await w.eval(`(${options.func.toString()})`)(...options.args) }];
            } },
        },
    });
    let contentListener;
    w.chrome = { runtime: {
        onMessage: { addListener(fn) { contentListener = fn; } },
        sendMessage(message, callback) {
            events.push(message.mode);
            // Chrome preserves the initial document URL across history-based route changes.
            backgroundListener(message, { tab: { id: 1 }, url: 'https://tickets.interpark.com/onestop' }, callback);
        },
    } };
    w.get_stored_value = async () => state;
    w.store_value = async (key, value) => { state = value; };
    w.document.querySelector('#next').onclick = () => {
        events.push('next');
        w.history.pushState({}, '', '/onestop/seat');
        const map = w.document.createElement('div');
        map.className = 'SeatMap_seatGroup__test';
        map.innerHTML = '<svg></svg><img alt="blockImg"><button class="SeatPlan_zoomFitButton__test" disabled>恢复总览</button>';
        Object.defineProperty(map.querySelector('svg'), 'viewBox', { value: { baseVal: { x: 0, y: 0, width: 100, height: 100 } } });
        const fit = map.querySelector('button');
        map.querySelector('img').onclick = () => { events.push('area-click'); fit.disabled = false; };
        fit.onclick = () => { events.push('restore-click'); }; // Deliberately never finish the animation.
        map.__reactFiber$test = { memoizedProps: { seatSelectHandler: async (selected, selectedSeat, blockKey) => {
            events.push('native-select'); context.seats.push({ ...selectedSeat, blockKey }); save();
        } } };
        w.document.body.append(map);
        const complete = w.document.createElement('button');
        complete.textContent = 'Terminer';
        complete.className = 'EntButton_primary__test';
        const footer = w.document.createElement('div');
        footer.className = 'InfoSelected_footer__test';
        footer.append(complete);
        complete.onclick = () => {
            events.push('complete'); w.history.pushState({}, '', '/onestop/seat?step=price');
            const prices = w.document.createElement('div');
            prices.innerHTML = '<div class="PriceGroup_group__test"><span class="PriceGroup_countMax__test">/1</span><li class="PriceItem_typeItem__test"><div class="nds-e-stepper__root"><input role="spinbutton" aria-valuenow="0" aria-valuemax="1"><button class="nds-e-stepper__incrementButton">+</button></div></li></div><div class="PriceContent_footer__test"><button class="EntButton_primary__test" disabled>Continuer</button></div>';
            const next = prices.querySelector('[class*=PriceContent_footer] button');
            prices.querySelector('.nds-e-stepper__incrementButton').onclick = () => {
                events.push('price-count'); prices.querySelector('input').setAttribute('aria-valuenow', '1'); prices.querySelector('input').setAttribute('aria-valuemax', '0'); next.disabled = false;
            };
            next.onclick = () => { events.push('price-next'); w.history.pushState({}, '', '/onestop/order'); };
            w.document.body.append(prices);
        };
        w.document.body.append(footer);
    };
    // Execute the production script unchanged, including automatic startup from storage.
    w.eval(read('scripts/interpark/seat.js'));
    return { w, events, api, getState: () => state,
        stop: () => contentListener({ action: 'stopTicketBot', platform: 'interpark' }, {}, () => {}) };
}

test('automatic startup traverses schedule, background bridge, API preselection and completion, then stops', async t => {
    const s = setup(t);
    await until(() => !s.getState().running, 'flow must stop after advancing through price');
    assert.equal(s.w.location.pathname, '/onestop/order');
    assert.deepEqual(s.events.filter(event => ['next', 'native-select', 'complete'].includes(event)),
        ['next', 'native-select', 'complete']);
    assert.equal(s.events.filter(event => event === 'price-count').length, 1);
    assert.equal(s.events.filter(event => event === 'price-next').length, 1);
    assert.equal(s.events.filter(event => event === 'status').length, 2, 'poll and fresh preselection check');
    const count = s.events.length;
    await new Promise(resolve => setTimeout(resolve, 700));
    assert.equal(s.events.length, count, 'no further requests after completion');
});

test('gate SPA transition starts schedule automation without requiring a page reload', async t => {
    const s = setup(t, { fromGate: true });
    assert.equal(s.events.length, 0);
    s.w.history.pushState({}, '', '/onestop/schedule');
    await until(() => !s.getState().running, 'gate-to-schedule transition must complete the flow');
    assert.equal(s.w.location.pathname, '/onestop/order');
    assert.equal(s.events.filter(event => event === 'next').length, 1);
});

test('bare onestop entry waits for SPA initialization and preserves automatic startup', async t => {
    const s = setup(t, { fromEntry: true });
    await new Promise(resolve => setTimeout(resolve, 50));
    assert.equal(s.getState().running, true);
    s.w.history.pushState({}, '', '/onestop/schedule');
    await until(() => !s.getState().running, 'bare entry must reach selection after initialization');
    assert.equal(s.w.location.pathname, '/onestop/order');
});

test('no inventory continues polling without selection; explicit stop ends requests', async t => {
    const s = setup(t, { available: false });
    await until(() => s.events.filter(event => event === 'status').length >= 2, 'must poll more than once');
    s.stop();
    await until(() => !s.getState().running, 'stop must persist');
    assert.equal(s.events.includes('native-select'), false);
    assert.equal(s.events.includes('complete'), false);
    const count = s.events.length;
    await new Promise(resolve => setTimeout(resolve, 900));
    assert.equal(s.events.length, count);
});

test('blocked API triggers exactly one foreground probe and restore, then resumes polling without animation completion', async t => {
    const s = setup(t, { available: false, blockedOnce: true });
    await until(() => s.events.includes('restore-click') && s.events.filter(event => event === 'status').length >= 2,
        'polling must resume despite unfinished animation');
    s.stop();
    assert.equal(s.events.filter(event => event === 'area-click').length, 1);
    assert.equal(s.events.filter(event => event === 'restore-click').length, 1);
    assert.equal(s.w.document.querySelector('[class*=zoomFitButton]').disabled, false);
    const restoreAt = s.events.indexOf('restore-click');
    assert.deepEqual(s.events.slice(restoreAt + 1, restoreAt + 4), ['snapshot', 'poll', 'status']);
    assert.equal(s.events.includes('native-select'), false);
});
