// Wallet + private payments in the browser. Loaded only when the visitor wants to pay (dynamic import from app.js).
// The visitor's wallet (HOT, Meteor, … via NEAR Connect) signs every transaction itself — this page never sees keys.
// Flow (the Intents rail, like near.com): money sits on the visitor's own balance inside NEAR Intents.
//   once: a session with NEAR Intents (sign an empty intent); top up the Intents balance from the wallet if short
//   each payment: quote → the wallet signs the exact intent 1Click generated (no gas) → poll status.
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

const TGAS100 = '100000000000000';
const b64ToBytes = b => Uint8Array.from(atob(b), c => c.charCodeAt(0));
const bytesToB64 = u => btoa(String.fromCharCode(...u));
async function wallet() { return conn().wallet(); }
async function signRaw({ message, recipient, nonce }) {
  const w = await wallet();
  const s = await w.signMessage({ message, recipient, nonce: b64ToBytes(nonce), network: 'mainnet' });
  if (!s || !s.signature) throw new Error('the wallet did not sign');
  let pk = String(s.publicKey || ''); if (pk && !pk.startsWith('ed25519:')) pk = 'ed25519:' + pk;
  return { message, recipient, nonce, publicKey: pk, signature: s.signature };
}
const post = async (path, body, headers = {}) => {
  const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({})); if (!r.ok) { const e = new Error(j.message || j.error || ('HTTP ' + r.status)); e.code = j.error; e.status = r.status; throw e; } return j;
};

// ---- session with NEAR Intents (this tab only)
let intents = null;   // { account, token, publicKey, at }
export const sessionKey = () => intents && intents.account === account ? intents.publicKey : null;
export async function intentsSession({ fresh = false } = {}) {
  if (!fresh && intents && intents.account === account && Date.now() - intents.at < 15 * 60e3) return intents.token;
  const c = await (await fetch('api/pay/auth-challenge?account=' + encodeURIComponent(account), { cache: 'no-store' })).json();
  if (!c.message) throw new Error(c.error || 'no challenge');
  const signed = await signRaw(c);
  const j = await post('api/pay/auth', signed).catch(e => { e.publicKey = signed.publicKey; throw e; });
  intents = { account, token: j.token, publicKey: signed.publicKey, at: Date.now() };
  return j.token;
}
const H = () => (intents && intents.account === account ? { 'X-Intents-Session': intents.token } : {});
export async function privateBalances() {
  const r = await fetch('api/pay/private', { headers: H(), cache: 'no-store' });
  return r.ok ? r.json() : { NEAR: '0', USDT: '0' };
}
// A named account must register its wallet key with intents.near once before it can sign intents
export async function registerKey(publicKey) {
  const w = await wallet();
  return w.signAndSendTransaction({ signerId: account, receiverId: 'intents.near', network: 'mainnet',
    actions: [{ type: 'FunctionCall', params: { methodName: 'add_public_key', args: { public_key: publicKey }, gas: TGAS100, deposit: '1' } }] });
}

// Top up the Intents balance from the wallet: NEAR is wrapped first (only the missing part), then ft_transfer_call
export function depositActions(token, amount, wnear = '0') {
  const fc = (methodName, args, deposit, gas = '30000000000000') => ({ type: 'FunctionCall', params: { methodName, args, gas, deposit } });
  const actions = [];
  if (token === 'NEAR') {
    const need = BigInt(amount) - BigInt(wnear || '0');
    if (need > 0n) actions.push(fc('near_deposit', {}, need.toString()));
  }
  actions.push(fc('ft_transfer_call', { receiver_id: 'intents.near', amount: String(amount), msg: '' }, '1', TGAS100));
  return { receiverId: token === 'NEAR' ? 'wrap.near' : 'usdt.tether-token.near', actions };
}
export async function depositToIntents(token, amount, wnear = '0') {
  const w = await wallet();
  const tx = depositActions(token, amount, wnear);
  const out = await w.signAndSendTransaction({ signerId: account, receiverId: tx.receiverId, actions: tx.actions, network: 'mainnet' });
  return out && ((out.transaction && out.transaction.hash) || (out.transaction_outcome && out.transaction_outcome.id));
}
// Intents balance → back to the wallet (public withdrawal, the visitor's own money)
export async function withdrawFromIntents(token, amount) {
  const w = await wallet();
  return w.signAndSendTransaction({ signerId: account, receiverId: 'intents.near', network: 'mainnet',
    actions: [{ type: 'FunctionCall', params: { methodName: 'ft_withdraw', args: { token: token === 'NEAR' ? 'wrap.near' : 'usdt.tether-token.near', receiver_id: account, amount: String(amount) }, gas: TGAS100, deposit: '1' } }] });
}

