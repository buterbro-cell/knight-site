#!/usr/bin/env node
// Re-verify a saved evidence bundle OFFLINE: no NEAR AI key, no network, no trust in our server.
//   node scripts/verify-bundle.js evidence/<file>.json
// Checks, using only the bytes in the file:
//   1. the answer signature recovers to the enclave's signing address (ECDSA, Ethereum personal_sign)
//   2. the signed hashes equal SHA-256 of the exact request and response bytes
//   3. the Intel TDX quote for that signing address is genuine (dcap-qvl with the saved Intel collateral,
//      evaluated at the capture time)
//   4. the quote's report_data binds that signing address and contains the bundle's nonce
//   5. the docker compose hash equals the attested mr_config_id (what code ran)
// NVIDIA GPU evidence needs NVIDIA's online service — use `npm run verify` for the live check.
'use strict';
const fs = require('fs');
const { verifyTdxQuote, reportDataMatches, composeMatches, signedTextChecks } = require('../lib/attest');
const { decode } = require('../lib/bundle');

async function verifyBundle(b) {
  const results = [];
  const add = (ok, label, detail = '') => results.push({ ok: !!ok, label, detail });
  if (b.format !== 'sir-near-evidence/1') throw new Error('unknown bundle format');
  const rep = b.attestation_report;
  const quotes = [rep.gateway_attestation, ...(rep.model_attestations || (rep.intel_quote ? [rep] : []))].filter(Boolean);
  const signer = String(b.signature.signing_address).toLowerCase();
  const modelQuote = (rep.model_attestations || [rep]).find(q => String(q.signing_address).toLowerCase() === signer);

  const sig = signedTextChecks({ payload: b.signature, requestBody: b.request_body, responseText: b.response_text, attestedSigners: modelQuote ? [signer] : [] });
  for (const c of sig.checks) add(c.ok, c.label, c.detail);

  for (const q of quotes) {
    const who = q === rep.gateway_attestation ? 'gateway' : 'model';
    const col = b.intel_collateral[String(q.signing_address).toLowerCase()];
    let intel = null;
    try {
      intel = await verifyTdxQuote(q.intel_quote, { collateral: col ? decode(col) : undefined, atUnix: b.captured_at_unix });
      add(intel.verified, `[${who}] Intel TDX quote is genuine`, `status ${intel.status} at ${b.captured_at}`);
    } catch (e) { add(false, `[${who}] Intel TDX quote is genuine`, e.message); continue; }
    const rd = reportDataMatches(intel.reportData, q, b.nonce);
    add(rd.binding, `[${who}] Signing key ${q.signing_address} is bound to this enclave`);
    add(rd.nonce, `[${who}] Report contains the bundle nonce`, b.nonce.slice(0, 16) + '…');
    try {
      const tcb = typeof q.info?.tcb_info === 'string' ? JSON.parse(q.info.tcb_info) : q.info?.tcb_info;
      if (tcb?.app_compose) { const c = composeMatches(tcb.app_compose, intel.mrConfig); add(c.ok, `[${who}] Running code matches the attested compose`, `sha256 ${c.hash.slice(0, 16)}…`); }
    } catch (e) { add(false, `[${who}] Running code matches the attested compose`, e.message); }
  }
  add(!!modelQuote, 'The answer was signed by a key from the attested model enclave', signer);
  return { ok: results.every(r => r.ok), results };
}

if (require.main === module) {
  const file = process.argv[2];
  if (!file) { console.error('usage: node scripts/verify-bundle.js <bundle.json>'); process.exit(2); }
  verifyBundle(JSON.parse(fs.readFileSync(file, 'utf8'))).then(({ ok, results }) => {
    for (const r of results) console.log(`${r.ok ? '✅' : '❌'} ${r.label}${r.detail ? '  (' + r.detail + ')' : ''}`);
    console.log(ok ? '\nBUNDLE VERIFIED offline' : '\nBUNDLE NOT VERIFIED');
    process.exit(ok ? 0 : 1);
  }).catch(e => { console.error('Error:', e.message); process.exit(1); });
}
module.exports = { verifyBundle };
