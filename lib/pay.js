// Private payments through NEAR Intents (1Click API) on the Intents rail, the same way near.com works:
// funds sit on the payer's own balance inside NEAR Intents (public `intents.near` ledger or the private
// Confidential Intents balance); a payment is a quote + an intent the payer's own key signs (NEP-413), and the
// payout lands on the recipient's Confidential Intents balance. No gas, and we never hold keys or funds.
// Docs: https://docs.near-intents.org/integration/distribution-channels/1click-api/quickstart/signed-intent-execution
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
// What the account signs to open a user session: an empty intents list (NEP-413, recipient intents.near)
async function authChallenge(accountId) {
  if (!isNearAccount(accountId)) throw new Error('bad account');
  const deadline = new Date(Date.now() + 60e3);   // 1 minute, as the SDK default
  const message = JSON.stringify({ deadline: deadline.toISOString(), intents: [], signer_id: accountId });
  // random part carries the start time (ns, LE) in its first 8 bytes, as VersionedNonceBuilder.createTimestampedNonceBytes
  const rnd = Buffer.alloc(15); rnd.writeBigUInt64LE(BigInt(Date.now()) * 1000000n); require('crypto').randomBytes(7).copy(rnd, 8);
  const nonce = near.versionedNonce(await intentsSalt(), deadline, rnd);
  return { message, nonce: nonce.toString('base64'), recipient: 'intents.near' };
}
async function authWith(signedData) {
  const r = await call('/v0/auth/authenticate', { method: 'POST', body: { signedData } });
  const j = r.json || {};
  return { http: r.status, ok: r.ok && !!j.accessToken, token: j.accessToken, refreshToken: j.refreshToken, expiresIn: j.expiresIn, message: r.ok ? '' : (j.message || j.error) || r.text };
}
// Server-side keys (the agent wallet, the probe) sign the challenge themselves
async function authenticate(key, accountId) {
  const c = await authChallenge(accountId);
  return authWith(near.signNep413(key, { message: c.message, recipient: c.recipient, nonce: Buffer.from(c.nonce, 'base64') }));
}
// A browser wallet's signMessage answer → the signedData shape NEAR Intents expects
const issuedRecipients = new Set(['intents.near']);
const knownRecipient = r => issuedRecipients.has(r);
function signedFromWallet({ message, nonce, recipient, publicKey, signature }) {
  const sig = String(signature || '');
  const sigB58 = sig.startsWith('ed25519:') ? sig : 'ed25519:' + near.b58encode(Buffer.from(sig, 'base64'));
  const pk = String(publicKey || ''); if (!/^ed25519:[1-9A-HJ-NP-Za-km-z]{40,50}$/.test(pk)) throw new Error('bad public key');
  if (!knownRecipient(recipient) || typeof message !== 'string' || Buffer.from(String(nonce || ''), 'base64').length !== 32) throw new Error('bad signed payload');
  return { standard: 'nep413', payload: { recipient, nonce, message }, public_key: pk, signature: sigB58 };
}

