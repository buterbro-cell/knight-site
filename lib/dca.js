'use strict';
// Standing orders (DCA) for the agent wallet: "buy NEAR for 1 USDT every 24 hours".
// The ONLY thing this server keeps between requests: owner account, tokens, amount, period, runs left and the
// last result — no conversation, no balances. Kept encrypted (AES-256-GCM) with a key from the same root as the
// agent keys (TEE key on Phala, the dev seed elsewhere), so the file is useless outside this attested app.
// Every purchase goes through agentWallet.execute(): same per-action and per-day limits as a voice payment.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const FILE = path.join(DIR, 'orders.bin');
const MIN_EVERY_H = 1, MAX_EVERY_H = 24 * 30, MAX_RUNS = 365, MAX_ORDERS_PER_OWNER = 5, MAX_FAILS = 3;
const TOKENS = ['NEAR', 'USDT'];

function create({ agentWallet, now = () => Date.now(), keyBytes } = {}) {
  const orders = new Map();
  let key = keyBytes || null, loaded = false, timer = null;

  async function encKey() {
    if (key) return key;
    key = await agentWallet.storageKey('sir-near/orders');
    return key;
  }
  async function save() {
    const k = await encKey().catch(() => null);
    if (!k) return;   // no key → orders live in memory only
    const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', k, iv);
    const body = Buffer.concat([c.update(JSON.stringify([...orders.values()]), 'utf8'), c.final()]);
    try { fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(FILE + '.tmp', Buffer.concat([iv, c.getAuthTag(), body])); fs.renameSync(FILE + '.tmp', FILE); }
    catch (e) { console.warn('[dca] could not save orders:', e.message); }
  }
  async function load() {
    if (loaded) return; loaded = true;
    try {
      const k = await encKey(); if (!k) return;
      const b = fs.readFileSync(FILE);
      const d = crypto.createDecipheriv('aes-256-gcm', k, b.subarray(0, 12)); d.setAuthTag(b.subarray(12, 28));
      for (const o of JSON.parse(Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8'))) orders.set(o.id, o);
    } catch (e) { if (e.code !== 'ENOENT') console.warn('[dca] could not read orders:', e.message); }
  }

  function validate({ amount, token, toToken, everyHours, runs }) {
    token = String(token || '').toUpperCase(); toToken = String(toToken || '').toUpperCase();
    if (!TOKENS.includes(token) || !TOKENS.includes(toToken) || token === toToken) throw new Error('DCA: NEAR↔USDT only');
    const a = Number(amount);
    if (!(a > 0) || !/^\d+(\.\d{1,6})?$/.test(String(amount))) throw new Error('DCA: bad amount');
    const h = Number(everyHours);
    if (!(h >= MIN_EVERY_H && h <= MAX_EVERY_H)) throw new Error(`DCA: period must be ${MIN_EVERY_H}–${MAX_EVERY_H} hours`);
    const r = runs == null ? 30 : Math.floor(Number(runs));
    if (!(r >= 1 && r <= MAX_RUNS)) throw new Error(`DCA: 1–${MAX_RUNS} purchases`);
    return { amount: String(amount), token, toToken, everyHours: h, runs: r };
  }

  async function add(owner, input) {
    await load();
    const v = validate(input);
    if ([...orders.values()].filter(o => o.owner === owner).length >= MAX_ORDERS_PER_OWNER) throw new Error(`DCA: at most ${MAX_ORDERS_PER_OWNER} plans`);
    const o = { id: crypto.randomBytes(6).toString('hex'), owner, ...v, runsLeft: v.runs, createdAt: now(), nextAt: now(), fails: 0, last: null, history: [] };
    orders.set(o.id, o); await save();
    tick();   // the first purchase right away (runs in the background)
    return o;
  }
  async function list(owner) { await load(); return [...orders.values()].filter(o => o.owner === owner); }
  async function cancel(owner, id) {
    await load();
    const o = orders.get(String(id));
    if (!o || o.owner !== owner) throw new Error('DCA: no such plan');
    orders.delete(o.id); await save(); return { cancelled: o.id };
  }

  async function runOne(o) {
    let r;
    try {
      const x = await agentWallet.execute(o.owner, { action: 'swap', amount: o.amount, token: o.token, toToken: o.toToken });
      r = { at: now(), ok: true, depositAddress: x.depositAddress, spent: x.amountInFormatted, got: x.amountOutFormatted };
      o.fails = 0; o.runsLeft -= 1;
    } catch (e) {
      r = { at: now(), ok: false, error: String(e.message || e).slice(0, 160) };
      o.fails += 1;
    }
    o.last = r; o.history = [r, ...(o.history || [])].slice(0, 10);
    // after a failure retry in an hour (not at once), after MAX_FAILS in a row the plan pauses
    o.nextAt = r.ok ? o.nextAt + o.everyHours * 3600e3 : now() + 3600e3;
    if (r.ok && o.nextAt < now()) o.nextAt = now() + o.everyHours * 3600e3;   // after downtime: no burst of missed buys
    if (o.fails >= MAX_FAILS) o.paused = true;
    if (o.runsLeft <= 0) orders.delete(o.id);
  }
  // one pass at a time; a call during a pass waits for it and then runs its own pass
  let chain = Promise.resolve();
  function tick() {
    chain = chain.then(async () => {
      await load();
      for (const o of [...orders.values()]) if (!o.paused && o.nextAt <= now()) { await runOne(o); await save(); }
    }).catch(e => console.warn('[dca]', e.message));
    return chain;
  }
  function start(everyMs = 60e3) { if (!timer) { timer = setInterval(() => tick().catch(e => console.warn('[dca]', e.message)), everyMs); timer.unref && timer.unref(); } }
  async function resume(owner, id) {
    await load(); const o = orders.get(String(id));
    if (!o || o.owner !== owner) throw new Error('DCA: no such plan');
    o.paused = false; o.fails = 0; o.nextAt = now(); await save(); tick(); return o;
  }
  return { add, list, cancel, resume, tick, start, validate, _orders: orders };
}

module.exports = { create, MIN_EVERY_H, MAX_EVERY_H };
