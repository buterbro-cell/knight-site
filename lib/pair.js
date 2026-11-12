// TV pairing: a TV (or any screen without a wallet) shows a QR code; the owner opens it on the phone, signs the usual
// 24-hour agent permission there, and the phone hands that session token to the TV. Kept in memory only, single use,
// 10 minutes. The code is 32 random bytes known only to the TV that asked for it, so nobody else can take the token.
const crypto = require('crypto');
const TTL = 10 * 60e3, MAX = 500;
const pending = new Map();   // code → { check, at, session? }
function sweep(now = Date.now()) { for (const [k, v] of pending) if (now - v.at > TTL) pending.delete(k); }
function create() {
  sweep(); if (pending.size >= MAX) throw new Error('busy');
  const code = crypto.randomBytes(32).toString('base64url');
  const check = String(crypto.randomInt(0, 10000)).padStart(4, '0');   // shown on both screens, so a swapped QR is noticed
  pending.set(code, { check, at: Date.now() });
  return { code, check, ttl: TTL };
}
function peek(code) { sweep(); const p = pending.get(String(code || '')); if (!p) throw new Error('expired'); return { check: p.check, given: !!p.session }; }
// token: an agent session token already checked by the caller; owner from it
function give(code, token, owner) {
  sweep(); const p = pending.get(String(code || '')); if (!p) throw new Error('expired');
  if (p.session) throw new Error('used');
  const exp = Number(String(token).split('|')[1]);
  p.session = { token, owner, expiresAt: exp };
  return { ok: true };
}
function take(code) {
  sweep(); const k = String(code || ''), p = pending.get(k); if (!p) throw new Error('expired');
  if (!p.session) return { waiting: true };
  pending.delete(k); return p.session;
}
module.exports = { create, peek, give, take, _pending: pending };