// One-shot diagnostic: which variants does 1Click accept right now (dry quotes, nothing is committed or paid)?
// Other chains: deposits into the private balance and payouts to other chains — all quotes in parallel (fast page)
async function probeCross() {
  const out = { probe: 'cross', at: new Date().toISOString() };
  const key = near.randomKey(), me = key.implicitAccount;
  const auth = await authenticate(key, me).catch(e => ({ ok: false, message: e.message }));
  out.auth = auth.ok; const B = auth.token;
  try { await ensureChainAssets(); } catch (e) { out.error = e.message; return out; }
  out.chains = chainList();
  const evm = '0x2527D02599Ba641c19FEa793cD0F167589a0f10D', usdtN = ASSETS['USDT@near'].assetId, wN = ASSETS['NEAR@near'].assetId;
  const q = async (name, body, bearer) => { try { const r = await call('/v0/quote', { method: 'POST', body: { dry: true, slippageTolerance: 100, quoteWaitingTimeMs: 1500, deadline: new Date(Date.now() + 6e5).toISOString(), ...body }, bearer }); return { name, ok: r.ok, out: r.json && r.json.quote && r.json.quote.amountOutFormatted, message: !r.ok ? (r.json && r.json.message) || ('HTTP ' + r.status) : undefined }; } catch (e) { return { name, ok: false, message: e.message }; } };
  const jobs = [];
  for (const ch of ['bsc', 'eth', 'arb', 'base', 'pol', 'sol', 'tron']) {
    const a = ASSETS['USDT@' + ch] || ASSETS['USDC@' + ch]; if (!a) { jobs.push(Promise.resolve({ name: ch + ': no USDT/USDC in /v0/tokens', ok: false })); continue; }
    const refund = ch === 'sol' ? '13QkxhNMrTPxoCkRdYdJ65tFuwXPhL5gLS2Z5Nr6gjRK' : ch === 'tron' ? 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9' : evm;
    const five = '5' + '0'.repeat(a.decimals);
    jobs.push(q(`IN  ${a.symbol}@${ch} → USDT private`, { swapType: 'EXACT_INPUT', originAsset: a.assetId, depositType: 'ORIGIN_CHAIN', destinationAsset: usdtN, amount: five, recipient: me, recipientType: 'CONFIDENTIAL_INTENTS', refundTo: refund, refundType: 'ORIGIN_CHAIN', confidentiality: 'advanced' }, B));
    jobs.push(q(`IN  ${a.symbol}@${ch} → NEAR private`, { swapType: 'EXACT_INPUT', originAsset: a.assetId, depositType: 'ORIGIN_CHAIN', destinationAsset: wN, amount: five, recipient: me, recipientType: 'CONFIDENTIAL_INTENTS', refundTo: refund, refundType: 'ORIGIN_CHAIN', confidentiality: 'advanced' }, B));
    jobs.push(q(`OUT USDT private → ${a.symbol}@${ch}`, { swapType: 'EXACT_OUTPUT', originAsset: usdtN, depositType: 'CONFIDENTIAL_INTENTS', destinationAsset: a.assetId, amount: five, recipient: refund, recipientType: 'DESTINATION_CHAIN', refundTo: me, refundType: 'CONFIDENTIAL_INTENTS', confidentiality: 'advanced' }, B));
  }
  out.cross = await Promise.all(jobs);
  out.summary = out.cross.map(c => (c.ok ? '✅ ' : '❌ ') + c.name).join(' | ');
  return out;
}
async function probe() {
  const out = { probeVersion: 13, base: BASE, jwt: !!JWT(), at: new Date().toISOString(), tokens: null, cases: [] };
  // throwaway key → implicit account, only to see whether user-session auth unlocks confidential quotes
  const key = near.randomKey();
  const auth = await authenticate(key, key.implicitAccount).catch(e => ({ ok: false, message: e.message }));
  out.auth = { http: auth.http, ok: auth.ok, message: auth.message };
  let list;
  try { list = await tokens(); out.tokens = list.length; } catch (e) { out.error = e.message; return out; }
  const usdcNear = findToken(list, 'USDC', 'near'), usdcBase = findToken(list, 'USDC', 'base'), wnear = list.find(t => t.assetId === 'nep141:wrap.near');
  out.assets = { usdcNear: usdcNear && usdcNear.assetId, usdcBase: usdcBase && usdcBase.assetId, wnear: wnear && wnear.assetId };
  const deadline = new Date(Date.now() + 15 * 60e3).toISOString();
  out.nearTokens = list.filter(t => String(t.blockchain).toLowerCase() === 'near' && /NEAR|USDT/i.test(String(t.symbol))).map(t => ({ symbol: t.symbol, assetId: t.assetId, decimals: t.decimals }));
  const usdt = 'nep141:usdt.tether-token.near', w = 'nep141:wrap.near';
  const R = () => near.randomKey().implicitAccount;
  const usdc = usdcNear && usdcNear.assetId;
  const me = key.implicitAccount, B = auth.token;
  const rails = (dt, rt, ft) => ({ dt, rt, ft, refund: me, recipient: rt === 'DESTINATION_CHAIN' ? R() : me });
  const variants = [
    { name: 'ORIGIN→DEST wNEAR→USDT advanced (old rail)', origin: w, dest: usdt, amount: '1000000', conf: 'advanced', ...rails('ORIGIN_CHAIN', 'DESTINATION_CHAIN', 'ORIGIN_CHAIN') },
    { name: 'INTENTS×3 wNEAR→USDT public', origin: w, dest: usdt, amount: '1000000', conf: 'public', ...rails('INTENTS', 'INTENTS', 'INTENTS') },
    { name: 'INTENTS×3 wNEAR→wNEAR public', origin: w, dest: w, amount: '200000000000000000000000', conf: 'public', ...rails('INTENTS', 'INTENTS', 'INTENTS') },
    { name: 'INTENTS×3 USDT→USDT advanced +user', origin: usdt, dest: usdt, amount: '1000000', conf: 'advanced', bearer: B, ...rails('INTENTS', 'INTENTS', 'INTENTS') },
    { name: 'INTENTS×3 wNEAR→USDT advanced +user', origin: w, dest: usdt, amount: '1000000', conf: 'advanced', bearer: B, ...rails('INTENTS', 'INTENTS', 'INTENTS') },
    { name: 'CONF×3 wNEAR→USDT advanced +user', origin: w, dest: usdt, amount: '1000000', conf: 'advanced', bearer: B, ...rails('CONFIDENTIAL_INTENTS', 'CONFIDENTIAL_INTENTS', 'CONFIDENTIAL_INTENTS') },
    { name: 'CONF×3 wNEAR→wNEAR advanced +user', origin: w, dest: w, amount: '200000000000000000000000', conf: 'advanced', bearer: B, ...rails('CONFIDENTIAL_INTENTS', 'CONFIDENTIAL_INTENTS', 'CONFIDENTIAL_INTENTS') },
    { name: 'INTENTS dep → CONF out wNEAR→USDT advanced +user', origin: w, dest: usdt, amount: '1000000', conf: 'advanced', bearer: B, ...rails('INTENTS', 'CONFIDENTIAL_INTENTS', 'INTENTS') },
    { name: 'ORIGIN dep → INTENTS out wNEAR→USDT public', origin: w, dest: usdt, amount: '1000000', conf: 'public', ...rails('ORIGIN_CHAIN', 'INTENTS', 'ORIGIN_CHAIN') },
    { name: 'INTENTS dep → DEST out wNEAR→USDT public', origin: w, dest: usdt, amount: '1000000', conf: 'public', ...rails('INTENTS', 'DESTINATION_CHAIN', 'INTENTS') },
  ];
  for (const v of variants) {
    const r = await call('/v0/quote', { method: 'POST', body: {
      dry: true, swapType: v.type || 'EXACT_OUTPUT', slippageTolerance: 100, originAsset: v.origin, depositType: v.dt || 'ORIGIN_CHAIN',
      destinationAsset: v.dest, amount: v.amount || '2000000', recipient: v.recipient, recipientType: v.rt || 'DESTINATION_CHAIN',
      refundTo: v.refund || key.implicitAccount, refundType: v.ft || 'ORIGIN_CHAIN', deadline, quoteWaitingTimeMs: 3000, confidentiality: v.conf,
    }, extraHeaders: v.headers, bearer: v.bearer }).catch(e => ({ status: 0, ok: false, text: e.message }));
    const q = r.json && r.json.quote;
    out.cases.push({ name: v.name, http: r.status, ok: r.ok, amountIn: q && q.amountInFormatted, amountOut: q && q.amountOutFormatted, timeEstimate: q && q.timeEstimate, depositAddress: q && q.depositAddress ? 'yes' : undefined,
      message: r.ok ? '' : (r.json && (r.json.message || r.json.error)) || r.text });
  }
  // v9: the real flow end to end, minus the signature submit (a throwaway account has no funds)
  out.flow = [];
  out.lastUnexpectedIntent = lastIntent;
  // a named account as signer (public quote, so no user session is needed): what does generate-intent return?
  try {
    const req = buildQuote({ action: 'send', amount: '0.2', token: 'NEAR', to: R(), from: 'mcloven1.tg', source: 'intents' }, { prices: await prices(), confidentiality: 'public' });
    const r = await call('/v0/quote', { method: 'POST', body: req });
    const dep = r.json && r.json.quote && r.json.quote.depositAddress;
    const g = dep ? await call('/v0/generate-intent', { method: 'POST', body: { type: 'swap_transfer', standard: 'nep413', signerId: 'mcloven1.tg', depositAddress: dep } }) : null;
    out.named = { quote: r.status, gen: g && g.status, body: g && (g.json || g.text), err: !r.ok ? r.json : undefined };
  } catch (e) { out.named = { error: e.message }; }
  for (const [source, token] of [['private', 'NEAR'], ['intents', 'NEAR'], ['intents', 'USDT']]) {
    try {
      const req = buildQuote({ action: 'send', amount: token === 'NEAR' ? '0.2' : '1', token, payWith: 'NEAR', to: R(), from: me, source }, { prices: await prices() });
      req.dry = false;
      const r = await call('/v0/quote', { method: 'POST', body: req, bearer: B });
      const dep = r.json && r.json.quote && r.json.quote.depositAddress;
      const g = dep ? await call('/v0/generate-intent', { method: 'POST', body: { type: 'swap_transfer', standard: 'nep413', signerId: me, depositAddress: dep } }) : null;
      out.flow.push({ source, token, quoteAmounts: r.json && r.json.quote && { amountIn: r.json.quote.amountIn, minAmountIn: r.json.quote.minAmountIn, maxAmountIn: r.json.quote.maxAmountIn }, quote: r.status, depositAddress: dep, gen: g && g.status, intent: g && g.json && g.json.intent && g.json.intent.payload && g.json.intent.payload.message, err: (!r.ok && r.json && r.json.message) || (g && !g.ok && g.json && g.json.message) || undefined });
    } catch (e) { out.flow.push({ source, error: e.message }); }
  }
  const bal = await call('/v0/account/balances', { bearer: B, noPartner: true }).catch(e => ({ status: 0, text: e.message }));
  out.privateBalances = { http: bal.status, body: bal.json || bal.text };
  return out;
}


