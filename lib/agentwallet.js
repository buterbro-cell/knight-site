// "Full mode" (Shade-agent style): each owner gets an agent wallet whose key exists ONLY inside this enclave.
//   • key = ed25519 from the dstack guest agent's GetKey(path = "sir-near/agent/<owner>") — derived from the app's
//     TEE root key, the same on every restart of the same attested app, never written anywhere, never sent out
//   • the wallet is a NEAR implicit account (hex of the public key); the owner tops it up with a small budget
//   • only the owner can command it: a NEP-413 message signed by a full-access key of the owner's account
//     opens a short session; spending limits are enforced here, in attested code
// Outside a TEE the feature is off — unless AGENT_DEV_SEED is set, which is clearly reported as NOT private.
'use strict';
const crypto = require('crypto');
const http = require('http');
const fs = require('fs');
const path = require('path');
const near = require('./near');
const pay = require('./pay');

const SOCK = ['/var/run/dstack.sock', '/run/dstack.sock'].find(p => { try { return fs.existsSync(p); } catch { return false; } });
const DEV_SEED = process.env.AGENT_DEV_SEED || '';
const mode = () => (SOCK ? 'tee' : DEV_SEED ? 'dev' : 'off');

const LIMITS = { perActionUsd: Number(process.env.AGENT_MAX_USD || 10), perDayUsd: Number(process.env.AGENT_DAY_USD || 25) };

function dstackGetKey(path) {
  return new Promise((resolve, reject) => {
    const q = `/GetKey?path=${encodeURIComponent(path)}&purpose=${encodeURIComponent('ed25519-seed')}`;
    const req = http.request({ socketPath: SOCK, path: q, method: 'GET', timeout: 15000 }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { if (res.statusCode >= 400) return reject(new Error('dstack GetKey ' + res.statusCode)); try { resolve(JSON.parse(d)); } catch { reject(new Error('dstack GetKey: bad JSON')); } });
    });
    req.on('timeout', () => req.destroy(new Error('dstack timeout'))); req.on('error', reject); req.end();
  });
}

const keys = new Map();   // owner → key (process memory only)
async function agentKey(owner) {
  if (!pay.isNearAccount(owner)) throw new Error('bad owner account');
  if (keys.has(owner)) return keys.get(owner);
  let seed;
  if (mode() === 'tee') {
    const r = await dstackGetKey('sir-near/agent/' + owner);
    const hex = String(r.key || r.asBytes || '').replace(/^0x/, '');
    seed = crypto.createHash('sha256').update(Buffer.from(hex, 'hex')).update('sir-near agent ed25519').digest();
  } else if (mode() === 'dev') {
    seed = crypto.createHmac('sha256', DEV_SEED).update('sir-near/agent/' + owner).digest();
  } else throw new Error('agent wallets need a TEE');
  const key = near.keyFromSeed(seed);
  keys.set(owner, key);
  return key;
}

// ---- owner sessions: proof that the request comes from the owner's own wallet
// Session MAC key: derived from the same root as the agent keys (TEE key on Phala, dev seed elsewhere), so a session
// survives a restart of the same app; a random one when neither exists.
let SESSION_SECRET = DEV_SEED ? crypto.createHmac('sha256', DEV_SEED).update('sir-near/session').digest() : crypto.randomBytes(32);
let secretReady = SOCK ? dstackGetKey('sir-near/session').then(r => { const hex = String(r.key || r.asBytes || '').replace(/^0x/, ''); if (hex) SESSION_SECRET = crypto.createHash('sha256').update(Buffer.from(hex, 'hex')).update('sir-near session mac').digest(); }).catch(() => {}) : Promise.resolve();
const SESSION_MS = 24 * 3600e3;
const sessionMessage = (owner, issuedAt) => `Sir Near: let my agent wallet act for ${owner} for 24 hours, within its limits. ${issuedAt}`;
const RECIPIENT = 'sir-near';
function tokenFor(owner, exp) { const mac = crypto.createHmac('sha256', SESSION_SECRET).update(owner + '|' + exp).digest('base64url'); return `${owner}|${exp}|${mac}`; }
function checkToken(token) {
  // (secretReady resolves within the first second after start; a token checked earlier just fails once)
  const [owner, exp, mac] = String(token || '').split('|');
  if (!owner || !exp || !mac || !(Date.now() < Number(exp))) return null;
  const good = Buffer.from(crypto.createHmac('sha256', SESSION_SECRET).update(owner + '|' + exp).digest('base64url'));
  const got = Buffer.from(mac);
  return got.length === good.length && crypto.timingSafeEqual(got, good) ? owner : null;
}
// signed = what NEAR Connect's signMessage returns: { accountId, publicKey, signature (base64) }, plus our message/nonce
async function openSession({ accountId, publicKey, signature, message, nonce }, { checkKey = near.viewAccessKey } = {}) {
  await secretReady;
  if (!pay.isNearAccount(accountId)) throw new Error('bad account');
  const m = /^Sir Near: let my agent wallet act for (\S+) for 24 hours, within its limits\. (\d{13})$/.exec(String(message || ''));
  if (!m || m[1] !== accountId) throw new Error('unexpected message');
  if (Math.abs(Date.now() - Number(m[2])) > 5 * 60e3) throw new Error('message too old');
  await verifyOwnerSignature({ accountId, publicKey, signature, message, nonce }, { checkKey });
  const exp = Date.now() + SESSION_MS;
  return { token: tokenFor(accountId, exp), owner: accountId, expiresAt: exp };
}
// NEP-413 signature (recipient "sir-near") by a FULL-ACCESS key of the account, checked on chain
async function verifyOwnerSignature({ accountId, publicKey, signature, message, nonce }, { checkKey = near.viewAccessKey } = {}) {
  const nonceBuf = Buffer.from(String(nonce || ''), 'base64');
  const hash = crypto.createHash('sha256').update(near.nep413Bytes({ message, nonce: nonceBuf, recipient: RECIPIENT })).digest();
  const sig = String(signature).startsWith('ed25519:') ? near.b58decode(String(signature).slice(8)) : Buffer.from(String(signature), 'base64');
  const pub = near.b58decode(String(publicKey).replace(/^ed25519:/, ''));
  if (pub.length !== 32 || sig.length !== 64 || !near.verify(pub, hash, sig)) throw new Error('bad signature');
  const ak = await checkKey(accountId, String(publicKey).startsWith('ed25519:') ? publicKey : 'ed25519:' + publicKey);
  if (!ak || ak.permission !== 'FullAccess') throw new Error('the key must be a full-access key of this account');
  return true;
}

