const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const source = fs.readFileSync(path.join(__dirname, '../scripts/interpark/onestop-main.js'), 'utf8');

function setup(t) {
    const dom = new JSDOM('<div class="SeatMap_seatGroup__test"></div>', { url:'https://tickets.interpark.com/onestop/seat', runScripts:'outside-only' });
    t.after(() => dom.window.close());
    const w = dom.window;
    let state = { goods:{goodsCode:'26006903',placeCode:'26000511'}, playSeq:{playSeq:'001',playDate:'20261007',playTime:'7:45 PM'}, seats:[], sessionId:'MUST_NOT_LEAK' };
    const save = () => w.sessionStorage.setItem('interpark/context', JSON.stringify(state)); save();
    const meta = [
        {seatInfoId:'a',seatGrade:'P',rowIdx:0,colIdx:0,rowNo:'1열',seatNo:'1'},
        {seatInfoId:'b',seatGrade:'P',rowIdx:0,colIdx:1,rowNo:'1열',seatNo:'2'},
        {seatInfoId:'c',seatGrade:'R',rowIdx:1,colIdx:0,rowNo:'2열',seatNo:'1'},
    ];
    const calls = {status:0,meta:0,selection:0};
    const api = {
        async getSeatBlocks() { return [{blockKey:'001:004',selfDefineBlock:'004',absoluteLeft:1,absoluteRight:5,absoluteTop:2,absoluteBottom:6}]; },
        getSeatsStatus: async (...args) => { calls.status++; assert.deepEqual(args.slice(0,3), ['26006903','26000511','001']); return {blockKeys:['001:004'],statuses:['a'],seatModifiedAt:1}; },
        getSeatsMeta: async () => { calls.meta++; return [{blockKey:'001:004',seats:meta}]; },
    };
    const req = () => ({v:api});
    req.m = {56789: function(){ return {getSeatsStatus: 1,getSeatsMeta: 1}; }};
    w.webpackChunk_N_E = {push: ([,, callback]) => callback(req)};
    w.document.querySelector('div').__reactFiber$test = {return:{memoizedProps:{seatSelectHandler:async (selected, seat, blockKey) => {
        calls.selection++; state.seats.push({...seat,blockKey}); save();
    }}}};
    w.eval(source);
    return {w,api,meta,calls,state,save,run:(mode,payload)=>w.ticketBotOnestopBridge.run(mode,payload)};
}

test('API polling decodes bits in metadata order, caches metadata and never moves the map', async t => {
    const s=setup(t); let clicks=0; s.w.document.addEventListener('click',()=>clicks++);
    const snap=await s.run('snapshot'); assert.equal(snap.success,true);
    assert.equal(JSON.stringify(snap).includes('MUST_NOT_LEAK'),false);
    const payload={key:snap.result.key,blockKey:'001:004'};
    const first=await s.run('poll',payload); const second=await s.run('poll',payload);
    assert.equal(first.success,true); assert.equal(second.success,true);
    assert.deepEqual(Array.from(first.result.seats,seat=>seat.seatInfoId),['a','c']);
    assert.deepEqual(Array.from(first.result.seats,seat=>seat.visualRow),[1,2]);
    assert.equal(s.calls.status,2); assert.equal(s.calls.meta,1); assert.equal(clicks,0);
});

test('preselection uses the site handler only after fresh status validation', async t => {
    const s=setup(t); const snap=await s.run('snapshot');
    const payload={key:snap.result.key,blockKey:'001:004',seatInfoIds:['a']};
    const selected=await s.run('select',payload);
    assert.equal(selected.result.selected,true); assert.equal(s.calls.selection,1);
    const rejected=await s.run('select',{...payload,seatInfoIds:['b']});
    assert.equal(rejected.success,false); assert.equal(s.calls.selection,1);
});

test('mismatched session and corrupt status fail closed', async t => {
    const s=setup(t); const snap=await s.run('snapshot');
    assert.equal((await s.run('poll',{key:'other',blockKey:'001:004'})).success,false);
    s.api.getSeatsStatus=async()=>({blockKeys:['001:004'],statuses:['oops']});
    assert.equal((await s.run('poll',{key:snap.result.key,blockKey:'001:004'})).success,false);
    assert.equal(s.calls.selection,0);
});

test('selection follows the current React fiber instead of an obsolete handler', async t => {
    const s = setup(t);
    const node = s.w.document.querySelector('div');
    const live = node.__reactFiber$test;
    const liveRoot = {};
    live.return.return = liveRoot;
    const staleRoot = { stateNode: { current: liveRoot } };
    let staleCalls = 0;
    node.__reactFiber$test = {
        alternate: live,
        return: { memoizedProps: { seatSelectHandler: () => { staleCalls++; } }, return: staleRoot },
    };
    const snap = await s.run('snapshot');
    const result = await s.run('select', { key: snap.result.key, blockKey: '001:004', seatInfoIds: ['a'] });
    assert.equal(result.result.selected, true);
    assert.equal(s.calls.selection, 1);
    assert.equal(staleCalls, 0);
});

test('cancel during pending status prevents late preselection', async t => {
    const s=setup(t); const snap=await s.run('snapshot');
    const original=s.api.getSeatsStatus;
    s.api.getSeatsStatus=async(...args)=>{ await s.run('cancel'); return original(...args); };
    const result=await s.run('select',{key:snap.result.key,blockKey:'001:004',seatInfoIds:['a']});
    assert.equal(result.success,false); assert.equal(s.calls.selection,0);
});

test('HTTP blocking is reported without exposing request credentials', async t => {
    const s=setup(t); const snap=await s.run('snapshot');
    s.api.getSeatsStatus=async()=>{ throw {response:{status:403,data:{errorCode:'BLOCKED'}},config:{headers:{Authorization:'SECRET'}}}; };
    const result=await s.run('poll',{key:snap.result.key,blockKey:'001:004'});
    assert.equal(result.success,false); assert.equal(result.status,403);
    assert.equal(JSON.stringify(result).includes('SECRET'),false);
});

test('multiple areas share one status request and one metadata request, joined by block key', async t => {
    const s = setup(t);
    const calls = [];
    s.api.getSeatBlocks = async () => ['001:004', '001:005'].map(blockKey => ({ blockKey }));
    s.api.getSeatsStatus = async (...args) => {
        calls.push(['status', Array.from(args[3])]);
        return { blockKeys: ['001:005', '001:004'], statuses: ['0', '8'], seatModifiedAt: 1 };
    };
    s.api.getSeatsMeta = async (...args) => {
        calls.push(['meta', Array.from(args[3])]);
        return ['001:005', '001:004'].map(blockKey => ({ blockKey, seats: s.meta }));
    };
    const snapshot = await s.run('snapshot');
    const payload = { key: snapshot.result.key, blockKeys: ['001:004', '001:005'] };
    const result = await s.run('poll', payload);
    assert.equal(result.success, true);
    assert.deepEqual(Array.from(result.result.blocks, block => [block.blockKey, block.seats.length]), [['001:004', 1], ['001:005', 0]]);
    await s.run('poll', payload);
    assert.deepEqual(calls, [['status', payload.blockKeys], ['meta', payload.blockKeys], ['status', payload.blockKeys]]);
    s.api.getSeatsStatus = async () => ({ blockKeys: ['001:004'], statuses: ['8'] });
    assert.equal((await s.run('poll', payload)).success, false, 'partial batch must not yield candidates');
});