// ---------------------------------------------------------------- real payments (quote → wallet → status)
// What the assistant can do with money, on purpose small: send or swap USDC/NEAR, at most MAX_USD per action.
const MAX_USD = Number(process.env.PAY_MAX_USD || 50);
const ASSETS = {
  'USDC@near': { assetId: 'nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1', decimals: 6, symbol: 'USDC', chain: 'near', usd: 1 },
  'NEAR@near': { assetId: 'nep141:wrap.near', decimals: 24, symbol: 'NEAR', chain: 'near', native: true },
  'USDT@near': { assetId: 'nep141:usdt.tether-token.near', decimals: 6, symbol: 'USDT', chain: 'near', usd: 1 },
  'USDC@base': { assetId: 'nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near', decimals: 6, symbol: 'USDC', chain: 'base', usd: 1 },
};
const NEAR_ACCOUNT = /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/;
const isNearAccount = a => typeof a === 'string' && a.length >= 2 && a.length <= 64 && NEAR_ACCOUNT.test(a);
// Speech-to-text often hears ".near" as ".nir", ".neer", " dot near"… Fix only the suffix, never the name itself.
function normalizeRecipient(a) {
  let x = String(a || '').trim().toLowerCase().replace(/\s+dot\s+/g, '.').replace(/\s+/g, '');
  x = x.replace(/\.(nir|neer|nier|nea|ner|nearr|neаr)$/, '.near').replace(/(^|[^.])near$/, (m, c) => (x.length > 4 && !x.includes('.') ? c + '.near' : m));
  return x;
}
// A named recipient must exist on chain (an implicit 64-hex account exists once it receives funds)
async function recipientExists(a) {
  if (/^[0-9a-f]{64}$/.test(a)) return true;
  const acc = await near.viewAccount(a).catch(e => (/does not exist|UNKNOWN_ACCOUNT/i.test(String(e && e.message)) ? null : undefined));
  if (acc === undefined) throw new Error('could not check the recipient account, try again');
  return !!acc;
}
const isEvmAddress = a => typeof a === 'string' && /^0x[0-9a-fA-F]{40}$/.test(a);
// ---- other chains, through NEAR Intents (assets are looked up in /v0/tokens, never hard-coded)
const CHAINS = {
  bsc: { name: 'BNB Chain', native: 'BNB', addr: isEvmAddress }, eth: { name: 'Ethereum', native: 'ETH', addr: isEvmAddress },
  arb: { name: 'Arbitrum', native: 'ETH', addr: isEvmAddress }, base: { name: 'Base', native: 'ETH', addr: isEvmAddress },
  pol: { name: 'Polygon', native: 'POL', addr: isEvmAddress }, sol: { name: 'Solana', native: 'SOL', addr: a => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(String(a)) },
  tron: { name: 'Tron', native: 'TRX', addr: a => /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(String(a)) },
};
const CHAIN_SYMBOLS = ['USDT', 'USDC'];
const validAddress = (chain, a) => chain === 'near' ? isNearAccount(a) : !!(CHAINS[chain] && CHAINS[chain].addr(a));
// fill ASSETS with "USDT@bsc", "USDC@sol", "BNB@bsc"… from the live token list
async function ensureChainAssets() {
  const list = await tokens();
  for (const [chain, c] of Object.entries(CHAINS)) for (const sym of [...CHAIN_SYMBOLS, c.native]) {
    const k = `${sym}@${chain}`; if (ASSETS[k]) continue;
    const t = list.find(x => String(x.blockchain).toLowerCase() === chain && String(x.symbol).toUpperCase() === sym);
    if (t) ASSETS[k] = { assetId: t.assetId, decimals: t.decimals, symbol: sym, chain, ...(CHAIN_SYMBOLS.includes(sym) ? { usd: 1 } : { price: Number(t.price) }) };
  }
  return ASSETS;
}
const chainList = () => Object.entries(CHAINS).map(([id, c]) => { const tk = [...CHAIN_SYMBOLS, c.native].filter(s => ASSETS[`${s}@${id}`]); return { id, name: c.name, tokens: tk, prices: Object.fromEntries(tk.map(s => [s, ASSETS[`${s}@${id}`].usd ?? ASSETS[`${s}@${id}`].price])) }; }).filter(c => c.tokens.length);

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
const RAIL = { private: 'CONFIDENTIAL_INTENTS', intents: 'INTENTS' };
function buildQuote({ action, amount, token, toToken, toChain, to, from, payWith, source = 'intents', toRail = 'private' }, { prices = {}, now = Date.now(), confidentiality = 'advanced' } = {}) {
  if (!RAIL[source] || !RAIL[toRail]) throw new Error('bad rail');
  if (!['send', 'swap'].includes(action)) throw new Error('action must be send or swap');
  if (!isNearAccount(from)) throw new Error('connect a NEAR wallet first');
  // send: the recipient gets `token`; the sender may pay with another token (`payWith`) — NEAR Intents swaps it on the way
  const origin = ASSETS[assetKey(action === 'send' ? (payWith || token) : token, 'near')];
  if (!origin) throw new Error('unsupported token');
  const destKey = action === 'send' ? assetKey(toToken || token, toChain || 'near') : assetKey(toToken, 'near');
  const dest = ASSETS[destKey];
  if (!dest) throw new Error('unsupported destination');
  if (action === 'swap' && dest.assetId === origin.assetId) throw new Error('swap needs two different tokens');
  if (action === 'send' && toChain && toChain !== 'near' && payWith && payWith !== token) { /* cross-chain + cross-asset is fine for 1Click */ }
  let recipient;
  if (action === 'swap') recipient = from;
  else if (dest.chain === 'near') { if (!isNearAccount(to)) throw new Error('bad NEAR recipient'); recipient = to; }
  else { if (!validAddress(dest.chain, to)) throw new Error(`bad ${CHAINS[dest.chain] ? CHAINS[dest.chain].name : dest.chain} address`); recipient = to; }
  const sized = action === 'send' ? dest : origin;
  const units = toUnits(amount, sized.decimals);
  const usd = (sized.usd ?? sized.price ?? prices[sized.symbol]) ;
  if (usd == null) throw new Error('price unknown, try again');
  if (Number(amount) * usd > MAX_USD) throw new Error(`demo limit: at most $${MAX_USD} per action`);
  return {
    dry: false,
    swapType: action === 'send' ? 'EXACT_OUTPUT' : 'EXACT_INPUT',
    slippageTolerance: 100,
    // paid from the payer's balance inside NEAR Intents; refunds go back there; NEAR payouts land on the
    // recipient's private (Confidential Intents) balance, other chains are paid out on that chain
    originAsset: origin.assetId, depositType: RAIL[source],
    destinationAsset: dest.assetId, amount: units.toString(),
    recipient, recipientType: dest.chain === 'near' ? RAIL[toRail] : 'DESTINATION_CHAIN',
    refundTo: from, refundType: RAIL[source],
    deadline: new Date(now + 15 * 60e3).toISOString(),
    quoteWaitingTimeMs: 3000, confidentiality, referral: 'sirnear',
  };
}