// ---- limits: the owner sets them with a signed message; kept with the day's spending in an encrypted file,
// so a restart neither resets the daily counter nor the owner's choice
const MAX_PER_ACTION = Number(process.env.AGENT_CAP_ACTION_USD || 500), MAX_PER_DAY = Number(process.env.AGENT_CAP_DAY_USD || 2000);
const store = require('./store').encryptedFile(path.join(process.env.DATA_DIR || path.join(__dirname, '..', 'data'), 'agent.bin'), () => storageKey('sir-near/agent-settings'));
const limitsMessage = (owner, a, d, ts) => `Sir Near: set my agent wallet limits for ${owner}: $${a} per action, $${d} per day. ${ts}`;
async function spentToday(owner) { const r = (await store.load())[owner]; return r && r.spent && r.spent.day === new Date().toISOString().slice(0, 10) ? r.spent.usd : 0; }
async function limitsFor(owner) { const s = (await store.load())[owner]; return s && s.limits ? s.limits : { ...LIMITS }; }
async function setLimits({ accountId, publicKey, signature, message, nonce }, { checkKey = near.viewAccessKey } = {}) {
  if (!pay.isNearAccount(accountId)) throw new Error('bad account');
  const m = /^Sir Near: set my agent wallet limits for (\S+): \$(\d+(?:\.\d{1,2})?) per action, \$(\d+(?:\.\d{1,2})?) per day\. (\d{13})$/.exec(String(message || ''));
  if (!m || m[1] !== accountId) throw new Error('unexpected message');
  if (Math.abs(Date.now() - Number(m[4])) > 5 * 60e3) throw new Error('message too old');
  const a = Number(m[2]), d = Number(m[3]);
  if (!(a >= 1 && a <= MAX_PER_ACTION)) throw new Error(`per action: $1–$${MAX_PER_ACTION}`);
  if (!(d >= a && d <= MAX_PER_DAY)) throw new Error(`per day: from the per-action limit up to $${MAX_PER_DAY}`);
  await verifyOwnerSignature({ accountId, publicKey, signature, message, nonce }, { checkKey });
  const all = await store.load(); all[accountId] = { ...(all[accountId] || {}), limits: { perActionUsd: a, perDayUsd: d } }; await store.save();
  return { owner: accountId, limits: all[accountId].limits };
}
async function reserve(owner, usd) {
  if (!(usd > 0)) throw new Error('bad amount');
  const L = await limitsFor(owner), all = await store.load();
  if (usd > L.perActionUsd) throw new Error(`agent wallet limit: at most $${L.perActionUsd} per action`);
  const day = new Date().toISOString().slice(0, 10);
  const rec = all[owner] || (all[owner] = {}); const used = rec.spent && rec.spent.day === day ? rec.spent.usd : 0;
  if (used + usd > L.perDayUsd) throw new Error(`agent wallet limit: at most $${L.perDayUsd} per day ($${Math.max(0, L.perDayUsd - used).toFixed(2)} left today)`);
  rec.spent = { day, usd: used + usd }; await store.save();
  return async () => { const x = (await store.load())[owner]; if (x && x.spent) { x.spent.usd = Math.max(0, x.spent.usd - usd); await store.save(); } };   // undo if the payment fails
}

