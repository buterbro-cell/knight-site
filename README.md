# Sir Near — a private voice AI you can verify

**Track: Privacy & Private AI (`privacy`)** · NEAR AI Cloud · TEE · Attestation

Sir Near is an animated voice knight. You talk to him or hand him a sensitive document — a bank statement, receipts, a lease — and he answers out loud: what matters, what looks unusual, what is suspicious.

Everything that touches your data runs inside Trusted Execution Environments on **NEAR AI Cloud**, and the app **proves it**:

- 🎙️ **Voice → text:** Whisper Large v3, hosted by NEAR AI inside a TEE (Private TEE).
- 🧠 **Thinking:** `deepseek-ai/DeepSeek-V4.1-Flash-1017`, hosted by NEAR AI inside a TEE (Private TEE).
- 🔊 **Text → voice:** your own browser, on your device.
- 🛡️ **Verified panel:** the server fetches the attestation report with a **fresh random nonce** and verifies it the way the NEAR AI verification docs describe. The panel lists every check.
- 🔏 **Every answer is signed** inside the enclave; the app checks the signature and that the signer is an attested TEE key.
- 🗑️ **Nothing is stored server-side.** See below.

## Requirements → where they are

| Requirement | Where |
|---|---|
| OpenAI-compatible API, base URL `https://cloud-api.near.ai/v1`, key in `.env` | `lib/env.js`, `.env.example`, `server.js` (`API_URL`) |
| Choose a TEE-hosted model from the models endpoint | `server.js → checkModel()` reads `/v1/models`, prefers NEAR-hosted *Private TEE* models (`MODEL_PREFS`), never *Incognito* ones; same in `scripts/verify.js` |
| Fetch attestation with a fresh random nonce and verify it as the docs describe | `lib/attest.js → attest()` (port of the official `nearai-cloud-verifier`, see checks below) |
| Show a "Verified" panel listing what was checked | `public/index.html` → **TEE ✓** button in the header and the line under each answer |
| Keep nothing server-side after a response returns | header comment of `server.js`, `/api/health → storesUserData:false`, section below |
| Fictional sample documents | `public/samples/` (statement CSV, receipts, lease) — 📄 button → "Try a sample" |

## What is verified

For every attestation (`GET /v1/attestation/report?model=…&nonce=<32 random bytes>&signing_algo=ecdsa`):

1. **Intel TDX quote is genuine** — verified with `@phala/dcap-qvl-node` against Intel's collateral (`UpToDate`/`OutOfDate` accepted, same rule as the official verifier).
2. **Signing key is bound to the enclave** — `report_data[0..32]` equals the attested signing address.
3. **Report is fresh** — `report_data[32..64]` equals *our* nonce.
4. **NVIDIA GPU in confidential-computing mode** — GPU evidence carries our nonce; NVIDIA NRAS verdict is `true`.
5. **Running code matches the attested manifest** — SHA-256 of the docker compose equals `mr_config_id` from the verified quote (informational).

For every answer (`GET /v1/signature/{chat_id}`):

6. SHA-256 of our exact request body and of the exact streamed response match the signed text.
7. The ECDSA signature recovers to the signing address.
8. That address belongs to an attestation we just verified (if another replica answered, that exact key is attested with a new nonce).

## Nothing is kept server-side

- No database, no files, no logs of content. Questions, answers, documents and voice recordings exist only in local variables of one request handler and are gone when the response ends.
- No answer cache, no TTS cache, no conversation history on the server — the browser keeps the last few turns and sends them with the next question.
- Documents are read **in the browser** (PDF via pdf.js) and sent only together with the question.
- Kept in memory, without user content: salted hashes of IPs with timestamps (rate limiting; the salt changes on every restart), aggregate token/cost counters for the owner's `/dev.html`, and the latest attestation result (hardware evidence only).
- Web search is **off** by default because it would send a query outside the TEE (`ALLOW_WEB_SEARCH=1` to enable). Tools that stay on read only public NEAR docs and public network data and never receive the user's document.

## Run it

```bash
cp .env.example .env        # put your NEAR_AI_KEY inside
npm install
npm run verify              # minimal script: one completion + attestation + signature check
npm start                   # http://localhost:3000
```

Docker / Northflank: the included `Dockerfile` builds everything; set `NEAR_AI_KEY` as a secret environment variable.

### Example output of `npm run verify`

```
1) Model: deepseek-ai/DeepSeek-V4.1-Flash-1017  (from N models on /v1/models)
2) Completion id: chatcmpl-…   Answer: A TEE is …
3) Attestation (fresh random nonce)…
   Model #1 — signing address 0x…
     ✅ Intel TDX quote is genuine
     ✅ Signing key is bound to this enclave
     ✅ Report is fresh (our nonce inside the quote)
     ✅ GPU evidence uses our nonce
     ✅ NVIDIA GPU is in confidential-computing mode
   Attestation overall: ✅ VERIFIED
4) Response signature…
     ✅ Question reached the enclave unchanged
     ✅ Answer left the enclave unchanged
     ✅ Signature is valid
     ✅ Signer is an attested TEE key
```

## Try it as a judge

1. Open the site, tap **Say hi to the knight**.
2. Tap **TEE ✓** in the header → the Verified panel.
3. Tap 📄 → **Bank statement — October 2026** (fictional). The knight lists spending categories and flags the duplicate charge, the 03:47 overseas purchase, the unknown payee and the night ATM withdrawals.
4. Ask by voice: "What looks suspicious in the receipts?" — the line under the answer shows that it was signed inside the TEE.
5. **Prove it is live, not a recording:** in the Verified panel type *your own* number or word under "Check it yourself" and tap **Verify**. The server sends `nonce = sha256(your word)` to NEAR AI; the panel shows that this exact value sits inside `report_data` of the Intel-signed TDX quote (and in the NVIDIA GPU evidence). Nobody could have prepared that report in advance. Download it and re-check with [nearai-cloud-verifier](https://github.com/nearai/nearai-cloud-verifier), or run `echo -n "your word" | sha256sum` to confirm the nonce. Endpoint: `GET /api/attestation/challenge?word=…` (the word is used for that one request and never stored).
6. **See the minimal script's output on the live server:** open `/api/selftest` — it runs exactly `node scripts/verify.js` (one completion + attestation with a fresh nonce + response signature) and prints the result as text. Limited to once a minute.
7. **Don't trust this site at all:** clone the repo, put your own key in `.env`, run `npm run verify` — it talks to NEAR AI directly with its own random nonce.

## What attestation does and does not prove

It proves the **model and the NEAR AI gateway** run inside genuine Intel TDX + NVIDIA confidential-computing hardware and that each answer was signed there. Our own Node relay (on Northflank) is **not** in a TEE: the "nothing is stored" claim for it rests on this open-source code, not on cryptography.

## Files

- `server.js` — API, streaming answers, proofs, Whisper, no storage
- `lib/attest.js` — attestation + signature verification
- `scripts/verify.js` — minimal end-to-end check
- `tools.js` — optional lookups (NEAR docs, network status)
- `public/` — the knight (video animation, voice, Verified panel), `public/samples/` — fictional documents
- `README.ru.md` — deployment guide in Russian
