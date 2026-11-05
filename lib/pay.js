// Private invoice payments through NEAR Intents (1Click API), with `confidentiality` on a normal quote:
// the visitor sends funds from their own wallet to a one-time deposit address; the link between that deposit
// and the payout to the merchant is not visible on chain (Confidential Intents). We never hold keys or funds.
// Docs: https://docs.near-intents.org/integration/distribution-channels/1click-api/quickstart/confidential-swaps
'use strict';
const near = require('./near');

const BASE = (process.env.ONECLICK_BASE || 'https://1click.chaindefuser.com').replace(/\/$/, '');
const JWT = () => process.env.ONECLICK_JWT || '';   // optional: lower fees; without it 1Click adds 0.25%

async function call(path, { method = 'GET', body, timeout = 20000, bearer, extraHeaders, noPartner } = {}) {
  const headers = { Accept: 'application/json', ...(extraHeaders || {}) };
  if (body) headers['Content-Type'] = 'application/json';
  if (JWT() && !noPartner) headers['X-API-Key'] = JWT();         // partner key (documented header)
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  const r = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(timeout) });
  const text = await r.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  return { status: r.status, ok: r.ok, json, text: json ? '' : text.slice(0, 300) };
}

let tokensCache = null, tokensAt = 0;
async function tokens() {
  if (tokensCache && Date.now() - tokensAt < 10 * 60e3) return tokensCache;
  const r = await call('/v0/tokens');
  if (!r.ok || !Array.isArray(r.json)) throw new Error(`tokens: HTTP ${r.status}`);
  tokensCache = r.json; tokensAt = Date.now();
  return tokensCache;
}
const findToken = (list, symbol, chain) => list.find(t => String(t.symbol).toUpperCase() === symbol && String(t.blockchain).toLowerCase() === chain);

// User session for confidential quotes: the account proves key ownership with a NEP-413 signature over an
// empty intents list (POST /v0/auth/authenticate) and gets a short-lived access token.
let saltCache = null, saltAt = 0;
async function intentsSalt() {
  if (saltCache && Date.now() - saltAt < 5 * 60e3) return saltCache;
  const hexSalt = await near.viewCall('intents.near', 'current_salt');
  saltCache = Buffer.from(String(hexSalt), 'hex'); saltAt = Date.now();
  return saltCache;
}
async function authenticate(key, accountId) {
  const deadline = new Date(Date.now() + 60e3);   // 1 minute, as the SDK default
  const message = JSON.stringify({ deadline: deadline.toISOString(), intents: [], signer_id: accountId });
  // random part carries the start time (ns, LE) in its first 8 bytes, as VersionedNonceBuilder.createTimestampedNonceBytes
  const rnd = Buffer.alloc(15); rnd.writeBigUInt64LE(BigInt(Date.now()) * 1000000n); require('crypto').randomBytes(7).copy(rnd, 8);
  const nonce = near.versionedNonce(await intentsSalt(), deadline, rnd);
  const signedData = near.signNep413(key, { message, recipient: 'intents.near', nonce });
  const r = await call('/v0/auth/authenticate', { method: 'POST', body: { signedData } });
  return { http: r.status, ok: r.ok && !!(r.json && r.json.accessToken), token: r.json && r.json.accessToken, message: r.ok ? '' : (r.json && (r.json.message || r.json.error)) || r.text };
}

