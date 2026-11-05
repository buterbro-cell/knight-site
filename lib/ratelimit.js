// Abuse protection that stores no identities: visitors are keyed by a salted HMAC of their IP address
// (salt is random per process start, so hashes cannot be linked across restarts), plus timestamps.
// Separate budgets per action (chat, stt, tts, verify) and one global daily cap for questions.
// Pure logic with an injectable clock — unit-tested in test/ratelimit.test.js.
'use strict';
const crypto = require('crypto');

function createLimiter({ budget, defaultLimit, windowMin, dailyLimit, now = () => Date.now() }) {
  const salt = crypto.randomBytes(16);
  const hash = id => crypto.createHmac('sha256', salt).update(String(id)).digest('base64url').slice(0, 16);
  const hits = new Map();
  let day = new Date(now()).toISOString().slice(0, 10), dayCount = 0;
  // returns null when allowed, 'daily' when the global question cap is reached, 'user' when this visitor's budget is used up
  function allow(id, kind = 'chat') {
    const today = new Date(now()).toISOString().slice(0, 10);
    if (today !== day) { day = today; dayCount = 0; }
    if (kind === 'chat' && dayCount >= dailyLimit) return 'daily';
    const h = kind + ':' + hash(id);
    const cut = now() - windowMin * 60e3;
    const arr = (hits.get(h) || []).filter(t => t > cut);
    if (arr.length >= (budget[kind] || defaultLimit)) return 'user';
    arr.push(now()); hits.set(h, arr); if (kind === 'chat') dayCount++;
    return null;
  }
  function sweep() {
    const cut = now() - windowMin * 60e3;
    for (const [h, arr] of hits) { const a = arr.filter(t => t > cut); a.length ? hits.set(h, a) : hits.delete(h); }
  }
  // what is held in memory: only opaque keys and timestamps (exposed for tests)
  const snapshot = () => [...hits.entries()];
  return { allow, sweep, snapshot, todayCount: () => dayCount };
}
module.exports = { createLimiter };