// ---- the agent's money lives inside NEAR Intents (private Confidential Intents balance, plus any public
// intents.near balance). Paying = 1Click quote → intent generated for it → signed here with the TEE key → submitted.
// No gas and no on-chain transaction from the agent account.
const sessions = new Map();   // agent account → { token, at }
async function intentsToken(key) {
  const acc = key.implicitAccount, c = sessions.get(acc);
  if (c && Date.now() - c.at < 10 * 60e3) return c.token;
  const a = await pay.authenticate(key, acc);
  if (!a.ok) throw new Error('NEAR Intents session failed: ' + (a.message || a.http));
  sessions.set(acc, { token: a.token, at: Date.now() });
  return a.token;
}
const SYMS = ['USDT', 'NEAR'];
async function balancesOf(key) {
  const account = key.implicitAccount;
  const [chain, priv] = await Promise.all([pay.balances(account), intentsToken(key).then(pay.privateBalances).catch(() => ({ NEAR: '0', USDT: '0' }))]);
  const pub = chain.intents || { NEAR: '0', USDT: '0' };
  const total = {}; for (const s of SYMS) total[s] = (BigInt(priv[s] || '0') + BigInt(pub[s] || '0')).toString();
  return { total, private: priv, intents: pub, wallet: { nativeNEAR: chain.nativeNEAR, wNEAR: chain.wNEAR, USDT: chain.USDT } };
}
async function info(owner) {
  const key = await agentKey(owner);
  const b = await balancesOf(key);
  return { mode: mode(), account: key.implicitAccount, publicKey: key.publicKey, balances: { ...b.total, private: b.private, intents: b.intents, wallet: b.wallet }, limits: await limitsFor(owner), spentToday: await spentToday(owner), caps: { perActionUsd: MAX_PER_ACTION, perDayUsd: MAX_PER_DAY } };
}
// quote (already built) → generated intent → checked → signed in the TEE → submitted
async function signAndRun(key, req) {
  const token = await intentsToken(key);
  const r = await pay.call('/v0/quote', { method: 'POST', body: req, bearer: token });
  const q = r.json && r.json.quote;
  if (!r.ok || !q || !q.depositAddress) throw new Error((r.json && (r.json.message || r.json.error)) || 'quote failed');
  const g = await pay.call('/v0/generate-intent', { method: 'POST', body: { type: 'swap_transfer', standard: 'nep413', signerId: key.implicitAccount, depositAddress: q.depositAddress } });
  const intent = g.json && g.json.intent;
  if (!g.ok || !intent || !intent.payload || !pay.isNearAccount(intent.payload.recipient)) throw new Error((g.json && g.json.message) || 'generate-intent failed');
  pay.checkIntent(intent.payload.message, { signer: key.implicitAccount, depositAddress: q.depositAddress, asset: req.originAsset, maxAmount: q.amountIn });
  const signed = near.signNep413(key, { message: intent.payload.message, recipient: intent.payload.recipient, nonce: Buffer.from(intent.payload.nonce, 'base64') });
  await pay.submitIntent(signed);
  return q;
}

// Execute a payment from the agent wallet (within limits), from its private balance only
async function execute(owner, proposal) {
  const key = await agentKey(owner);
  const from = key.implicitAccount;
  if (proposal.toChain && proposal.toChain !== 'near') await pay.ensureChainAssets();
  const prices = { NEAR: (await pay.tokens().then(l => Number((l.find(t => t.assetId === 'nep141:wrap.near') || {}).price)).catch(() => NaN)) };
  const sizedKey = proposal.action === 'send' ? `${String(proposal.token).toUpperCase()}@${String(proposal.toChain || 'near').toLowerCase()}` : `${String(proposal.token).toUpperCase()}@near`;
  const sized = pay.ASSETS[sizedKey]; if (!sized) throw new Error('unsupported token');
  const usd = Number(proposal.amount) * (sized.usd ?? prices[sized.symbol]);
  const b = await balancesOf(key);
  const undo = await reserve(owner, usd);
  try {
    let req = pay.buildQuote({ ...proposal, from, source: 'private' }, { prices });
    if (req.recipientType !== 'DESTINATION_CHAIN' && !(await pay.recipientExists(req.recipient))) throw new Error(`account ${req.recipient} does not exist`);
    const sym = Object.values(pay.ASSETS).find(a => a.assetId === req.originAsset).symbol;
    // dry quote for the input amount, then pick the balance that covers it
    const dry = await pay.call('/v0/quote', { method: 'POST', body: { ...req, dry: true }, bearer: await intentsToken(key) });
    const need = BigInt(String((dry.json && dry.json.quote && dry.json.quote.amountIn) || '0'));
    if (!dry.ok || need === 0n) throw new Error((dry.json && dry.json.message) || 'quote failed');
    // the agent pays only from its PRIVATE balance (all top-ups land there); any old public balance is only withdrawn
    if (BigInt(b.private[sym] || '0') < need) throw new Error(`not enough ${sym} on the agent's private balance — top it up first`);
    const q = await signAndRun(key, req);
    return { depositAddress: q.depositAddress, amountInFormatted: q.amountInFormatted, amountOutFormatted: q.amountOutFormatted, recipient: req.recipient, timeEstimate: q.timeEstimate };
  } catch (e) { await undo(); throw e; }
}

