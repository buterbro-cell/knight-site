// Private invoice payments through NEAR Intents (1Click API), with `confidentiality` on a normal quote:
// the visitor sends funds from their own wallet to a one-time deposit address; the link between that deposit
// and the payout to the merchant is not visible on chain (Confidential Intents). We never hold keys or funds.
// Docs: https://docs.near-intents.org/integration/distribution-channels/1click-api/quickstart/confidential-swaps
'use strict';
const near = require('./near');

const BASE = (process.env.ONECLICK_BASE || 'https://1click.chaindefuser.com').replace(/\/$/, '');
const JWT = () => process.env.ONECLICK_JWT || '';   // optional: lower fees; without it 1Click adds 0.25%

async function call(path, { method = 'GET', body, timeout = 20000, bearer } = {}) {
  const headers = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  if (bearer || JWT()) headers.Authorization = `Bearer ${bearer || JWT()}`;
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
async function authenticate(key, accountId) {
  const message = JSON.stringify({ deadline: new Date(Date.now() + 5 * 60e3).toISOString(), intents: [], signer_id: accountId });
  const signedData = near.signNep413(key, { message, recipient: 'intents.near' });
  const r = await call('/v0/auth/authenticate', { method: 'POST', body: { signedData } });
  return { http: r.status, ok: r.ok && !!(r.json && r.json.accessToken), token: r.json && r.json.accessToken, message: r.ok ? '' : (r.json && (r.json.message || r.json.error)) || r.text };
}

// One-shot diagnostic: which variants does 1Click accept right now (dry quotes, nothing is committed or paid)?
async function probe() {
  const out = { base: BASE, jwt: !!JWT(), at: new Date().toISOString(), tokens: null, cases: [] };
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
    for (const bearer of conf === 'public' ? [null] : [null, auth.token].filter((x, i) => i === 0 || x)) {
      const tag = bearer ? ' +user-session' : '';
      if (usdcNear && usdcBase) variants.push({ name: `USDC near → USDC base, ${conf}${tag}`, origin: usdcNear.assetId, dest: usdcBase.assetId, recipient: '0x1111111111111111111111111111111111111111', conf, bearer });
      if (usdcNear) variants.push({ name: `USDC near → USDC near, ${conf}${tag}`, origin: usdcNear.assetId, dest: usdcNear.assetId, recipient: near.randomKey().implicitAccount, conf, bearer });
      if (usdcNear && wnear) variants.push({ name: `USDC near → wNEAR, ${conf}${tag}`, origin: usdcNear.assetId, dest: wnear.assetId, recipient: near.randomKey().implicitAccount, conf, bearer });
    }
  }
  for (const v of variants) {
    const r = await call('/v0/quote', { method: 'POST', body: {
      dry: true, swapType: 'EXACT_OUTPUT', slippageTolerance: 100, originAsset: v.origin, depositType: 'ORIGIN_CHAIN',
      destinationAsset: v.dest, amount: '2000000', recipient: v.recipient, recipientType: 'DESTINATION_CHAIN',
      refundTo: key.implicitAccount, refundType: 'ORIGIN_CHAIN', deadline, quoteWaitingTimeMs: 3000, confidentiality: v.conf,
    }, bearer: v.bearer }).catch(e => ({ status: 0, ok: false, text: e.message }));
    const q = r.json && r.json.quote;
    out.cases.push({ name: v.name, http: r.status, ok: r.ok, amountIn: q && q.amountInFormatted, amountOut: q && q.amountOutFormatted, timeEstimate: q && q.timeEstimate,
      message: r.ok ? '' : (r.json && (r.json.message || r.json.error)) || r.text });
  }
  return out;
}

module.exports = { call, tokens, findToken, probe, authenticate };
