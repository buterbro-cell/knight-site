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

// Read-only contract call over NEAR JSON-RPC (no keys)
const RPC = () => process.env.NEAR_RPC || 'https://rpc.mainnet.near.org';
async function viewCall(contract, method, args = {}) {
  const body = { jsonrpc: '2.0', id: 'v', method: 'query', params: { request_type: 'call_function', finality: 'optimistic', account_id: contract, method_name: method, args_base64: Buffer.from(JSON.stringify(args)).toString('base64') } };
  const r = await fetch(RPC(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
  const j = await r.json();
  if (j.error || !j.result || !j.result.result) throw new Error('rpc: ' + JSON.stringify(j.error || j.result).slice(0, 200));
  return JSON.parse(Buffer.from(j.result.result).toString('utf8'));
}

// NEAR Intents versioned nonce (as VersionedNonceBuilder.encodeNonce in @defuse-protocol/intents-sdk):
// base64( magic 56 28 f6 c6 | version 0 | salt[4] | deadline u64 LE nanoseconds | random[15] ) = 32 bytes
function versionedNonce(salt4, deadline, random15 = crypto.randomBytes(15)) {
  if (salt4.length !== 4 || random15.length !== 15) throw new Error('bad salt or random length');
  const d = Buffer.alloc(8); d.writeBigUInt64LE(BigInt(deadline.getTime()) * 1000000n);
  return Buffer.concat([Buffer.from([0x56, 0x28, 0xf6, 0xc6, 0]), Buffer.from(salt4), d, random15]);
}


// ---------------------------------------------------------------- transactions (borsh, NEAR protocol)
const u64 = v => { const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(v)); return b; };
const u128 = v => { let x = BigInt(v); const b = Buffer.alloc(16); for (let i = 0; i < 16; i++) { b[i] = Number(x & 0xffn); x >>= 8n; } return b; };
const vecU8 = buf => Buffer.concat([u32(buf.length), buf]);
const pubKeyBytes = pk => Buffer.concat([Buffer.from([0]), b58decode(String(pk).replace(/^ed25519:/, ''))]);

// actions: { type: 'FunctionCall', methodName, args (object), gas, deposit } | { type: 'Transfer', deposit }
function actionBytes(a) {
  if (a.type === 'FunctionCall') return Buffer.concat([Buffer.from([2]), str(a.methodName), vecU8(Buffer.from(JSON.stringify(a.args || {}))), u64(a.gas), u128(a.deposit || 0)]);
  if (a.type === 'Transfer') return Buffer.concat([Buffer.from([3]), u128(a.deposit)]);
  throw new Error('unsupported action ' + a.type);
}
function txBytes({ signerId, publicKey, nonce, receiverId, blockHash, actions }) {
  return Buffer.concat([str(signerId), pubKeyBytes(publicKey), u64(nonce), str(receiverId), b58decode(blockHash), u32(actions.length), ...actions.map(actionBytes)]);
}
function signTx(key, tx) {
  const bytes = txBytes(tx);
  const hash = crypto.createHash('sha256').update(bytes).digest();
  const signed = Buffer.concat([bytes, Buffer.from([0]), sign(key, hash)]);
  return { hash: b58encode(hash), signedBase64: signed.toString('base64') };
}

async function rpc(method, params) {
  const r = await fetch(RPC(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 'x', method, params }), signal: AbortSignal.timeout(60000) });
  const j = await r.json();
  if (j.error) throw new Error('rpc ' + method + ': ' + JSON.stringify(j.error.cause || j.error.data || j.error).slice(0, 300));
  return j.result;
}
const viewAccessKey = (accountId, publicKey) => rpc('query', { request_type: 'view_access_key', finality: 'final', account_id: accountId, public_key: publicKey });
const viewAccount = accountId => rpc('query', { request_type: 'view_account', finality: 'final', account_id: accountId });

// Sign and send one transaction from `key` (the account must already hold this key)
async function sendTx(key, signerId, receiverId, actions) {
  const ak = await viewAccessKey(signerId, key.publicKey);
  const { hash, signedBase64 } = signTx(key, { signerId, publicKey: key.publicKey, nonce: BigInt(ak.nonce) + 1n, receiverId, blockHash: ak.block_hash, actions });
  const res = await rpc('send_tx', { signed_tx_base64: signedBase64, wait_until: 'EXECUTED_OPTIMISTIC' });
  const failure = res && res.status && res.status.Failure;
  if (failure) throw new Error('transaction failed: ' + JSON.stringify(failure).slice(0, 300));
  return { hash, result: res };
}

module.exports = { rpc, viewAccessKey, viewAccount, sendTx, txBytes, signTx, actionBytes, u64, u128, viewCall, versionedNonce,  b58encode, b58decode, keyFromSeed, randomKey, sign, verify, nep413Bytes, signNep413, u32, str };