// One-shot diagnostic: which variants does 1Click accept right now (dry quotes, nothing is committed or paid)?
async function probe() {
  const out = { probeVersion: 5, base: BASE, jwt: !!JWT(), at: new Date().toISOString(), tokens: null, cases: [] };
  // throwaway key → implicit account, only to see whether user-session auth unlocks confidential quotes
  const key = near.randomKey();
  const auth = await authenticate(key, key.implicitAccount).catch(e => ({ ok: false, message: e.message }));
  out.auth = { http: auth.http, ok: auth.ok, message: auth.message };
  let list;
  try { list = await tokens(); out.tokens = list.length; } catch (e) { out.error = e.message; return out; }
  const usdcNear = findToken(list, 'USDC', 'near'), usdcBase = findToken(list, 'USDC', 'base'), wnear = list.find(t => t.assetId === 'nep141:wrap.near');
  out.assets = { usdcNear: usdcNear && usdcNear.assetId, usdcBase: usdcBase && usdcBase.assetId, wnear: wnear && wnear.assetId };
  const deadline = new Date(Date.now() + 15 * 60e3).toISOString();
  const variants = [];
  for (const conf of ['public', 'basic', 'advanced']) {
    if (conf === 'public') {
      if (usdcNear) variants.push({ name: `USDC near → USDC near, public`, origin: usdcNear.assetId, dest: usdcNear.assetId, recipient: near.randomKey().implicitAccount, conf });
      continue;
    }
    // partner key alone, partner key + user session (Bearer), partner key + user session (X-User-Session)
    const combos = [['partner key', {}], ...(auth.token ? [['partner key + user Bearer', { bearer: auth.token }], ['partner key + X-User-Session', { headers: { 'X-User-Session': auth.token } }]] : [])];
    for (const [cn, extra] of combos) {
      if (usdcNear) variants.push({ name: `USDC near → USDC near, ${conf}, ${cn}`, origin: usdcNear.assetId, dest: usdcNear.assetId, recipient: near.randomKey().implicitAccount, conf, ...extra });
      if (usdcNear && usdcBase) variants.push({ name: `USDC near → USDC base, ${conf}, ${cn}`, origin: usdcNear.assetId, dest: usdcBase.assetId, recipient: '0x1111111111111111111111111111111111111111', conf, ...extra });
    }
  }
  for (const v of variants) {
    const r = await call('/v0/quote', { method: 'POST', body: {
      dry: true, swapType: 'EXACT_OUTPUT', slippageTolerance: 100, originAsset: v.origin, depositType: 'ORIGIN_CHAIN',
      destinationAsset: v.dest, amount: '2000000', recipient: v.recipient, recipientType: 'DESTINATION_CHAIN',
      refundTo: key.implicitAccount, refundType: 'ORIGIN_CHAIN', deadline, quoteWaitingTimeMs: 3000, confidentiality: v.conf,
    }, extraHeaders: v.headers, bearer: v.bearer }).catch(e => ({ status: 0, ok: false, text: e.message }));
    const q = r.json && r.json.quote;
    out.cases.push({ name: v.name, http: r.status, ok: r.ok, amountIn: q && q.amountInFormatted, amountOut: q && q.amountOutFormatted, timeEstimate: q && q.timeEstimate,
      message: r.ok ? '' : (r.json && (r.json.message || r.json.error)) || r.text });
  }
  return out;
}


// ---------------------------------------------------------------- real payments (quote → wallet → status)
// What the assistant can do with money, on purpose small: send or swap USDC/NEAR, at most MAX_USD per action.
const MAX_USD = Number(process.env.PAY_MAX_USD || 50);
const ASSETS = {
  'USDC@near': { assetId: 'nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1', decimals: 6, symbol: 'USDC', chain: 'near', usd: 1 },
  'NEAR@near': { assetId: 'nep141:wrap.near', decimals: 24, symbol: 'NEAR', chain: 'near', native: true },
  'USDC@base': { assetId: 'nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near', decimals: 6, symbol: 'USDC', chain: 'base', usd: 1 },
};
const NEAR_ACCOUNT = /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/;
const isNearAccount = a => typeof a === 'string' && a.length >= 2 && a.length <= 64 && NEAR_ACCOUNT.test(a);
const isEvmAddress = a => typeof a === 'string' && /^0x[0-9a-fA-F]{40}$/.test(a);

// "2.5" → 2500000n for 6 decimals; rejects anything that is not a plain positive decimal
function toUnits(amount, decimals) {
  const s = String(amount).trim();
  if (!/^\d+(\.\d+)?$/.test(s)) throw new Error('bad amount');
  const [i, f = ''] = s.split('.');
  if (f.length > decimals) throw new Error('too many decimals');
  const v = BigInt(i) * 10n ** BigInt(decimals) + BigInt((f + '0'.repeat(decimals)).slice(0, decimals) || '0');
  if (v <= 0n) throw new Error('amount must be positive');
  return v;
}
const assetKey = (symbol, chain = 'near') => `${String(symbol || '').toUpperCase()}@${String(chain || 'near').toLowerCase()}`;

// Validates a payment request coming from the browser and turns it into a 1Click quote request.
//   send: recipient gets exactly `amount` of `token` (EXACT_OUTPUT); swap: user puts in exactly `amount` (EXACT_INPUT)
function buildQuote({ action, amount, token, toToken, toChain, to, from }, { prices = {}, now = Date.now(), confidentiality = 'advanced' } = {}) {
  if (!['send', 'swap'].includes(action)) throw new Error('action must be send or swap');
  if (!isNearAccount(from)) throw new Error('connect a NEAR wallet first');
  const origin = ASSETS[assetKey(token, 'near')];
  if (!origin) throw new Error('unsupported token');
  const destKey = action === 'send' ? assetKey(toToken || token, toChain || 'near') : assetKey(toToken, 'near');
  const dest = ASSETS[destKey];
  if (!dest) throw new Error('unsupported destination');
  if (action === 'swap' && dest.assetId === origin.assetId) throw new Error('swap needs two different tokens');
  let recipient;
  if (action === 'swap') recipient = from;
  else if (dest.chain === 'near') { if (!isNearAccount(to)) throw new Error('bad NEAR recipient'); recipient = to; }
  else { if (!isEvmAddress(to)) throw new Error('bad Base address'); recipient = to; }
  const sized = action === 'send' ? dest : origin;
  const units = toUnits(amount, sized.decimals);
  const usd = (sized.usd ?? prices[sized.symbol]) ;
  if (usd == null) throw new Error('price unknown, try again');
  if (Number(amount) * usd > MAX_USD) throw new Error(`demo limit: at most $${MAX_USD} per action`);
  return {
    dry: false,
    swapType: action === 'send' ? 'EXACT_OUTPUT' : 'EXACT_INPUT',
    slippageTolerance: 100,
    originAsset: origin.assetId, depositType: 'ORIGIN_CHAIN',
    destinationAsset: dest.assetId, amount: units.toString(),
    recipient, recipientType: 'DESTINATION_CHAIN',
    refundTo: from, refundType: 'ORIGIN_CHAIN',
    deadline: new Date(now + 15 * 60e3).toISOString(),
    quoteWaitingTimeMs: 3000, confidentiality, referral: 'sirnear',
  };
}

