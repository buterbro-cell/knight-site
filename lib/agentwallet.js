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
const SESSION_SECRET = crypto.randomBytes(32);   // new per process: sessions die on restart
const SESSION_MS = 30 * 60e3;
const sessionMessage = (owner, issuedAt) => `Sir Near: let my agent wallet act for ${owner} for 30 minutes, within its limits. ${issuedAt}`;
const RECIPIENT = 'sir-near';
function tokenFor(owner, exp) { const mac = crypto.createHmac('sha256', SESSION_SECRET).update(owner + '|' + exp).digest('base64url'); return `${owner}|${exp}|${mac}`; }
function checkToken(token) {
  const [owner, exp, mac] = String(token || '').split('|');
  if (!owner || !exp || !mac || !(Date.now() < Number(exp))) return null;
  const good = Buffer.from(crypto.createHmac('sha256', SESSION_SECRET).update(owner + '|' + exp).digest('base64url'));
  const got = Buffer.from(mac);
  return got.length === good.length && crypto.timingSafeEqual(got, good) ? owner : null;
}
// signed = what NEAR Connect's signMessage returns: { accountId, publicKey, signature (base64) }, plus our message/nonce
async function openSession({ accountId, publicKey, signature, message, nonce }, { checkKey = near.viewAccessKey } = {}) {
  if (!pay.isNearAccount(accountId)) throw new Error('bad account');
  const m = /^Sir Near: let my agent wallet act for (\S+) for 30 minutes, within its limits\. (\d{13})$/.exec(String(message || ''));
  if (!m || m[1] !== accountId) throw new Error('unexpected message');
  if (Math.abs(Date.now() - Number(m[2])) > 5 * 60e3) throw new Error('message too old');
  const nonceBuf = Buffer.from(String(nonce || ''), 'base64');
  const hash = crypto.createHash('sha256').update(near.nep413Bytes({ message, nonce: nonceBuf, recipient: RECIPIENT })).digest();
  const sig = String(signature).startsWith('ed25519:') ? near.b58decode(String(signature).slice(8)) : Buffer.from(String(signature), 'base64');
  const pub = near.b58decode(String(publicKey).replace(/^ed25519:/, ''));
  if (pub.length !== 32 || sig.length !== 64 || !near.verify(pub, hash, sig)) throw new Error('bad signature');
  const ak = await checkKey(accountId, String(publicKey).startsWith('ed25519:') ? publicKey : 'ed25519:' + publicKey);
  if (!ak || ak.permission !== 'FullAccess') throw new Error('the key must be a full-access key of this account');
  const exp = Date.now() + SESSION_MS;
  return { token: tokenFor(accountId, exp), owner: accountId, expiresAt: exp };
}

// ---- limits (in memory; a restart resets the daily counter — stated in the threat model)
const spent = new Map();   // owner → { day, usd }
function reserve(owner, usd) {
  if (!(usd > 0)) throw new Error('bad amount');
  if (usd > LIMITS.perActionUsd) throw new Error(`agent wallet limit: at most $${LIMITS.perActionUsd} per action`);
  const day = new Date().toISOString().slice(0, 10);
  const s = spent.get(owner); const used = s && s.day === day ? s.usd : 0;
  if (used + usd > LIMITS.perDayUsd) throw new Error(`agent wallet limit: at most $${LIMITS.perDayUsd} per day`);
  spent.set(owner, { day, usd: used + usd });
  return () => { const x = spent.get(owner); if (x) x.usd = Math.max(0, x.usd - usd); };   // undo if the payment fails
}

const USDC = pay.ASSETS['USDC@near'];
const usdcContract = USDC.assetId.replace(/^nep141:/, '');
async function info(owner) {
  const key = await agentKey(owner);
  const account = key.implicitAccount;
  const balances = await pay.balances(account);
  return { mode: mode(), account, publicKey: key.publicKey, exists: balances.exists, balances, limits: LIMITS, usdcContract, tokens: { USDC: usdcContract, USDT: pay.ASSETS['USDT@near'].assetId.replace(/^nep141:/, '') } };
}

