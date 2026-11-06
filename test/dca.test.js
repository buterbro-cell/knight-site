'use strict';
const test = require('node:test');
const assert = require('node:assert');
const os = require('os'), path = require('path'), fs = require('fs');
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'dca-'));
const { create } = require('../lib/dca');

function fake() {
  const calls = []; let fail = false;
  return { calls, setFail: v => { fail = v; }, storageKey: async () => Buffer.alloc(32, 9),
    execute: async (owner, p) => { calls.push({ owner, ...p }); if (fail) throw new Error('not enough USDT'); return { depositAddress: 'd'.repeat(64), amountInFormatted: p.amount, amountOutFormatted: '0.25' }; } };
}

test('DCA: first buy at once, then every period, through the agent wallet with its limits', async () => {
  let t = 1e12; const aw = fake();
  const d = create({ agentWallet: aw, now: () => t });
  const o = await d.add('me.near', { amount: '1', token: 'USDT', toToken: 'NEAR', everyHours: 24, runs: 3 });
  await d.tick();
  assert.equal(aw.calls.length, 1);
  assert.deepEqual(aw.calls[0], { owner: 'me.near', action: 'swap', amount: '1', token: 'USDT', toToken: 'NEAR' });
  await d.tick(); assert.equal(aw.calls.length, 1, 'not again before the period');
  t += 24 * 3600e3; await d.tick(); assert.equal(aw.calls.length, 2);
  t += 24 * 3600e3; await d.tick(); assert.equal(aw.calls.length, 3);
  assert.equal((await d.list('me.near')).length, 0, 'done after the last run');
  assert.ok(o.id);
});

test('DCA: pauses after 3 failures in a row; orders are encrypted at rest and reload', async () => {
  let t = 2e12; const aw = fake(); aw.setFail(true);
  const d = create({ agentWallet: aw, now: () => t });
  const o = await d.add('you.near', { amount: '0.5', token: 'USDT', toToken: 'NEAR', everyHours: 1 });
  await d.tick(); t += 3600e3; await d.tick(); t += 3600e3; await d.tick(); t += 3600e3; await d.tick();
  assert.equal(aw.calls.length, 3);
  const [x] = await d.list('you.near'); assert.equal(x.paused, true);
  const raw = fs.readFileSync(path.join(process.env.DATA_DIR, 'orders.bin'));
  assert.ok(!raw.toString('latin1').includes('you.near'), 'owner not readable in the file');
  const d2 = create({ agentWallet: fake(), now: () => t });
  assert.equal((await d2.list('you.near'))[0].id, o.id);
  await assert.rejects(d2.cancel('evil.near', o.id), /no such plan/);
  await d2.cancel('you.near', o.id); assert.equal((await d2.list('you.near')).length, 0);
});

test('DCA: only NEAR↔USDT, sane periods', () => {
  const d = create({ agentWallet: fake() });
  assert.throws(() => d.validate({ amount: '1', token: 'USDT', toToken: 'USDT', everyHours: 24 }), /NEAR↔USDT/);
  assert.throws(() => d.validate({ amount: '1', token: 'USDT', toToken: 'NEAR', everyHours: 0.01 }), /period/);
  assert.throws(() => d.validate({ amount: '-1', token: 'USDT', toToken: 'NEAR', everyHours: 24 }), /amount/);
});

test('DCA: a time of day and a duration in days', async () => {
  const t0 = Date.UTC(2026, 10, 6, 11, 40); let t = t0; const aw = fake();
  const d = create({ agentWallet: aw, now: () => t });
  const o = await d.add('me.near', { amount: '1', token: 'USDT', toToken: 'NEAR', everyHours: 24, forDays: 14, atUtcMin: 6 * 60 });   // 06:00 UTC = 09:00 Moscow
  assert.equal(o.runs, 14);
  assert.equal(o.nextAt, Date.UTC(2026, 10, 7, 6, 0), 'first buy tomorrow at 06:00 UTC, not now');
  await d.tick(); assert.equal(aw.calls.length, 0);
  t = Date.UTC(2026, 10, 7, 6, 0, 30); await d.tick(); assert.equal(aw.calls.length, 1);
  const [x] = await d.list('me.near'); assert.equal(x.nextAt, Date.UTC(2026, 10, 8, 6, 0), 'next day, same time');
  assert.throws(() => d.validate({ amount: '1', token: 'USDT', toToken: 'NEAR', everyHours: 12, atUtcMin: 60 }), /whole days/);
});

test('limit order: buys once when NEAR drops below the level, then is gone', async () => {
  let t = 3e12, px = 2.5; const aw = fake();
  const d = create({ agentWallet: aw, now: () => t, price: async () => px, file: path.join(process.env.DATA_DIR, 'limit.bin') });
  await d.add('me.near', { amount: '5', token: 'USDT', toToken: 'NEAR', whenBelow: 2 });
  await d.tick(); t += 60e3; await d.tick(); assert.equal(aw.calls.length, 0, 'price above the level: wait');
  px = 1.95; t += 60e3; await d.tick();
  assert.equal(aw.calls.length, 1);
  t += 60e3; await d.tick(); assert.equal(aw.calls.length, 1, 'one purchase only');
  assert.equal((await d.list('me.near')).length, 0);
  await assert.rejects(d.add('me.near', { amount: '1', token: 'USDT', toToken: 'NEAR', whenBelow: 2, whenAbove: 3 }), /one price level/);
});
