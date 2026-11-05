'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const near = require('../lib/near');

test('ed25519 key from a seed matches the RFC 8032-style known public key', () => {
  assert.equal(near.keyFromSeed(Buffer.alloc(32, 1)).pub.toString('hex'), '8a88e3dd7409f195fd52db2d3cba5d72ca6709bf1d94121bf3748801b40f6f5c');
});

test('base58 round trip, leading zeros kept', () => {
  for (const b of [Buffer.from([0, 0, 1]), crypto.randomBytes(32), Buffer.from([255])]) assert.ok(near.b58decode(near.b58encode(b)).equals(b));
});

test('NEP-413 bytes: tag 2^31+413, borsh strings, 32-byte nonce, None callback', () => {
  const nonce = Buffer.alloc(32, 7);
  const b = near.nep413Bytes({ message: 'hi', nonce, recipient: 'intents.near' });
  assert.equal(b.readUInt32LE(0), 2147484061);
  assert.equal(b.readUInt32LE(4), 2); assert.equal(b.subarray(8, 10).toString(), 'hi');
  assert.ok(b.subarray(10, 42).equals(nonce));
  assert.equal(b.readUInt32LE(42), 12); assert.equal(b.subarray(46, 58).toString(), 'intents.near');
  assert.equal(b[58], 0); assert.equal(b.length, 59);
});

test('NEP-413 signature verifies against the public key; implicit account = hex(public key)', () => {
  const k = near.randomKey();
  const s = near.signNep413(k, { message: '{"intents":[]}', recipient: 'intents.near' });
  const hash = crypto.createHash('sha256').update(near.nep413Bytes({ message: s.payload.message, nonce: Buffer.from(s.payload.nonce, 'base64'), recipient: 'intents.near' })).digest();
  assert.ok(near.verify(k.pub, hash, near.b58decode(s.signature.replace('ed25519:', ''))));
  assert.equal(k.implicitAccount, near.b58decode(k.publicKey.replace('ed25519:', '')).toString('hex'));
});