// Execute a payment from the agent wallet: confidential quote (refunds to the agent wallet) → deposit signed in the TEE
async function execute(owner, proposal) {
  const key = await agentKey(owner);
  const from = key.implicitAccount;
  const prices = { NEAR: (await pay.tokens().then(l => Number((l.find(t => t.assetId === 'nep141:wrap.near') || {}).price)).catch(() => NaN)) };
  const req = pay.buildQuote({ ...proposal, from }, { prices });
  const sized = proposal.action === 'send' ? pay.ASSETS[`${String(proposal.token).toUpperCase()}@${String(proposal.toChain || 'near').toLowerCase()}`] : pay.ASSETS[`${String(proposal.token).toUpperCase()}@near`];
  const usd = Number(proposal.amount) * (sized.usd ?? prices[sized.symbol]);
  const undo = reserve(owner, usd);
  try {
    const r = await pay.call('/v0/quote', { method: 'POST', body: req });
    const q = r.json && r.json.quote;
    if (!r.ok || !q || !q.depositAddress) throw new Error((r.json && (r.json.message || r.json.error)) || 'quote failed');
    const origin = Object.values(pay.ASSETS).find(a => a.assetId === req.originAsset);
    const contract = origin.assetId.replace(/^nep141:/, '');
    const fc = (methodName, args, deposit) => ({ type: 'FunctionCall', methodName, args, gas: '30000000000000', deposit });
    const actions = [];
    if (origin.native) { actions.push(fc('storage_deposit', { account_id: from, registration_only: true }, '1250000000000000000000')); actions.push(fc('near_deposit', {}, q.amountIn)); }
    actions.push(fc('storage_deposit', { account_id: q.depositAddress, registration_only: true }, '1250000000000000000000'));
    actions.push(fc('ft_transfer', { receiver_id: q.depositAddress, amount: q.amountIn }, '1'));
    const tx = await near.sendTx(key, from, contract, actions);
    pay.submit({ depositAddress: q.depositAddress, txHash: tx.hash, nearSenderAccount: from }).catch(() => {});
    return { depositAddress: q.depositAddress, txHash: tx.hash, amountInFormatted: q.amountInFormatted, amountOutFormatted: q.amountOutFormatted, recipient: req.recipient, timeEstimate: q.timeEstimate };
  } catch (e) { undo(); throw e; }
}

// Everything back to the owner (plain public transfers — withdrawing is the owner's own money moving home)
async function withdraw(owner) {
  const key = await agentKey(owner);
  const from = key.implicitAccount;
  const out = [];
  for (const sym of ['USDC', 'USDT', 'NEAR']) {
    const contract = pay.ASSETS[sym + '@near'].assetId.replace(/^nep141:/, '');   // NEAR here = leftover wNEAR
    const bal = BigInt(String(await near.viewCall(contract, 'ft_balance_of', { account_id: from }).catch(() => '0')));
    if (bal > 0n) out.push((await near.sendTx(key, from, contract, [
      { type: 'FunctionCall', methodName: 'storage_deposit', args: { account_id: owner, registration_only: true }, gas: '30000000000000', deposit: '1250000000000000000000' },
      { type: 'FunctionCall', methodName: 'ft_transfer', args: { receiver_id: owner, amount: bal.toString() }, gas: '30000000000000', deposit: '1' }])).hash);
  }
  const acc = await near.viewAccount(from);
  const keep = 5n * 10n ** 21n;   // 0.005 NEAR stays for storage and gas
  const amount = BigInt(acc.amount) - keep - BigInt(acc.storage_usage || 0) * 10n ** 19n;
  if (amount > 0n) out.push((await near.sendTx(key, from, owner, [{ type: 'Transfer', deposit: amount.toString() }])).hash);
  return { txs: out };
}

module.exports = { mode, LIMITS, agentKey, info, openSession, checkToken, reserve, execute, withdraw, sessionMessage, RECIPIENT };
