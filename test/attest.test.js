'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { reportDataMatches, composeMatches, signedTextChecks, sha256 } = require('../lib/attest');

let ethers = null; try { ethers = require('ethers'); } catch {}
const nonce = crypto.randomBytes(32).toString('hex');
const addr = '0x' + crypto.randomBytes(20).toString('hex');
const pad = a => Buffer.concat([Buffer.from(a.slice(2), 'hex'), Buffer.alloc(12)]);

test('report_data binds the signing key and carries our nonce', () => {
  const rd = Buffer.concat([pad(addr), Buffer.from(nonce, 'hex')]).toString('hex');
  assert.deepEqual(reportDataMatches(rd, { signing_address: addr, signing_algo: 'ecdsa' }, nonce), { binding: true, nonce: true });
});

test('a replayed report (other nonce) is not fresh', () => {
  const rd = Buffer.concat([pad(addr), crypto.randomBytes(32)]).toString('hex');
  assert.equal(reportDataMatches(rd, { signing_address: addr }, nonce).nonce, false);
});

test('a report for another key does not bind ours', () => {
  const other = '0x' + crypto.randomBytes(20).toString('hex');
  const rd = Buffer.concat([pad(other), Buffer.from(nonce, 'hex')]).toString('hex');
  assert.equal(reportDataMatches(rd, { signing_address: addr }, nonce).binding, false);
});

test('gateway form: report_data = sha256(signing address ‖ TLS certificate fingerprint)', () => {
  const fp = crypto.randomBytes(32).toString('hex');
  const first = crypto.createHash('sha256').update(Buffer.from(addr.slice(2), 'hex')).update(Buffer.from(fp, 'hex')).digest();
  const rd = Buffer.concat([first, Buffer.from(nonce, 'hex')]).toString('hex');
  assert.equal(reportDataMatches(rd, { signing_address: addr, tls_cert_fingerprint: fp }, nonce).binding, true);
  assert.equal(reportDataMatches(rd, { signing_address: addr, tls_cert_fingerprint: crypto.randomBytes(32).toString('hex') }, nonce).binding, false);
});

test('compose hash must equal mr_config_id (0x01 prefix)', () => {
  const compose = 'services:\n  app:\n    image: ghcr.io/x/y@sha256:abc\n';
  const h = crypto.createHash('sha256').update(compose).digest('hex');
  assert.equal(composeMatches(compose, '0x01' + h + '00').ok, true);
  assert.equal(composeMatches(compose + ' ', '01' + h).ok, false, 'any change to the compose changes the hash');
});

test('per-answer signature: valid, tampered and unknown-signer cases', { skip: !ethers && 'ethers not installed' }, async () => {
  const enclave = ethers.Wallet.createRandom();
  const request = JSON.stringify({ model: 'm', messages: [{ role: 'user', content: 'q' }] });
  const response = 'data: {"choices":[{"delta":{"content":"a"}}]}\n\n';
  const text = `m:${sha256(request)}:${sha256(response)}`;
  const payload = { text, signature: await enclave.signMessage(text), signing_address: enclave.address };
  const signers = [enclave.address.toLowerCase()];

  assert.equal(signedTextChecks({ payload, requestBody: request, responseText: response, attestedSigners: signers }).ok, true);

  const changed = signedTextChecks({ payload, requestBody: request, responseText: response + 'x', attestedSigners: signers });
  assert.equal(changed.ok, false);
  assert.equal(changed.checks.find(c => c.id === 'res_hash').ok, false, 'an edited answer is caught');

  const q = signedTextChecks({ payload, requestBody: request + ' ', responseText: response, attestedSigners: signers });
  assert.equal(q.checks.find(c => c.id === 'req_hash').ok, false, 'an edited question is caught');

  const notAttested = signedTextChecks({ payload, requestBody: request, responseText: response, attestedSigners: ['0x' + '1'.repeat(40)] });
  assert.equal(notAttested.checks.find(c => c.id === 'attested').ok, false, 'a valid signature from a non-attested key is rejected');

  const forger = ethers.Wallet.createRandom();
  const forged = { ...payload, signature: await forger.signMessage(text) };
  assert.equal(signedTextChecks({ payload: forged, requestBody: request, responseText: response, attestedSigners: signers }).checks.find(c => c.id === 'sig').ok, false, 'a signature by another key is rejected');
});