// The payment itself: sign the exact intent generated for this quote (checked by the server) and submit it
export async function payQuote(q) {
  if (!account) throw new Error('wallet not connected');
  const signed = await signRaw(q.intent.payload);
  return post('api/pay/submit-intent', signed);
}

export const sessionToken = () => (intents && intents.account === account ? intents.token : null);
// agent: true → the agent's own session reads the status (it paid); otherwise this tab's NEAR Intents session
export async function waitDone(depositAddress, onStatus, { timeoutMs = 5 * 60e3, agent = false } = {}) {
  const t0 = Date.now();
  const url = agent ? 'api/agent/status?owner=' + encodeURIComponent(account) + '&depositAddress=' + encodeURIComponent(depositAddress) : 'api/pay/status?depositAddress=' + encodeURIComponent(depositAddress);
  while (Date.now() - t0 < timeoutMs) {
    let s = null;
    try { s = await (await fetch(url, { cache: 'no-store', headers: agent ? {} : H() })).json(); } catch (e) {}
    if (s && !s.status && s.error) onStatus && onStatus({ status: 'ERROR', error: s.error });
    if (s && s.status) { onStatus && onStatus(s); if (['SUCCESS', 'REFUNDED', 'FAILED', 'INCOMPLETE_DEPOSIT'].includes(s.status)) return s; }
    await new Promise(r => setTimeout(r, 3000));
  }
  return { status: 'TIMEOUT' };
}

export async function getQuote(body) {
  try { return await post('api/pay/quote', body, H()); }
  catch (e) { if (e.status === 401) { await intentsSession({ fresh: true }); return post('api/pay/quote', body, H()); } throw e; }
}

// ---------------- Full mode: the agent wallet whose key lives only in the server's TEE ----------------
// { token, owner, expiresAt } — kept on this device for 24 hours so voice payments need no wallet popup
let session = null;
try { session = JSON.parse(localStorage.getItem('sirnear.agentSession') || 'null'); } catch (e) {}
export async function agentSession() {
  if (session && session.owner === account && Date.now() < session.expiresAt - 60e3) return session.token;
  const w = await conn().wallet();
  const message = `Sir Near: let my agent wallet act for ${account} for 24 hours, within its limits. ${Date.now()}`;
  const nonce = crypto.getRandomValues(new Uint8Array(32));
  const s = await w.signMessage({ message, recipient: 'sir-near', nonce, network: 'mainnet' });
  const b64 = btoa(String.fromCharCode(...nonce));
  const r = await fetch('api/agent/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountId: s.accountId || account, publicKey: s.publicKey, signature: s.signature, message, nonce: b64 }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.message || j.error || ('HTTP ' + r.status));
  session = j; try { localStorage.setItem('sirnear.agentSession', JSON.stringify(j)); } catch (e) {}
  return j.token;
}
export async function agentInfo() {
  const r = await fetch('api/agent/info?owner=' + encodeURIComponent(account), { cache: 'no-store' });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.message || j.error); return j;
}
async function agentPost(path, body, retry = true) {
  const token = await agentSession();
  const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, ...body }) });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && retry) { session = null; try { localStorage.removeItem('sirnear.agentSession'); } catch (e) {} return agentPost(path, body, false); }
  if (!r.ok) throw new Error(j.message || j.error || ('HTTP ' + r.status)); return j;
}
export const agentPay = proposal => agentPost('api/agent/pay', { proposal });
// Withdraw needs no signature: the money can only go back to the owner
export async function agentWithdraw() {
  const r = await fetch('api/agent/withdraw', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ owner: account }) });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.message || j.error || ('HTTP ' + r.status)); return j;
}
