const test = require('node:test');
const assert = require('node:assert');
const pair = require('../lib/pair');

test('pairing: the TV gets the session once, only with its own code', () => {
  const { code, check } = pair.create();
  assert.match(check, /^\d{4}$/);
  assert.deepStrictEqual(pair.take(code), { waiting: true });
  assert.throws(() => pair.take('someone-else'), /expired/);
  pair.give(code, 'anna.near|' + (Date.now() + 3600e3) + '|mac', 'anna.near');
  assert.throws(() => pair.give(code, 'x|1|y', 'x'), /used/);
  const s = pair.take(code);
  assert.strictEqual(s.owner, 'anna.near');
  assert.ok(s.expiresAt > Date.now());
  assert.throws(() => pair.take(code), /expired/);   // single use
});

test('pairing codes expire', () => {
  const { code } = pair.create();
  pair._pending.get(code).at -= 11 * 60e3;
  assert.throws(() => pair.peek(code), /expired/);
});