// What an account can pay with: native NEAR (minus a reserve for storage and gas), USDC, USDT
const balCache = new Map();
async function balances(account) {
  if (!isNearAccount(account)) throw new Error('bad account');
  const c = balCache.get(account); if (c && Date.now() - c.at < 10e3) return c.v;
  const near = require('./near');
  const ft = s => near.viewCall(ASSETS[s + '@near'].assetId.replace(/^nep141:/, ''), 'ft_balance_of', { account_id: account }).then(String).catch(() => '0');
  const [acc, usdc, usdt, wnear] = await Promise.all([near.viewAccount(account).catch(() => null), ft('USDC'), ft('USDT'), near.viewCall('wrap.near', 'ft_balance_of', { account_id: account }).then(String).catch(() => '0')]);
  let free = 0n;
  if (acc) { free = BigInt(acc.amount) - BigInt(acc.storage_usage || 0) * 10n ** 19n - 5n * 10n ** 22n; if (free < 0n) free = 0n; }
  // NEAR you can pay with = spendable native NEAR + already-wrapped wNEAR
  const v = { NEAR: (free + BigInt(wnear || '0')).toString(), nativeNEAR: free.toString(), wNEAR: wnear, USDC: usdc, USDT: usdt, exists: !!acc,
    intents: await intentsBalances(account).catch(() => ({ NEAR: '0', USDT: '0' })), intentsKeys: await intentsKeys(account).catch(() => []) };
  balCache.set(account, { at: Date.now(), v }); if (balCache.size > 500) balCache.clear();
  return v;
}

