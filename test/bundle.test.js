'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { encode, decode } = require('../lib/bundle');

test('collateral bytes survive the JSON round trip exactly', () => {
  const v = { pck: new Uint8Array([0, 1, 254, 255]), list: [new Uint8Array([9])], m: new Map([['k', 'v']]), n: 7n, s: 'x' };
  const back = decode(JSON.parse(JSON.stringify(encode(v))));
  assert.ok(back.pck instanceof Uint8Array);
  assert.deepEqual([...back.pck], [0, 1, 254, 255]);
  assert.deepEqual([...back.list[0]], [9]);
  assert.equal(back.m.get('k'), 'v');
  assert.equal(back.n, 7n);
});

// Every committed evidence bundle must verify offline, and any edit must break it.
const dir = path.join(__dirname, '..', 'evidence');
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.json')) : [];
let libs = true; try { require('ethers'); require('@phala/dcap-qvl-node'); } catch { libs = false; }
for (const f of files) {
  test(`evidence/${f} verifies offline; tampering is detected`, { skip: !libs && 'verifier libraries not installed' }, async () => {
    const { verifyBundle } = require('../scripts/verify-bundle');
    const b = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const good = await verifyBundle(b);
    assert.equal(good.ok, true, good.results.filter(r => !r.ok).map(r => r.label).join('; '));
    const edited = await verifyBundle({ ...b, response_text: b.response_text.replace(/TEE/, 'XYZ') });
    assert.equal(edited.ok, false, 'an edited answer must fail');
    const otherNonce = await verifyBundle({ ...b, nonce: 'ab'.repeat(32) });
    assert.equal(otherNonce.ok, false, 'a different nonce must fail');
  });
}
