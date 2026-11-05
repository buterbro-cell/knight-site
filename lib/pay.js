// Private invoice payments through NEAR Intents (1Click API), with `confidentiality` on a normal quote:
// the visitor sends funds from their own wallet to a one-time deposit address; the link between that deposit
// and the payout to the merchant is not visible on chain (Confidential Intents). We never hold keys or funds.
// Docs: https://docs.near-intents.org/integration/distribution-channels/1click-api/quickstart/confidential-swaps
'use strict';

const BASE = (process.env.ONECLICK_BASE || 'https://1click.chaindefuser.com').replace(/\/$/, '');
const JWT = () => process.env.ONECLICK_JWT || '';   // optional: lower fees; without it 1Click adds 0.25%

async function call(path, { method = 'GET', body, timeout = 20000 } = {}) {
  const headers = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  if (JWT()) headers.Authorization = `Bearer ${JWT()}`;
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

// One-shot diagnostic: which variants does 1Click accept right now (dry quotes, nothing is committed or paid)?
async function probe() {
  const out = { base: BASE, jwt: !!JWT(), at: new Date().toISOString(), tokens: null, cases: [] };
  let list;
  try { list = await tokens(); out.tokens = list.length; } catch (e) { out.error = e.message; return out; }
  const usdcNear = findToken(list, 'USDC', 'near'), usdcBase = findToken(list, 'USDC', 'base'), wnear = list.find(t => t.assetId === 'nep141:wrap.near');
  out.assets = { usdcNear: usdcNear && usdcNear.assetId, usdcBase: usdcBase && usdcBase.assetId, wnear: wnear && wnear.assetId };
  const deadline = new Date(Date.now() + 15 * 60e3).toISOString();
  const variants = [];
  for (const conf of ['public', 'basic', 'advanced']) {
    if (usdcNear && usdcBase) variants.push({ name: `USDC near → USDC base, ${conf}`, origin: usdcNear.assetId, dest: usdcBase.assetId, recipient: '0x000000000000000000000000000000000000dEaD', conf });
    if (usdcNear) variants.push({ name: `USDC near → USDC near (same asset), ${conf}`, origin: usdcNear.assetId, dest: usdcNear.assetId, recipient: 'sirnear-demo.near', conf });
  }
  for (const v of variants) {
    const r = await call('/v0/quote', { method: 'POST', body: {
      dry: true, swapType: 'EXACT_OUTPUT', slippageTolerance: 100, originAsset: v.origin, depositType: 'ORIGIN_CHAIN',
      destinationAsset: v.dest, amount: '2000000', recipient: v.recipient, recipientType: 'DESTINATION_CHAIN',
      refundTo: 'sirnear-demo.near', refundType: 'ORIGIN_CHAIN', deadline, quoteWaitingTimeMs: 3000, confidentiality: v.conf,
    } }).catch(e => ({ status: 0, ok: false, text: e.message }));
    const q = r.json && r.json.quote;
    out.cases.push({ name: v.name, http: r.status, ok: r.ok, amountIn: q && q.amountInFormatted, amountOut: q && q.amountOutFormatted, timeEstimate: q && q.timeEstimate,
      message: r.ok ? '' : (r.json && (r.json.message || r.json.error)) || r.text });
  }
  return out;
}

module.exports = { call, tokens, findToken, probe };
