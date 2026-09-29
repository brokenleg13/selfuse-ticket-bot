const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const { JSDOM } = require('jsdom');
const source = fs.readFileSync(path.join(root, 'scripts/interpark/seat.js'), 'utf8');

function page(html, config = {}, route = 'schedule') {
    const dom = new JSDOM(html, { url: `https://tickets.interpark.com/onestop/${route}`, runScripts: 'outside-only' });
    const window = dom.window;
    window.HTMLElement.prototype.getBoundingClientRect = () => ({ width: 100, height: 30 });
    window.SVGElement.prototype.getBoundingClientRect = () => ({ width: 10, height: 10 });
    window.chrome = { runtime: { onMessage: { addListener() {} } } };
    window.get_stored_value = async () => null;
    window.store_value = async () => {};
    window.console.log = () => {};
    window.eval(source.replace('    startFromRunState();', `
        window.testApi = { selectOnestopSchedule, parseOnestopTime, clickOnestopElement, clickNolBuyButton,
            isCaptchaVisible, findCaptchaImageElement, findCaptchaInputElement,
            findCaptchaSubmitElement, findCaptchaRefreshElement, setInputValue,
            solveCaptchaWithLocalOcr,
            scanOnestopSeats, advanceOnestopPrice, runOnestopSeatTick, planOnestopBatches, handleOnestopQueryFailure,
            setRecovery(value) { onestopRecovery = value; },
            getRecovery() { return onestopRecovery; },
            chooseOnestopSeats, normalizeOnestopArea,
            setConfig(config) { activeConfig = config; botRunning = true; },
            stop() { botRunning = false; } };
    `));
    window.testApi.setConfig(config);
    return { window, document: window.document, api: window.testApi, close: () => window.close() };
}

// Sanitized DOM shapes captured from the live NOL /onestop pages.
const schedule = `<div class="swiper"><div><div class="EntCalendar_controller__V2X8r"><h3 class="EntCalendar_month__9tEIV">2026.10</h3></div></div><div class="swiper-wrapper"><div class="swiper-slide swiper-slide-active">
    <button class="EntCalendar_dateButton__6TxQi" aria-pressed="true">7</button>
    <button class="EntCalendar_dateButton__6TxQi" aria-pressed="false">8</button>
    <button class="EntCalendar_dateButton__6TxQi" disabled aria-pressed="false">9</button></div></div></div>
    <button class="TimeBlock_timeButton__79vnB" role="row" aria-selected="true">7:45 PM</button>
    <div class="ScheduleContent_footerButton__test"><button class="EntButton_primary__test">Weiter</button></div>`;

test('new onestop routes load the Interpark content script', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
    const entry = manifest.content_scripts.find(item => item.js.includes('scripts/interpark/seat.js'));
    assert.ok(entry.matches.includes('https://tickets.interpark.com/onestop/*'),
        'the live /onestop/schedule and /onestop/seat pages do not receive the bot');
    assert.ok(entry.matches.includes('https://tickets.interpark.com/gates/*'));
    assert.ok(entry.matches.includes('https://tickets.interpark.com/onestop'));
    assert.ok(entry.matches.includes('https://tickets.interpark.com/onestop?*'));
});

test('configured date is selected with one click, before selecting a time', async t => {
    const p = page(schedule, { date: '2026-10-08', time: '19:45' }); t.after(p.close);
    let clicks = 0;
    p.document.querySelectorAll('[class*=dateButton]')[1].onclick = () => clicks++;
    await p.api.selectOnestopSchedule();
    assert.equal(clicks, 1);
});

test('does not continue on unavailable date or wrong year/month/time', async t => {
    for (const config of [{ date: '2026-10-09' }, { date: '2027-10-07' }, { date: '2026-10-07', time: '18:00' }]) {
        const p = page(schedule, config); t.after(p.close);
        let clicks = 0;
        p.document.querySelectorAll('button').forEach(button => button.onclick = () => clicks++);
        await p.api.selectOnestopSchedule();
        assert.equal(clicks, 0, JSON.stringify(config));
    }
});

test('selected date and 12-hour time allow exactly one next action', async t => {
    const p = page(schedule, { date: '2026-10-07', time: '19:45' }); t.after(p.close);
    let clicks = 0;
    Array.from(p.document.querySelectorAll('button')).at(-1).onclick = () => clicks++;
    await p.api.selectOnestopSchedule();
    assert.equal(clicks, 1);
    for (const [text, expected] of [['7:45 PM', '1945'], ['12:00 AM', '0000'], ['12:00 PM', '1200'], ['下午 7:45', '1945'], ['19:45', '1945']]) {
        assert.equal(p.api.parseOnestopTime(text), expected);
    }
});