// Public balance inside the NEAR Intents ledger (intents.near) and the keys allowed to sign intents for the account
async function intentsBalances(account) {
  const [n, t] = await near.viewCall('intents.near', 'mt_batch_balance_of', { account_id: account, token_ids: [ASSETS['NEAR@near'].assetId, ASSETS['USDT@near'].assetId] });
  return { NEAR: String(n || '0'), USDT: String(t || '0') };
}
async function intentsKeys(account) { const k = await near.viewCall('intents.near', 'public_keys_of', { account_id: account }); return Array.isArray(k) ? k : []; }
// Private (Confidential Intents) balance — readable only with the account's own session token
async function privateBalances(token) {
  const r = await call('/v0/account/balances', { bearer: token, noPartner: true });
  if (!r.ok || !r.json) throw new Error(r.status === 401 ? 'session_expired' : `balances: HTTP ${r.status}`);
  // private token ids look like "imt:<shard>:nep141:wrap.near"
  const get = id => (r.json.balances || []).filter(b => String(b.tokenId) === id || String(b.tokenId).endsWith(':' + id)).reduce((a, b) => a + BigInt(String(b.available || '0')), 0n).toString();
  return { NEAR: get(ASSETS['NEAR@near'].assetId), USDT: get(ASSETS['USDT@near'].assetId) };
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

const DEP = /^[A-Za-z0-9._:-]{8,128}$/;
// quote + the intent the payer's key must sign (generated by 1Click for exactly this quote)
async function quote(input, { userToken } = {}) {
  if (input.toChain && input.toChain !== 'near') await ensureChainAssets();
  const req = buildQuote(input, { prices: await prices().catch(() => ({})) });
  if (req.recipientType !== 'DESTINATION_CHAIN' && !(await recipientExists(req.recipient))) throw new Error(`account ${req.recipient} does not exist`);
  const r = await call('/v0/quote', { method: 'POST', body: req, bearer: userToken });
  if (!r.ok || !r.json || !r.json.quote || !r.json.quote.depositAddress) {
    const m = (r.json && (r.json.message || r.json.error)) || `quote failed (HTTP ${r.status})`;
    if (r.status === 401) throw new Error('session_expired');
    throw new Error(m);
  }
  const pub = publicQuote(req, r.json);
  const g = await call('/v0/generate-intent', { method: 'POST', body: { type: 'swap_transfer', standard: 'nep413', signerId: req.refundTo, depositAddress: pub.depositAddress } });
  const intent = g.json && g.json.intent;
  if (!g.ok || !intent || !intent.payload) throw new Error((g.json && (g.json.message || g.json.error)) || `generate-intent failed (HTTP ${g.status})`);
  // public rail → intents.near; the private (Confidential Intents) rail signs for its own verifier contract.
  // Only a recipient 1Click itself issued for a quote is accepted later in signedFromWallet.
  if (!isNearAccount(intent.payload.recipient)) { lastIntent = JSON.stringify(intent).slice(0, 1500); throw new Error('unexpected intent (recipient)'); }
  issuedRecipients.add(intent.payload.recipient);
  // the payer is about to sign this: check it spends only what the card shows
  checkIntent(intent.payload.message, { signer: req.refundTo, depositAddress: pub.depositAddress, asset: req.originAsset, maxAmount: pub.amountIn });
  return { ...pub, source: input.source || 'intents', intent };
}
// What the payer signs must be exactly one transfer of the origin token, at most the quoted amount, to this quote's deposit address
let lastIntent = null;
function checkIntent(message, { signer, depositAddress, asset, maxAmount }) {
  let m; try { m = JSON.parse(message); } catch { lastIntent = 'unparsable: ' + String(message).slice(0, 300); throw new Error('unexpected intent'); }
  const its = m.intents || [];
  const ok = m.signer_id === signer && its.length === 1 && its[0].intent === 'transfer' && its[0].receiver_id === depositAddress
    && Object.entries(its[0].tokens || {}).length === 1
    && Object.entries(its[0].tokens).every(([id, amt]) => (id === asset || id.endsWith(':' + asset)) && BigInt(String(amt)) > 0n && BigInt(String(amt)) <= BigInt(String(maxAmount)));
  if (!ok) { console.warn('[pay] unexpected intent:', message.slice(0, 600)); lastIntent = JSON.stringify({ message: message.slice(0, 1200), signer, depositAddress, asset, maxAmount }); throw new Error('unexpected intent'); }
  return true;
}
// Deposit from another chain: the user sends `amount` of `symbol` on `chain` to a one-time address; NEAR Intents
// delivers USDT/NEAR to `to`'s PRIVATE (Confidential Intents) balance; needs a NEAR Intents session of the recipient.
async function crossDeposit({ chain, symbol, amount, to, refundTo, destToken = 'USDT' }, { bearer } = {}) {
  await ensureChainAssets();
  const origin = ASSETS[`${String(symbol).toUpperCase()}@${chain}`]; if (!origin) throw new Error('unsupported token on that chain');
  const dest = ASSETS[`${destToken === 'NEAR' ? 'NEAR' : 'USDT'}@near`];
  if (!isNearAccount(to)) throw new Error('bad NEAR recipient');
  if (!validAddress(chain, refundTo)) throw new Error(`your ${CHAINS[chain].name} address for refunds is not valid`);
  const units = toUnits(amount, origin.decimals);
  const usd = Number(amount) * (origin.usd ?? origin.price ?? NaN);
  if (!(usd > 0)) throw new Error('price unknown, try again'); if (usd > MAX_USD) throw new Error(`demo limit: at most $${MAX_USD} per top-up (${amount} ${origin.symbol} ≈ $${usd.toFixed(0)})`);
  const base = { dry: false, swapType: 'EXACT_INPUT', slippageTolerance: 100, originAsset: origin.assetId, depositType: 'ORIGIN_CHAIN', destinationAsset: dest.assetId,
    amount: units.toString(), refundTo, refundType: 'ORIGIN_CHAIN', recipient: to, deadline: new Date(Date.now() + 30 * 60e3).toISOString(), quoteWaitingTimeMs: 3000, referral: 'sirnear' };
  // confidential only: without a session of the recipient there is no quote (never a silent public fallback)
  if (!bearer) throw new Error('a NEAR Intents session of the recipient is needed for a private deposit');
  const r = await call('/v0/quote', { method: 'POST', body: { ...base, recipientType: 'CONFIDENTIAL_INTENTS', confidentiality: 'advanced' }, bearer });
  const q = r.json && r.json.quote;
  if (!r.ok || !q || !q.depositAddress) throw new Error((r.json && (r.json.message || r.json.error)) || `HTTP ${r.status}`);
  return { depositAddress: q.depositAddress, depositMemo: q.depositMemo, amountIn: q.amountInFormatted, amountOut: q.amountOutFormatted, destToken: dest.symbol, chain, chainName: CHAINS[chain].name, symbol: origin.symbol, deadline: q.deadline || base.deadline, timeEstimate: q.timeEstimate, private: true };
}
async function submitIntent(signedData) {
  const r = await call('/v0/submit-intent', { method: 'POST', body: { type: 'swap_transfer', signedData } });
  if (!r.ok || !r.json) throw new Error((r.json && (r.json.message || r.json.error)) || `submit-intent failed (HTTP ${r.status})`);
  return { intentHash: r.json.intentHash };
}
async function submit({ depositAddress, txHash, nearSenderAccount }) {
  if (!DEP.test(String(depositAddress)) || !/^[1-9A-HJ-NP-Za-km-z]{40,50}$/.test(String(txHash)) || !isNearAccount(nearSenderAccount)) throw new Error('bad submit');
  const r = await call('/v0/deposit/submit', { method: 'POST', body: { depositAddress, txHash, nearSenderAccount } });
  return { ok: r.ok, http: r.status };
}
// Confidential quotes are readable only with a session of the payer (or of the agent that paid)
async function status(depositAddress, { bearer } = {}) {
  if (!DEP.test(String(depositAddress))) throw new Error('bad deposit address');
  let r = await call('/v0/status?depositAddress=' + encodeURIComponent(depositAddress), { bearer });
  if (!r.ok && bearer) r = await call('/v0/status?depositAddress=' + encodeURIComponent(depositAddress), { bearer, noPartner: true });
  if (!r.ok || !r.json) throw new Error(`status failed (HTTP ${r.status}${r.json && r.json.message ? ': ' + r.json.message : ''})`);
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
async function checkPaid(depositAddress, { recipient, priceUnits, assetId, bearer }) {
  const s = await status(depositAddress, { bearer });
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

module.exports = { probeCross, CHAINS, validAddress, ensureChainAssets, chainList, crossDeposit, normalizeRecipient, recipientExists, issuedRecipients, knownRecipient, checkIntent, RAIL, authChallenge, authWith, signedFromWallet, intentsBalances, intentsKeys, privateBalances, submitIntent, balances, call, tokens, findToken, probe, authenticate, intentsSalt, ASSETS, MAX_USD, toUnits, isNearAccount, isEvmAddress, buildQuote, publicQuote, quote, submit, status, checkPaid, consumeDeposit };
