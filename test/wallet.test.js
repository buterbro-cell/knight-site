'use strict';
// The wallet transaction: tokens go only to the quote's one-time deposit address; NEAR is wrapped first.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { pathToFileURL } = require('url');

test('deposit transaction for USDC and for NEAR', async t => {
  let W; try { W = await import(pathToFileURL(path.join(__dirname, '..', 'public', 'wallet.js')).href); } catch (e) { t.skip('wallet module needs a browser: ' + e.message); return; }
  const dep = 'a'.repeat(64);
  const usdc = W.depositActions({ depositAddress: dep, amountIn: '2025218', origin: { contract: 'usdc.near', native: false } }, 'me.near');
  assert.equal(usdc.receiverId, 'usdc.near');
  assert.deepEqual(usdc.actions.map(a => a.params.methodName), ['storage_deposit', 'ft_transfer']);
  assert.deepEqual(usdc.actions[1].params.args, { receiver_id: dep, amount: '2025218' });
  assert.equal(usdc.actions[1].params.deposit, '1');
  const near = W.depositActions({ depositAddress: dep, amountIn: '1000', origin: { contract: 'wrap.near', native: true } }, 'me.near', '0');
  const partly = W.depositActions({ depositAddress: dep, amountIn: '1000', origin: { contract: 'wrap.near', native: true } }, 'me.near', '400');
  assert.equal(partly.actions.find(a => a.params.methodName === 'near_deposit').params.deposit, '600', 'only the missing part is wrapped');
  const covered = W.depositActions({ depositAddress: dep, amountIn: '1000', origin: { contract: 'wrap.near', native: true } }, 'me.near', '1000');
  assert.ok(!covered.actions.some(a => a.params.methodName === 'near_deposit'), 'enough wNEAR: nothing to wrap');
  assert.deepEqual(near.actions.map(a => a.params.methodName), ['storage_deposit', 'near_deposit', 'storage_deposit', 'ft_transfer']);
  assert.equal(near.actions[1].params.deposit, '1000');
  assert.equal(near.actions[3].params.args.receiver_id, dep);
});
