// TEE attestation + response-signature verification for NEAR AI Cloud.
// Follows the official verifier (github.com/nearai/nearai-cloud-verifier, ts/model_verifier.ts
// and ts/chat_verifier.ts) step by step:
//   1. fresh random 32-byte nonce
//   2. GET /v1/attestation/report?model=…&nonce=…&signing_algo=ecdsa
//   3. Intel TDX quote verified with dcap-qvl against Intel's collateral
//   4. TDX report_data[0..32] binds the enclave signing address, report_data[32..64] == our nonce
//   5. NVIDIA GPU evidence: same nonce, verdict from NVIDIA NRAS
//   6. Docker compose hash == mr_config_id from the verified quote (what code runs)
//   7. Per response: GET /v1/signature/{chat_id}, compare request/response SHA-256,
//      recover the ECDSA signer and require it to be an attested signing address.
//
// PRIVACY: nothing here stores user data. Attestation results contain only hardware evidence.
'use strict';
const crypto = require('crypto');

let dcap = null, ethers = null;
try { dcap = require('@phala/dcap-qvl-node'); } catch { /* reported as a failed check */ }
try { ethers = require('ethers'); } catch { /* reported as a failed check */ }

const NRAS = 'https://nras.attestation.nvidia.com/v3/attest/gpu';
const INTEL_PCCS = 'https://api.trustedservices.intel.com/tdx/certification/v4';

function cfg() {
  return {
    base: (process.env.NEAR_AI_BASE || 'https://cloud-api.near.ai').replace(/\/v1\/?$/, '').replace(/\/$/, ''),
    key: process.env.NEAR_AI_KEY || process.env.API_KEY || '',
  };
}