async function status(owner, depositAddress) { const key = await agentKey(owner); return pay.status(depositAddress, { bearer: await intentsToken(key) }); }

// Everything back to the owner's own private (Confidential Intents) balance, which the owner's card can spend
async function withdraw(owner) {
  const key = await agentKey(owner);
  const from = key.implicitAccount;
  const b = await balancesOf(key);
  const out = [];
  for (const sym of SYMS) for (const source of ['private', 'intents']) {
    const amt = BigInt(b[source][sym] || '0');
    if (amt <= 0n) continue;
    const asset = pay.ASSETS[sym + '@near'].assetId, rail = pay.RAIL[source];
    const req = { dry: false, swapType: 'EXACT_INPUT', slippageTolerance: 100, originAsset: asset, depositType: rail, destinationAsset: asset, amount: amt.toString(),
      recipient: owner, recipientType: 'CONFIDENTIAL_INTENTS', refundTo: from, refundType: rail, deadline: new Date(Date.now() + 15 * 60e3).toISOString(), quoteWaitingTimeMs: 3000, confidentiality: 'advanced', referral: 'sirnear' };
    try { const q = await signAndRun(key, req); out.push({ token: sym, from: source, depositAddress: q.depositAddress, amount: q.amountInFormatted }); }
    catch (e) { out.push({ token: sym, from: source, error: e.message }); }
  }
  // leftovers on the agent's plain NEAR account (older top-ups): public transfers home, paid from its own NEAR
  for (const sym of ['USDT', 'NEAR']) {
    const contract = pay.ASSETS[sym + '@near'].assetId.replace(/^nep141:/, '');
    const bal = BigInt(String((sym === 'NEAR' ? b.wallet.wNEAR : b.wallet.USDT) || '0'));
    if (bal > 0n && BigInt(b.wallet.nativeNEAR || '0') > 0n) try { out.push({ token: sym, from: 'wallet', tx: (await near.sendTx(key, from, contract, [
      { type: 'FunctionCall', methodName: 'storage_deposit', args: { account_id: owner, registration_only: true }, gas: '30000000000000', deposit: '1250000000000000000000' },
      { type: 'FunctionCall', methodName: 'ft_transfer', args: { receiver_id: owner, amount: bal.toString() }, gas: '30000000000000', deposit: '1' }])).hash }); } catch (e) { out.push({ token: sym, from: 'wallet', error: e.message }); }
  }
  const acc = await near.viewAccount(from).catch(() => null);
  if (acc) {
    const amount = BigInt(acc.amount) - 5n * 10n ** 21n - BigInt(acc.storage_usage || 0) * 10n ** 19n;   // 0.005 NEAR stays for gas
    if (amount > 0n) try { out.push({ token: 'NEAR', from: 'wallet', tx: (await near.sendTx(key, from, owner, [{ type: 'Transfer', deposit: amount.toString() }])).hash }); } catch (e) { out.push({ token: 'NEAR', from: 'wallet', error: e.message }); }
  }
  return { moved: out };
}

// 32-byte key for data this app keeps at rest (standing orders): from the TEE root on Phala, the dev seed elsewhere
async function storageKey(label) {
  if (SOCK) { const r = await dstackGetKey(label); const hex = String(r.key || r.asBytes || '').replace(/^0x/, ''); if (!hex) throw new Error('no TEE key'); return crypto.createHash('sha256').update(Buffer.from(hex, 'hex')).update(label).digest(); }
  if (DEV_SEED) return crypto.createHmac('sha256', DEV_SEED).update(label).digest();
  return null;
}

// the agent's NEAR Intents session (to read the status of a payment the agent made, e.g. a paid review)
async function intentsTokenFor(owner) { return intentsToken(await agentKey(owner)); }

module.exports = { setLimits, limitsFor, limitsMessage, intentsTokenFor, storageKey, status, mode, LIMITS, agentKey, info, openSession, checkToken, reserve, execute, withdraw, sessionMessage, RECIPIENT };
