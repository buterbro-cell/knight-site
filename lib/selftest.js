// Minimal end-to-end check, as the hackathon track asks:
//   1) pick a TEE-hosted model from the models endpoint
//   2) send ONE chat completion through the OpenAI-compatible API
//   3) verify the response signature
//   4) fetch the attestation report with a fresh random nonce and verify it
// Used by scripts/verify.js (command line) and by GET /api/selftest (same output in the browser).
'use strict';
const { attest, verifyResponseSignature, getCollateral, libsReady } = require('./attest');
const { encode } = require('./bundle');

const BASE = (process.env.NEAR_AI_BASE || 'https://cloud-api.near.ai').replace(/\/v1\/?$/, '');
const KEY = () => process.env.NEAR_AI_KEY || '';
// Models NEAR AI hosts itself inside TEEs ("Private TEE" on near.ai/models)
const TEE_PREFS = ['deepseek-ai/DeepSeek-V4.1-Flash-1017', 'Qwen/Qwen3.8-27B', 'zai-org/GLM-5.3-Flash'];

const mark = ok => (ok ? '✅' : '❌');
// If `bundle` is an object, it is filled with everything needed to re-check this run OFFLINE later
// (scripts/verify-bundle.js): exact request/response bytes, the signature, the raw attestation report and
// Intel collateral for every quote. The prompt is a fixed public sentence — no user data is involved.
async function selftest(log, bundle) {
  if (!KEY()) { log('NEAR_AI_KEY is missing (put it in .env)'); return false; }
  log('Libraries:', libsReady());

  // 1) models endpoint → choose a TEE-hosted model
  const models = await (await fetch(`${BASE}/v1/models`, { headers: { Authorization: `Bearer ${KEY()}` } })).json();
  const ids = (models.data || []).map(m => m.id);
  const model = process.env.MODEL || TEE_PREFS.find(p => ids.includes(p)) || ids.find(id => /deepseek-ai|Qwen\/|zai-org/.test(id) && !/abliterated/i.test(id));
  log(`\n1) Model: ${model}  (from ${ids.length} models on /v1/models)`);

  // 2) one completion
  const body = JSON.stringify({ model, messages: [{ role: 'user', content: 'In one short sentence: what is a TEE?' }], max_tokens: 120, stream: false });
  const r = await fetch(`${BASE}/v1/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY()}` }, body });
  const raw = await r.text();
  if (!r.ok) { log('Completion failed:', r.status, raw.slice(0, 300)); return false; }
  const data = JSON.parse(raw);
  log(`\n2) Completion id: ${data.id}\n   Answer: ${data.choices?.[0]?.message?.content?.trim()}`);

  // 4) attestation with a fresh nonce (done before 3 so we know the attested signers)
  log('\n3) Attestation (fresh random nonce)…');
  const a = await attest(model);
  log(`   nonce: ${a.nonce}`);
  for (const [name, part] of [['Gateway', a.gateway], ...a.models.map((m, i) => [`Model #${i + 1}`, m])]) {
    if (!part) continue;
    log(`\n   ${name} — signing address ${part.signing_address}`);
    for (const c of part.checks) log(`     ${mark(c.ok)} ${c.label}${c.detail ? '  (' + c.detail + ')' : ''}${c.critical ? '' : '  [info]'}`);
  }
  log(`\n   Attestation overall: ${mark(a.ok)} ${a.ok ? 'VERIFIED' : 'NOT VERIFIED'}  (${a.ms} ms)`);

  // 3) response signature
  log('\n4) Response signature…');
  const s = await verifyResponseSignature({ chatId: data.id, model, requestBody: body, responseText: JSON.stringify(data), attestedSigners: a.signers });
  for (const c of s.checks) log(`     ${mark(c.ok)} ${c.label}${c.detail ? '  (' + c.detail + ')' : ''}`);
  log(`\n   Signature overall: ${mark(s.ok)}`);
  if (bundle && typeof bundle === 'object') {
    const rep = a.raw;
    const quotes = [rep.gateway_attestation, ...(rep.model_attestations || (rep.intel_quote ? [rep] : []))].filter(Boolean);
    const collateral = {};
    for (const q of quotes) { try { collateral[String(q.signing_address).toLowerCase()] = encode(await getCollateral(q.intel_quote)); } catch (e) { log('   collateral:', e.message); } }
    Object.assign(bundle, {
      format: 'sir-near-evidence/1', captured_at: new Date().toISOString(), captured_at_unix: Math.floor(Date.now() / 1000),
      model, request_body: body, response_text: JSON.stringify(data),
      signature: s.payload ? { text: s.payload.text, signature: s.payload.signature, signing_address: s.payload.signing_address, signing_algo: 'ecdsa' } : null,
      nonce: a.nonce, attestation_report: rep, intel_collateral: collateral,
      online_result: { attestation_ok: a.ok, signature_ok: s.ok },
    });
  }
  log('\nNothing was stored: this script only printed results.');
  return a.ok && s.ok;
}
module.exports = { selftest };
