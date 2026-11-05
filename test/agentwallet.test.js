'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
process.env.AGENT_DEV_SEED = 'test-seed';
const aw = require('../lib/agentwallet');
const near = require('../lib/near');

test('outside a TEE only an explicit dev seed enables it, and it says so', () => {
  assert.equal(aw.mode(), 'dev');
});

test('one owner → one stable agent wallet; different owners → different wallets', async () => {
  const a1 = await aw.agentKey('alice.near'), a2 = await aw.agentKey('alice.near'), b = await aw.agentKey('bob.near');
  assert.equal(a1.implicitAccount, a2.implicitAccount);
  assert.notEqual(a1.implicitAccount, b.implicitAccount);
  assert.match(a1.implicitAccount, /^[0-9a-f]{64}$/);
});

function signed(owner, key, { at = Date.now(), msgOwner = owner, recipient = aw.RECIPIENT } = {}) {
  const message = aw.sessionMessage(msgOwner, at);
  const nonce = crypto.randomBytes(32);
  const hash = crypto.createHash('sha256').update(near.nep413Bytes({ message, nonce, recipient })).digest();
  return { accountId: owner, publicKey: key.publicKey, signature: near.sign(key, hash).toString('base64'), message, nonce: nonce.toString('base64') };
}
const fullAccess = () => async () => ({ permission: 'FullAccess' });

test('a session opens only with the owner\'s own full-access key signing the exact fresh message', async () => {
  const k = near.randomKey();
  const s = await aw.openSession(signed('owner.near', k), { checkKey: fullAccess() });
  assert.equal(aw.checkToken(s.token), 'owner.near');
  await assert.rejects(aw.openSession(signed('owner.near', k), { checkKey: async () => ({ permission: { FunctionCall: {} } }) }), /full-access/);
  await assert.rejects(aw.openSession(signed('owner.near', k, { at: Date.now() - 10 * 60e3 }), { checkKey: fullAccess() }), /old/);
  await assert.rejects(aw.openSession(signed('owner.near', k, { msgOwner: 'friend.near' }), { checkKey: fullAccess() }), /message/);
  await assert.rejects(aw.openSession(signed('owner.near', k, { recipient: 'evil.near' }), { checkKey: fullAccess() }), /signature/);
  const other = near.randomKey(), forged = signed('owner.near', other); forged.publicKey = k.publicKey;
  await assert.rejects(aw.openSession(forged, { checkKey: fullAccess() }), /signature/);
});

test('tokens cannot be forged or extended', () => {
  assert.equal(aw.checkToken('owner.near|' + (Date.now() + 1e6) + '|AAAA'), null);
  assert.equal(aw.checkToken(''), null);
});

test('limits: per action and per day; a failed payment gives the budget back', () => {
  const { perActionUsd, perDayUsd } = aw.LIMITS;
  assert.throws(() => aw.reserve('lim.near', perActionUsd + 1), /per action/);
  const undo = aw.reserve('lim.near', perActionUsd);
  let total = perActionUsd;
  while (total + perActionUsd <= perDayUsd) { aw.reserve('lim.near', perActionUsd); total += perActionUsd; }
  assert.throws(() => aw.reserve('lim.near', perActionUsd), /per day/);
  undo();
  assert.doesNotThrow(() => aw.reserve('lim.near', Math.min(perActionUsd, perDayUsd - total + perActionUsd)));
});
