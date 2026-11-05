'use strict';
// The wallet transaction: tokens go only to the quote's one-time deposit address; NEAR is wrapped first.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { pathToFileURL } = require('url');

test('top-up of the Intents balance: NEAR wraps only the missing part, USDT goes straight in', async t => {
  let W; try { W = await import(pathToFileURL(path.join(__dirname, '..', 'public', 'wallet.js')).href); } catch (e) { t.skip('wallet module needs a browser: ' + e.message); return; }
  const usdt = W.depositActions('USDT', '2000000');
  assert.equal(usdt.receiverId, 'usdt.tether-token.near');
  assert.deepEqual(usdt.actions.map(a => a.params.methodName), ['ft_transfer_call']);
  assert.deepEqual(usdt.actions[0].params.args, { receiver_id: 'intents.near', amount: '2000000', msg: '' });
  assert.equal(usdt.actions[0].params.deposit, '1');
  const near = W.depositActions('NEAR', '1000', '400');
  assert.equal(near.receiverId, 'wrap.near');
  assert.equal(near.actions[0].params.methodName, 'near_deposit');
  assert.equal(near.actions[0].params.deposit, '600', 'only the missing part is wrapped');
  assert.ok(!W.depositActions('NEAR', '1000', '1000').actions.some(a => a.params.methodName === 'near_deposit'));
});