test('new captcha uses the exact image/input/submit/refresh and controlled input events', t => {
    const p = page(`<img alt="background"><div class="ModalLayout_outerWrap__test"><div><div class="ModalCaptchaText_captchaImage__test"><img alt="言語依存ラベル" src="data:image/png;base64,AA=="></div>
        <input class="ModalCaptchaText_captchaInput__DC7Gz"></div>
        <button class="ModalCaptchaText_buttonRefresh__test" aria-label="別の画像"></button><footer class="ModalLayout_footer__test"><button class="EntButton_primary__test">続行</button></footer></div>`, {}, 'seat');
    t.after(p.close);
    assert.equal(p.api.isCaptchaVisible(), true);
    assert.equal(p.api.findCaptchaImageElement().alt, '言語依存ラベル');
    assert.equal(p.api.findCaptchaSubmitElement().textContent, '続行');
    assert.equal(p.api.findCaptchaRefreshElement().getAttribute('aria-label'), '別の画像');
    const input = p.api.findCaptchaInputElement();
    let inputs = 0; input.addEventListener('input', () => inputs++);
    p.api.setInputValue(input, 'ABCDEF');
    assert.equal(input.value, 'ABCDEF'); assert.equal(inputs, 1);
    input.remove(); assert.equal(p.api.isCaptchaVisible(), false);
});

test('stop and disabled state prevent any new clicks', t => {
    const p = page('<button disabled>下一步</button>'); t.after(p.close);
    const button = p.document.querySelector('button');
    let clicks = 0; button.onclick = () => clicks++;
    assert.equal(p.api.clickOnestopElement(button), false);
    button.disabled = false; p.api.stop();
    assert.equal(p.api.clickOnestopElement(button), false);
    assert.equal(clicks, 0);
});

test('purchase action uses its structural container, ignores translated labels and rejects ambiguity', async t => {
    const p = page('<button>Buy</button><div class="grid-area_purchase-button"><button class="nds-e-rectangle-button--variant_filled_primary">Acheter</button></div>');
    t.after(p.close);
    let requests = 0;
    p.window.chrome.runtime.sendMessage = (message, callback) => {
        requests++;
        const target = p.document.querySelector(`[data-ticket-bot-page-click-id="${message.clickId}"]`);
        assert.equal(target.textContent, 'Acheter');
        callback({ success: true });
    };
    assert.equal(await p.api.clickNolBuyButton(), true);
    p.document.body.insertAdjacentHTML('beforeend', '<div class="pos_fixed bottom_0"><button class="nds-e-rectangle-button--variant_filled_primary">Comprar</button></div>');
    assert.equal(await p.api.clickNolBuyButton(), false);
    assert.equal(requests, 1);
});

test('restore click resumes API work in the same scan while the map animation is still running', async t => {
    const p = page('<button class="SeatPlan_zoomFitButton__test">恢复总览</button>', {}, 'seat');
    t.after(p.close);
    const fit = p.document.querySelector('button');
    let clicks = 0;
    const requests = [];
    fit.onclick = () => { clicks++; }; // Animation never completes: button stays enabled.
    p.window.chrome.runtime.sendMessage = (message, callback) => {
        requests.push(message.mode);
        callback({ success: false, error: 'fixture: snapshot not ready' });
    };
    p.api.setRecovery({ phase: 'check', startedAt: Date.now() - 3000, area: { code: '004' } });
    await p.api.runOnestopSeatTick();
    assert.equal(clicks, 1);
    assert.equal(fit.disabled, false);
    assert.equal(p.api.getRecovery(), null);
    assert.deepEqual(requests, ['snapshot']);
    await p.api.scanOnestopSeats();
    assert.equal(clicks, 1);
    assert.deepEqual(requests, ['snapshot', 'snapshot']);
});

test('OCR result goes through React input change before submitting the new captcha', async t => {
    const p = page(`<section id="captcha" class="ModalLayout_outerWrap__test"><div class="ModalCaptchaText_captchaImage__test"><img alt="言語依存ラベル" src="data:image/png;base64,AA=="></div>
        <input class="ModalCaptchaText_captchaInput__DC7Gz"><footer class="ModalLayout_footer__test"><button class="EntButton_primary__test" disabled>Continuer</button></footer></section>`, {}, 'seat');
    t.after(p.close);
    const input = p.api.findCaptchaInputElement();
    const button = p.api.findCaptchaSubmitElement();
    input.addEventListener('input', () => { button.disabled = input.value.length !== 6; });
    let submissions = 0;
    button.onclick = () => { submissions++; p.document.getElementById('captcha').remove(); };
    p.window.fetch = async (url, options) => {
        assert.equal(url, 'http://127.0.0.1:17861/ocr');
        assert.equal(JSON.parse(options.body).codeLength, 6);
        return { ok: true, json: async () => ({ ok: true, text: 'ABCDEF' }) };
    };
    assert.equal(await p.api.solveCaptchaWithLocalOcr(), true);
    assert.equal(submissions, 1);
    assert.equal(p.api.isCaptchaVisible(), false);
});

test('stopping during OCR prevents late autofill and submit', async t => {
    const p = page(`<div class="ModalCaptchaText_captchaImage__test"><img alt="言語依存ラベル" src="data:image/png;base64,AA=="></div>
        <input class="ModalCaptchaText_captchaInput__DC7Gz"><button>完成輸入</button>`, {}, 'seat');
    t.after(p.close);
    let submissions = 0; p.document.querySelector('button').onclick = () => submissions++;
    p.window.fetch = async () => {
        p.api.stop();
        return { ok: true, json: async () => ({ ok: true, text: 'ABCDEF' }) };
    };
    assert.equal(await p.api.solveCaptchaWithLocalOcr(), false);
    assert.equal(p.api.findCaptchaInputElement().value, '');
    assert.equal(submissions, 0);
});

