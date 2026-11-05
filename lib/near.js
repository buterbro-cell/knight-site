// Minimal NEAR primitives with Node's built-in crypto only (no SDK): ed25519 keys, base58, implicit account ids,
// and NEP-413 message signing (https://github.com/near/NEPs/blob/master/neps/nep-0413.md).
// NEP-413: sign sha256( borsh( u32 tag = 2^31 + 413, { message: string, nonce: [u8; 32], recipient: string, callbackUrl: Option<string> } ) ).
'use strict';
const crypto = require('crypto');

const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function b58encode(buf) {
  const bytes = [...buf]; let zeros = 0; while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
  let n = BigInt('0x' + (Buffer.from(bytes).toString('hex') || '0')); let s = '';
  while (n > 0n) { s = B58[Number(n % 58n)] + s; n /= 58n; }
  return '1'.repeat(zeros) + s;
}
function b58decode(str) {
  let n = 0n; for (const ch of str) { const i = B58.indexOf(ch); if (i < 0) throw new Error('bad base58'); n = n * 58n + BigInt(i); }
  let hex = n.toString(16); if (hex.length % 2) hex = '0' + hex; if (n === 0n) hex = '';
  const zeros = str.match(/^1*/)[0].length;
  return Buffer.concat([Buffer.alloc(zeros), Buffer.from(hex, 'hex')]);
}

// ed25519 from a 32-byte seed (so a key can be derived deterministically, e.g. inside a TEE)
function keyFromSeed(seed32) {
  const der = Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), Buffer.from(seed32)]);
  const priv = crypto.createPrivateKey({ key: der, format: 'der', type: 'pkcs8' });
  const pub = crypto.createPublicKey(priv).export({ format: 'der', type: 'spki' }).subarray(-32);
  return { priv, pub: Buffer.from(pub), publicKey: 'ed25519:' + b58encode(pub), implicitAccount: Buffer.from(pub).toString('hex') };
}
const randomKey = () => keyFromSeed(crypto.randomBytes(32));
const sign = (key, data) => crypto.sign(null, data, key.priv);
const verify = (pub32, data, sig) => crypto.verify(null, data, crypto.createPublicKey({ key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), pub32]), format: 'der', type: 'spki' }), sig);

// borsh helpers
const u32 = n => { const b = Buffer.alloc(4); b.writeUInt32LE(n >>> 0); return b; };
const str = s => { const b = Buffer.from(s, 'utf8'); return Buffer.concat([u32(b.length), b]); };

function nep413Bytes({ message, nonce, recipient, callbackUrl = null }) {
  if (!Buffer.isBuffer(nonce) || nonce.length !== 32) throw new Error('nonce must be 32 bytes');
  return Buffer.concat([u32(2 ** 31 + 413), str(message), nonce, str(recipient), callbackUrl == null ? Buffer.from([0]) : Buffer.concat([Buffer.from([1]), str(callbackUrl)])]);
}
// Returns the `signedData` object the NEAR Intents API expects (standard: nep413)
function signNep413(key, { message, recipient, nonce = crypto.randomBytes(32) }) {
  const hash = crypto.createHash('sha256').update(nep413Bytes({ message, nonce, recipient })).digest();
  return {
    standard: 'nep413',
    payload: { recipient, nonce: nonce.toString('base64'), message },
    public_key: key.publicKey,
    signature: 'ed25519:' + b58encode(sign(key, hash)),
  };
}

module.exports = { b58encode, b58decode, keyFromSeed, randomKey, sign, verify, nep413Bytes, signNep413, u32, str };
