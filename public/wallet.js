// Wallet + private payments in the browser. Loaded only when the visitor wants to pay (dynamic import from app.js).
// The visitor's wallet (HOT, Meteor, … via NEAR Connect) signs every transaction itself — this page never sees keys.
// Flow: server asks NEAR Intents for a confidential quote → wallet sends the tokens to the one-time deposit address
//       → we tell 1Click the tx hash → poll status until the payout is done.
import { NearConnector } from './vendor/near-connect/hot-connect.es.js';

let connector = null, account = null;
const listeners = new Set();
const emit = () => listeners.forEach(f => { try { f(account); } catch (e) {} });

function conn() {
  if (!connector) {
    connector = new NearConnector({ network: 'mainnet' });   // no feature filter: injected wallets (HOT extension) may not declare every feature
    connector.on('wallet:signIn', e => { account = (e.accounts && e.accounts[0] && e.accounts[0].accountId) || account; emit(); });
    connector.on('wallet:signOut', () => { account = null; emit(); });
  }
  return connector;
}

export async function restore() {
  try { const w = await conn().wallet(); const a = await w.getAccounts(); account = (a[0] && a[0].accountId) || null; } catch (e) { account = null; }
  emit(); return account;
}
export async function connect() {
  await conn().connect();
  if (!account) await restore();
  return account;
}
export async function disconnect() { try { await conn().disconnect(); } catch (e) {} account = null; emit(); }
export const getAccount = () => account;
export const onChange = f => { listeners.add(f); return () => listeners.delete(f); };

const TGAS30 = '30000000000000';
const STORAGE = '1250000000000000000000';   // 0.00125 NEAR: register an account on a token contract (refunded if already registered)

// The transaction the wallet will show and sign: tokens go to the quote's one-time deposit address
export function depositActions(q, from, wnear = '0') {
  const fc = (methodName, args, deposit) => ({ type: 'FunctionCall', params: { methodName, args, gas: TGAS30, deposit } });
  const actions = [];
  if (q.origin.native) {   // NEAR: use wNEAR already held, wrap only the rest
    let need = BigInt(q.amountIn) - BigInt(wnear || '0');
    actions.push(fc('storage_deposit', { account_id: from, registration_only: true }, STORAGE));
    if (need > 0n) actions.push(fc('near_deposit', {}, need.toString()));
  }
  actions.push(fc('storage_deposit', { account_id: q.depositAddress, registration_only: true }, STORAGE));
  actions.push(fc('ft_transfer', { receiver_id: q.depositAddress, amount: q.amountIn }, '1'));
  return { receiverId: q.origin.contract, actions };
}

export async function payQuote(q, wnear = '0') {
  if (!account) throw new Error('wallet not connected');
  const w = await conn().wallet();
  const tx = depositActions(q, account, wnear);
  const out = await w.signAndSendTransaction({ signerId: account, receiverId: tx.receiverId, actions: tx.actions, network: 'mainnet' });
  const hash = out && ((out.transaction && out.transaction.hash) || (out.transaction_outcome && out.transaction_outcome.id));
  if (hash) fetch('api/pay/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ depositAddress: q.depositAddress, txHash: hash, nearSenderAccount: account }) }).catch(() => {});
  return hash || null;
}

export async function waitDone(depositAddress, onStatus, { timeoutMs = 5 * 60e3 } = {}) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    let s = null;
    try { s = await (await fetch('api/pay/status?depositAddress=' + encodeURIComponent(depositAddress), { cache: 'no-store' })).json(); } catch (e) {}
    if (s && s.status) { onStatus && onStatus(s); if (['SUCCESS', 'REFUNDED', 'FAILED', 'INCOMPLETE_DEPOSIT'].includes(s.status)) return s; }
    await new Promise(r => setTimeout(r, 3000));
  }
  return { status: 'TIMEOUT' };
}

export async function getQuote(body) {
  const r = await fetch('api/pay/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.message || j.error || ('HTTP ' + r.status));
  return j;
}

// ---------------- Full mode: the agent wallet whose key lives only in the server's TEE ----------------
let session = null;   // { token, owner, expiresAt } — this tab only
export async function agentSession() {
  if (session && session.owner === account && Date.now() < session.expiresAt - 60e3) return session.token;
  const w = await conn().wallet();
  const message = `Sir Near: let my agent wallet act for ${account} for 30 minutes, within its limits. ${Date.now()}`;
  const nonce = crypto.getRandomValues(new Uint8Array(32));
  const s = await w.signMessage({ message, recipient: 'sir-near', nonce, network: 'mainnet' });
  const b64 = btoa(String.fromCharCode(...nonce));
  const r = await fetch('api/agent/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountId: s.accountId || account, publicKey: s.publicKey, signature: s.signature, message, nonce: b64 }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.message || j.error || ('HTTP ' + r.status));
  session = j; return j.token;
}
export async function agentInfo() {
  const r = await fetch('api/agent/info?owner=' + encodeURIComponent(account), { cache: 'no-store' });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.message || j.error); return j;
}
async function agentPost(path, body) {
  const token = await agentSession();
  const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, ...body }) });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.message || j.error || ('HTTP ' + r.status)); return j;
}
export const agentPay = proposal => agentPost('api/agent/pay', { proposal });
export const agentWithdraw = () => agentPost('api/agent/withdraw', {});
// Gas for the agent wallet: a plain NEAR transfer (also creates the implicit account). Tokens go through NEAR Intents.
export async function sendGas(agentAccount, nearYocto) {
  const w = await conn().wallet();
  const out = await w.signAndSendTransaction({ signerId: account, receiverId: agentAccount, actions: [{ type: 'Transfer', params: { deposit: nearYocto } }], network: 'mainnet' });
  return out && ((out.transaction && out.transaction.hash) || (out.transaction_outcome && out.transaction_outcome.id));
}
