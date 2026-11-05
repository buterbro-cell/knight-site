'use strict';
// Our zero-dependency transaction encoding must equal the official near-api-js bytes (dev dependency, run in CI).
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const near = require('../lib/near');

let api = null; try { api = require('near-api-js'); } catch {}

test('transaction bytes equal near-api-js for FunctionCall + Transfer', { skip: !api && 'near-api-js not installed' }, () => {
  const { transactions, utils } = api;
  const key = near.randomKey();
  const blockHash = near.b58encode(crypto.randomBytes(32));
  const args = { receiver_id: 'a'.repeat(64), amount: '2025218' };
  const ours = near.txBytes({ signerId: 'agent.near', publicKey: key.publicKey, nonce: 123456789012n, receiverId: 'usdc.near', blockHash,
    actions: [{ type: 'FunctionCall', methodName: 'ft_transfer', args, gas: '30000000000000', deposit: '1' }, { type: 'Transfer', deposit: '1250000000000000000000' }] });
  const tx = transactions.createTransaction('agent.near', utils.PublicKey.fromString(key.publicKey), 'usdc.near', 123456789012n,
    [transactions.functionCall('ft_transfer', args, 30000000000000n, 1n), transactions.transfer(1250000000000000000000n)], utils.serialize.base_decode(blockHash));
  const theirs = Buffer.from(transactions.encodeTransaction ? transactions.encodeTransaction(tx) : tx.encode());
  assert.equal(ours.toString('hex'), theirs.toString('hex'));
});

test('signed transaction: signature over sha256(tx) verifies, hash is base58 of it', () => {
  const key = near.randomKey();
  const tx = { signerId: key.implicitAccount, publicKey: key.publicKey, nonce: 1n, receiverId: 'wrap.near', blockHash: near.b58encode(Buffer.alloc(32, 3)), actions: [{ type: 'Transfer', deposit: '1' }] };
  const { hash, signedBase64 } = near.signTx(key, tx);
  const bytes = near.txBytes(tx), signed = Buffer.from(signedBase64, 'base64');
  const h = crypto.createHash('sha256').update(bytes).digest();
  assert.equal(hash, near.b58encode(h));
  assert.ok(signed.subarray(0, bytes.length).equals(bytes));
  assert.equal(signed[bytes.length], 0);
  assert.ok(near.verify(key.pub, h, signed.subarray(bytes.length + 1)));
});