async function prices() {
  const list = await tokens();
  const near = list.find(t => t.assetId === 'nep141:wrap.near');
  return { NEAR: near && Number(near.price) };
}

// The browser gets only what it needs to build the wallet transaction and show the card
function publicQuote(req, res) {
  const q = res.quote || {};
  const origin = Object.values(ASSETS).find(a => a.assetId === req.originAsset);
  const dest = Object.values(ASSETS).find(a => a.assetId === req.destinationAsset);
  return {
    depositAddress: q.depositAddress, amountIn: q.amountIn, amountInFormatted: q.amountInFormatted, amountInUsd: q.amountInUsd,
    amountOut: q.amountOut, amountOutFormatted: q.amountOutFormatted, deadline: q.deadline, timeEstimate: q.timeEstimate,
    recipient: req.recipient, confidentiality: req.confidentiality,
    origin: origin && { symbol: origin.symbol, chain: origin.chain, contract: origin.assetId.replace(/^nep141:/, ''), native: !!origin.native },
    dest: dest && { symbol: dest.symbol, chain: dest.chain },
  };
}

async function quote(input) {
  const req = buildQuote(input, { prices: await prices().catch(() => ({})) });
  const r = await call('/v0/quote', { method: 'POST', body: req });
  if (!r.ok || !r.json || !r.json.quote || !r.json.quote.depositAddress) throw new Error((r.json && (r.json.message || r.json.error)) || `quote failed (HTTP ${r.status})`);
  return publicQuote(req, r.json);
}
async function submit({ depositAddress, txHash, nearSenderAccount }) {
  if (!isNearAccount(depositAddress) || !/^[1-9A-HJ-NP-Za-km-z]{40,50}$/.test(String(txHash)) || !isNearAccount(nearSenderAccount)) throw new Error('bad submit');
  const r = await call('/v0/deposit/submit', { method: 'POST', body: { depositAddress, txHash, nearSenderAccount } });
  return { ok: r.ok, http: r.status };
}
async function status(depositAddress) {
  if (!isNearAccount(depositAddress)) throw new Error('bad deposit address');
  const r = await call('/v0/status?depositAddress=' + encodeURIComponent(depositAddress));
  if (!r.ok || !r.json) throw new Error(`status failed (HTTP ${r.status})`);
  const s = r.json, d = s.swapDetails || {}, qr = (s.quoteResponse && s.quoteResponse.quoteRequest) || {};
  return {
    status: s.status, updatedAt: s.updatedAt,
    amountInFormatted: d.amountInFormatted, amountOutFormatted: d.amountOutFormatted, amountOut: d.amountOut,
    recipient: qr.recipient, destinationAsset: qr.destinationAsset, confidentiality: qr.confidentiality,
    originTx: (d.originChainTxHashes || []).map(x => x.explorerUrl).filter(Boolean),
    destTx: (d.destinationChainTxHashes || []).map(x => x.explorerUrl).filter(Boolean),
    refundReason: d.refundReason || null,
  };
}

// Paid private review (business profile `paidReview`): a document answer is unlocked only by a finished payment
// to the business's own address for at least the price. Each payment unlocks one review (kept in memory only).
const usedDeposits = new Map();
async function checkPaid(depositAddress, { recipient, priceUnits, assetId }) {
  const s = await status(depositAddress);
  const ok = s.status === 'SUCCESS' && s.recipient === recipient && s.destinationAsset === assetId && BigInt(s.amountOut || '0') >= BigInt(priceUnits);
  return { ok, status: s.status };
}
// One payment = one document: follow-up questions about the same document are free for 30 minutes.
function consumeDeposit(depositAddress, docName = '') {
  const now = Date.now();
  for (const [k, v] of usedDeposits) if (now - v.at > 24 * 3600e3) usedDeposits.delete(k);
  const u = usedDeposits.get(depositAddress);
  if (!u) { usedDeposits.set(depositAddress, { doc: docName, at: now }); return true; }
  return u.doc === docName && now - u.at < 30 * 60e3;
}

module.exports = { call, tokens, findToken, probe, authenticate, intentsSalt, ASSETS, MAX_USD, toUnits, isNearAccount, isEvmAddress, buildQuote, publicQuote, quote, submit, status, checkPaid, consumeDeposit };