test('background selection respects row limit, adjacency, grade and complete seat groups', t => {
    const p = page(''); t.after(p.close);
    const seat = (id, colIdx, extra = {}) => ({ seatInfoId: id, rowIdx: 0, visualRow: 1, colIdx, seatGrade: 'A', ...extra });
    assert.equal(p.api.chooseOnestopSeats([seat('a', 1), seat('b', 3)], 2, 0).length, 0);
    assert.equal(p.api.chooseOnestopSeats([seat('a', 1), seat('b', 2, {seatGrade:'B'})], 2, 0).length, 0);
    assert.equal(p.api.chooseOnestopSeats([seat('a', 1, {visualRow:3})], 1, 2).length, 0);
    assert.equal(p.api.chooseOnestopSeats([seat('a', 1), seat('b', 2)], 2, 1).length, 2);
    const group = [seat('a', 1, {seatGroupId:'G',groupSize:2}), seat('b', 2, {seatGroupId:'G',groupSize:2})];
    assert.equal(p.api.chooseOnestopSeats(group.slice(0,1), 1, 0).length, 0);
    assert.equal(p.api.chooseOnestopSeats(group, 2, 0).length, 2);
    assert.equal(p.api.normalizeOnestopArea('004'), p.api.normalizeOnestopArea('4'));
});

test('batch plan covers all configured areas in priority order, independent of map and legacy click limits', t => {
    const p = page('', { maxAreaClicksPerRefresh: 1 }); t.after(p.close);
    const blocks = Array.from({ length: 35 }, (_, index) => ({ code: String(index + 1).padStart(3, '0'), blockKey: `001:${index + 1}` }));
    const all = p.api.planOnestopBatches(blocks, []);
    assert.deepEqual(Array.from(all, batch => batch.length), [16, 16, 3]);
    assert.equal(all.flat().length, 35);
    const chosen = p.api.planOnestopBatches(blocks, ['35', '2', '35', '1']);
    assert.deepEqual(Array.from(chosen[0], area => area.code), ['035', '002', '001']);
    assert.equal(p.api.planOnestopBatches(blocks, ['missing']).length, 0);
});

test('network errors and rate limits do not trigger map recovery; blocked response does', async t => {
    const p = page('<button class="SeatPlan_zoomFitButton__test">restore</button>'); t.after(p.close);
    let clicks = 0; p.document.querySelector('button').onclick = () => clicks++;
    const batch = [{ code: '004', blockKey: '001:004' }];
    for (const status of [0, 500, 429]) {
        await p.api.handleOnestopQueryFailure({ status, error: 'fixture' }, batch);
        assert.equal(p.api.getRecovery(), null);
    }
    await p.api.handleOnestopQueryFailure({ status: 403, error: 'fixture' }, batch);
    assert.equal(p.api.getRecovery().phase, 'probe');
    assert.equal(clicks, 0, 'error classification only schedules recovery, never clicks');
});

const priceFixture = `<div class="PriceGroup_group__test"><span class="PriceGroup_countMax__test">/1</span>
    <li class="PriceItem_typeItem__test"><div class="nds-e-stepper__root"><input role="spinbutton" aria-valuenow="1" aria-valuemax="0">
    <button class="nds-e-stepper__incrementButton" disabled>+</button></div></li></div>
    <div class="PriceContent_footer__test"><button class="EntButton_primary__test">Continuer</button></div>`;

test('already selected price continues once despite zero remaining allowance, without duplicate submission', async t => {
    const p = page(priceFixture, { ticket: 1 }, 'seat?step=price'); t.after(p.close);
    p.window.chrome.runtime.sendMessage = (message, callback) => callback({ success: true,
        result: { goodsCode: 'test', selected: [{ seatInfoId: 'a' }] } });
    let submissions = 0;
    p.document.querySelector('[class*=PriceContent_footer] button').onclick = () => submissions++;
    await p.api.advanceOnestopPrice();
    await p.api.advanceOnestopPrice();
    assert.equal(submissions, 1);
});

test('price step refuses quantity mismatch and ambiguous fare options', async t => {
    for (const mismatch of [true, false]) {
        const p = page(priceFixture, { ticket: mismatch ? 2 : 1 }, 'seat?step=price'); t.after(p.close);
        if (!mismatch) {
            const item = p.document.querySelector('[class*=PriceItem_typeItem]');
            item.after(item.cloneNode(true));
        }
        p.window.chrome.runtime.sendMessage = (message, callback) => callback({ success: true,
            result: { goodsCode: 'test', selected: [{ seatInfoId: 'a' }] } });
        let clicks = 0; p.document.addEventListener('click', () => clicks++);
        await p.api.advanceOnestopPrice();
        assert.equal(clicks, 0);
    }
});