async function getJson(url, opts = {}) {
  const r = await fetch(url, { ...opts, signal: AbortSignal.timeout(opts.timeout || 30000) });
  const text = await r.text();
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${text.slice(0, 200)}`);
  try { return JSON.parse(text); } catch { return text; }
}

const sha256 = s => crypto.createHash('sha256').update(s).digest('hex');
const check = (list, id, ok, label, detail, critical = true) => { list.push({ id, ok: !!ok, label, detail: detail || '', critical }); return ok; };

// ---- Intel TDX quote ----
// Collateral = Intel's signed certificates/CRLs for this quote. Saved in evidence bundles so a quote can be
// re-verified offline later, at the time it was captured (scripts/verify-bundle.js).
async function getCollateral(intelQuoteHex) {
  if (!dcap) throw new Error('dcap-qvl library not installed');
  return dcap.js_get_collateral(INTEL_PCCS, Buffer.from(intelQuoteHex, 'hex'));
}
async function verifyTdxQuote(intelQuoteHex, { collateral, atUnix } = {}) {
  if (!dcap) throw new Error('dcap-qvl library not installed');
  const raw = Buffer.from(intelQuoteHex, 'hex');
  if (!collateral) collateral = await dcap.js_get_collateral(INTEL_PCCS, raw);
  const res = dcap.js_verify(raw, collateral, BigInt(atUnix || Math.floor(Date.now() / 1000)));
  const td = res?.report?.TD10 || res?.report?.TD15 || {};
  const status = typeof res?.status === 'string' ? res.status : '';
  // UpToDate is ideal; OutOfDate still has a cryptographically valid quote (same rule as the official verifier)
  const verified = status ? ['UpToDate', 'OutOfDate'].includes(status) : !!res?.quote?.verified;
  return { verified, status, reportData: String(td.report_data || '').replace(/^0x/i, ''), mrConfig: String(td.mr_config_id || '').replace(/^0x/i, '') };
}

function padAddress32(addr, algo) {
  const hex = algo === 'ecdsa' ? addr.replace(/^0x/i, '') : addr;
  const b = Buffer.from(hex, 'hex');
  return Buffer.concat([b, Buffer.alloc(Math.max(0, 32 - b.length))]).subarray(0, 32);
}

// ---- pure checks (no network) — unit-tested in test/attest.test.js ----
// TDX report_data = [32 bytes binding the enclave's signing key][32 bytes = our nonce]
function reportDataMatches(reportDataHex, att, nonce) {
  const rd = Buffer.from(String(reportDataHex).replace(/^0x/i, ''), 'hex');
  const algo = (att.signing_algo || 'ecdsa').toLowerCase();
  let expected;
  if (att.tls_cert_fingerprint) {
    expected = crypto.createHash('sha256').update(Buffer.from(algo === 'ecdsa' ? att.signing_address.replace(/^0x/i, '') : att.signing_address, 'hex')).update(Buffer.from(att.tls_cert_fingerprint, 'hex')).digest();
  } else expected = padAddress32(att.signing_address, algo);
  return {
    binding: rd.length >= 32 && rd.subarray(0, 32).equals(expected),
    nonce: /^[0-9a-f]{64}$/i.test(nonce) && rd.length >= 64 && rd.subarray(32, 64).equals(Buffer.from(nonce, 'hex')),
  };
}
// The docker compose that runs in the enclave: its sha256 must be the attested mr_config_id (prefixed 0x01)
function composeMatches(appCompose, mrConfigHex) {
  const hash = crypto.createHash('sha256').update(appCompose).digest('hex');
  return { ok: String(mrConfigHex).replace(/^0x/i, '').toLowerCase().startsWith('01' + hash), hash };
}
// A NEAR AI per-response signature: text = "<model>:<sha256(request)>:<sha256(response)>" signed with the
// enclave's ECDSA key (Ethereum personal_sign). All four conditions must hold.
function signedTextChecks({ payload, requestBody, responseText, attestedSigners }) {
  const checks = [];
  const parts = String(payload.text).split(':');
  const reqH = parts.length === 3 ? parts[1] : parts[0], resH = parts.length === 3 ? parts[2] : parts[1];
  check(checks, 'req_hash', reqH === sha256(requestBody), 'Question reached the enclave unchanged', 'SHA-256 of our request vs. the signed hash');
  check(checks, 'res_hash', resH === sha256(responseText), 'Answer left the enclave unchanged', 'SHA-256 of the received answer vs. the signed hash');
  let signer = '';
  try { if (!ethers) throw new Error('ethers library not installed'); signer = ethers.utils.verifyMessage(payload.text, payload.signature).toLowerCase(); }
  catch (e) { check(checks, 'sig', false, 'Signature is valid', e.message); }
  if (signer) check(checks, 'sig', signer === String(payload.signing_address).toLowerCase(), 'Signature is valid', `signer ${signer}`);
  const known = (attestedSigners || []).map(x => String(x).toLowerCase());
  check(checks, 'attested', !!signer && known.includes(signer), 'Signer is an attested TEE key', known.includes(signer) ? 'matches a verified enclave' : 'signer not in the latest verified attestation');
  return { ok: checks.every(c => c.ok), signer, checks };
}

// ---- one attestation (gateway or model) ----
async function verifyOne(att, nonce, { gpu }) {
  const checks = [];
  const algo = (att.signing_algo || 'ecdsa').toLowerCase();
  let intel = null;
  try {
    intel = await verifyTdxQuote(att.intel_quote);
    check(checks, 'intel', intel.verified, 'Intel TDX quote is genuine', `dcap-qvl status: ${intel.status || (intel.verified ? 'verified' : 'failed')}`);
  } catch (e) {
    check(checks, 'intel', false, 'Intel TDX quote is genuine', e.message);
  }
  if (intel && intel.reportData) {
    const r = reportDataMatches(intel.reportData, att, nonce);
    check(checks, 'binding', r.binding, 'Signing key is bound to this enclave', `report_data[0..32] = signing address ${att.signing_address}`);
    check(checks, 'nonce', r.nonce, 'Report is fresh (our nonce inside the quote)', `report_data[32..64] = ${nonce.slice(0, 16)}…`);
  } else {
    check(checks, 'binding', false, 'Signing key is bound to this enclave', 'no verified report_data');
    check(checks, 'nonce', false, 'Report is fresh (our nonce inside the quote)', 'no verified report_data');
  }
  if (att.request_nonce !== undefined) check(checks, 'echo', String(att.request_nonce).toLowerCase() === nonce, 'Server echoed our nonce', '', false);

  // What code runs: compose hash must equal mr_config_id from the verified quote
  try {
    const tcb = typeof att.info?.tcb_info === 'string' ? JSON.parse(att.info.tcb_info) : att.info?.tcb_info;
    if (tcb?.app_compose && intel?.mrConfig) {
      const { ok, hash: h } = composeMatches(tcb.app_compose, intel.mrConfig);
      check(checks, 'compose', ok, 'Running code matches the attested manifest', `compose sha256 ${h.slice(0, 16)}… = mr_config_id`, false);
    }
  } catch (e) { check(checks, 'compose', false, 'Running code matches the attested manifest', e.message, false); }

  if (gpu) {
    if (!att.nvidia_payload) check(checks, 'gpu', false, 'NVIDIA GPU is in confidential-computing mode', 'no GPU evidence in report');
    else {
      try {
        const payload = JSON.parse(att.nvidia_payload);
        check(checks, 'gpu_nonce', String(payload.nonce).toLowerCase() === nonce, 'GPU evidence uses our nonce', '');
        const body = await getJson(NRAS, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload), timeout: 30000 });
        const jwt = body[0][1];
        const claims = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString('utf8'));
        const verdict = claims['x-nvidia-overall-att-result'];
        check(checks, 'gpu', verdict === true || verdict === 'true', 'NVIDIA GPU is in confidential-computing mode', `NVIDIA NRAS verdict: ${verdict}`);
      } catch (e) { check(checks, 'gpu', false, 'NVIDIA GPU is in confidential-computing mode', 'NRAS: ' + e.message); }
    }
  }
  return { signing_address: att.signing_address, signing_algo: algo, model: att.model_name, checks };
}

// ---- full attestation for a model ----
async function attest(model, { signingAddress, nonce: given } = {}) {
  const { base, key } = cfg();
  // fresh random nonce every time — or a challenge chosen by the visitor (sha256 of their word)
  const nonce = /^[0-9a-f]{64}$/.test(given || '') ? given : crypto.randomBytes(32).toString('hex');
  let url = `${base}/v1/attestation/report?model=${encodeURIComponent(model)}&nonce=${nonce}&signing_algo=ecdsa`;
  if (signingAddress) url += `&signing_address=${encodeURIComponent(signingAddress)}`;
  const t0 = Date.now();
  const report = await getJson(url, { headers: key ? { Authorization: `Bearer ${key}` } : {}, timeout: 45000 });
  const out = { model, nonce, checkedAt: new Date().toISOString(), gateway: null, models: [] };
  if (report.gateway_attestation) out.gateway = await verifyOne(report.gateway_attestation, nonce, { gpu: false });
  const models = report.model_attestations || (report.intel_quote ? [report] : []);
  out.models = await Promise.all(models.map(a => verifyOne(a, nonce, { gpu: true })));
  const all = [...(out.gateway ? [out.gateway] : []), ...out.models];
  out.ok = out.models.length > 0 && all.every(a => a.checks.filter(c => c.critical).every(c => c.ok));
  out.signers = all.map(a => a.signing_address).filter(Boolean).map(s => s.toLowerCase());
  out.ms = Date.now() - t0;
  Object.defineProperty(out, 'raw', { value: report, enumerable: false });   // original report, for independent re-verification
  return out;
}

// ---- per-response signature ----
async function verifyResponseSignature({ chatId, model, requestBody, responseText, attestedSigners }) {
  const { base, key } = cfg();
  const checks = [];
  let payload = null;
  for (let i = 0; i < 4 && !payload; i++) {          // the signature can take a moment to appear
    try { payload = await getJson(`${base}/v1/signature/${encodeURIComponent(chatId)}?model=${encodeURIComponent(model)}&signing_algo=ecdsa`, { headers: { Authorization: `Bearer ${key}` }, timeout: 10000 }); }
    catch { await new Promise(r => setTimeout(r, 400 * (i + 1))); }
  }
  if (!payload || !payload.text) return { ok: false, checks: [{ id: 'sig', ok: false, label: 'Response signed inside the TEE', detail: 'signature not available' }] };
  const v = signedTextChecks({ payload, requestBody, responseText, attestedSigners });
  // Evidence anyone can re-check with the official NEAR verifier (hashes only — no question or answer text)
  const evidence = { chat_id: chatId, model, signed_text: payload.text, signature: payload.signature, signing_address: payload.signing_address, signing_algo: 'ecdsa' };
  return { ok: v.ok, signer: v.signer, checks: v.checks, evidence, payload };
}

module.exports = { attest, verifyResponseSignature, verifyTdxQuote, getCollateral, reportDataMatches, composeMatches, signedTextChecks, sha256, libsReady: () => ({ dcap: !!dcap, ethers: !!ethers }) };
