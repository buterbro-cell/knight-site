'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createLimiter } = require('../lib/ratelimit');

function make(over = {}) {
  let t = Date.parse('2026-11-10T10:00:00Z');
  const clock = { now: () => t, add: ms => { t += ms; } };
  const lim = createLimiter({ budget: { chat: 3, verify: 2 }, defaultLimit: 3, windowMin: 10, dailyLimit: 100, now: clock.now, ...over });
  return { lim, clock };
}

test('each visitor gets its own budget per action', () => {
  const { lim } = make();
  for (let i = 0; i < 3; i++) assert.equal(lim.allow('1.1.1.1', 'chat'), null);
  assert.equal(lim.allow('1.1.1.1', 'chat'), 'user');
  assert.equal(lim.allow('2.2.2.2', 'chat'), null, 'another visitor is not affected');
  assert.equal(lim.allow('1.1.1.1', 'verify'), null, 'proof checks have a separate budget');
});

test('the budget refills after the window', () => {
  const { lim, clock } = make();
  for (let i = 0; i < 3; i++) lim.allow('a');
  assert.equal(lim.allow('a'), 'user');
  clock.add(10 * 60e3 + 1);
  assert.equal(lim.allow('a'), null);
});

test('global daily cap on questions, reset at UTC midnight', () => {
  const { lim, clock } = make({ dailyLimit: 2 });
  assert.equal(lim.allow('a'), null);
  assert.equal(lim.allow('b'), null);
  assert.equal(lim.allow('c'), 'daily');
  assert.equal(lim.allow('c', 'verify'), null, 'the daily cap only counts questions');
  clock.add(24 * 3600e3);
  assert.equal(lim.allow('c'), null);
});

test('memory holds no IP addresses — only salted hashes and timestamps', () => {
  const { lim } = make();
  lim.allow('203.0.113.7'); lim.allow('203.0.113.7', 'verify');
  const dump = JSON.stringify(lim.snapshot());
  assert.ok(!dump.includes('203.0.113.7'));
  for (const [key, times] of lim.snapshot()) {
    assert.match(key, /^(chat|verify):[A-Za-z0-9_-]{16}$/);
    assert.ok(times.every(x => typeof x === 'number'));
  }
});

test('the same IP hashes differently in a new process (new salt)', () => {
  const a = make().lim, b = make().lim;
  a.allow('9.9.9.9'); b.allow('9.9.9.9');
  assert.notEqual(a.snapshot()[0][0], b.snapshot()[0][0]);
});

test('old entries are swept', () => {
  const { lim, clock } = make();
  lim.allow('x'); clock.add(11 * 60e3); lim.sweep();
  assert.equal(lim.snapshot().length, 0);
});
