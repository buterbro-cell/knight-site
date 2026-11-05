'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const pay = require('../lib/pay');

test('amounts become exact integer units; junk is rejected', () => {
  assert.equal(pay.toUnits('2', 6), 2000000n);
  assert.equal(pay.toUnits('2.5', 6), 2500000n);
  assert.equal(pay.toUnits('0.000001', 6), 1n);
  assert.equal(pay.toUnits('1.5', 24), 1500000000000000000000000n);
  for (const bad of ['-1', '0', '1e3', '1.0000001', 'abc', '', '1,5']) assert.throws(() => pay.toUnits(bad, 6), bad);
});

test('send: recipient gets exactly the amount (EXACT_OUTPUT), confidential, refunds to the sender', () => {
  const q = pay.buildQuote({ action: 'send', amount: '2', token: 'USDC', to: 'anna.near', from: 'mcloven1.tg' });
  assert.equal(q.swapType, 'EXACT_OUTPUT');
  assert.equal(q.amount, '2000000');
  assert.equal(q.recipient, 'anna.near');
  assert.equal(q.refundTo, 'mcloven1.tg');
  assert.equal(q.confidentiality, 'advanced');
  assert.equal(q.originAsset, pay.ASSETS['USDC@near'].assetId);
  assert.equal(q.destinationAsset, pay.ASSETS['USDC@near'].assetId);
});

test('send to Base needs an EVM address', () => {
  assert.throws(() => pay.buildQuote({ action: 'send', amount: '1', token: 'USDC', toChain: 'base', to: 'anna.near', from: 'me.near' }));
  const q = pay.buildQuote({ action: 'send', amount: '1', token: 'USDC', toChain: 'base', to: '0x' + 'a'.repeat(40), from: 'me.near' });
  assert.equal(q.destinationAsset, pay.ASSETS['USDC@base'].assetId);
});

test('swap: the user puts in exactly the amount (EXACT_INPUT) and receives on their own account', () => {
  const q = pay.buildQuote({ action: 'swap', amount: '3', token: 'NEAR', toToken: 'USDC', from: 'me.near' }, { prices: { NEAR: 2 } });
  assert.equal(q.swapType, 'EXACT_INPUT');
  assert.equal(q.recipient, 'me.near');
  assert.equal(q.amount, (3n * 10n ** 24n).toString());
  assert.throws(() => pay.buildQuote({ action: 'swap', amount: '3', token: 'USDC', toToken: 'USDC', from: 'me.near' }), /different/);
});

test('safety limits: per-action cap, known tokens only, a connected wallet, valid accounts', () => {
  assert.throws(() => pay.buildQuote({ action: 'send', amount: String(pay.MAX_USD + 1), token: 'USDC', to: 'a.near', from: 'me.near' }), /limit/);
  assert.throws(() => pay.buildQuote({ action: 'swap', amount: '100', token: 'NEAR', toToken: 'USDC', from: 'me.near' }, { prices: { NEAR: 2 } }), /limit/);
  assert.throws(() => pay.buildQuote({ action: 'swap', amount: '1', token: 'NEAR', toToken: 'USDC', from: 'me.near' }), /price/);
  assert.throws(() => pay.buildQuote({ action: 'send', amount: '1', token: 'DOGE', to: 'a.near', from: 'me.near' }), /unsupported/);
  assert.throws(() => pay.buildQuote({ action: 'send', amount: '1', token: 'USDC', to: 'a.near' }), /wallet/);
  assert.throws(() => pay.buildQuote({ action: 'send', amount: '1', token: 'USDC', to: 'Bad Name!', from: 'me.near' }), /recipient/);
  assert.throws(() => pay.buildQuote({ action: 'withdraw_all', amount: '1', token: 'USDC', from: 'me.near' }), /action/);
});

test('account validators', () => {
  for (const ok of ['ro52.near', 'mcloven1.tg', 'a-b_c.near', 'f'.repeat(64)]) assert.ok(pay.isNearAccount(ok), ok);
  for (const bad of ['A.near', 'a..near', '.near', 'a', 'x'.repeat(65), 'a.near.']) assert.ok(!pay.isNearAccount(bad), bad);
});

test('one payment unlocks one document (follow-ups on it are free), not a second document', () => {
  const d = 'e'.repeat(64);
  assert.equal(pay.consumeDeposit(d, 'blood.jpg'), true);
  assert.equal(pay.consumeDeposit(d, 'blood.jpg'), true, 'follow-up question on the same document');
  assert.equal(pay.consumeDeposit(d, 'other.pdf'), false, 'a different document needs a new payment');
});
