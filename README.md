# Sir Near — a verifiably private voice assistant for any website

**Track: Privacy & Private AI (`privacy`)** · NEAR AI Cloud · TEE · Attestation

## The problem

Clinics, banks, law firms and insurers want an AI assistant on their website. Today that means sending every customer conversation to an AI vendor that logs it — a compliance risk for the business and a reason for customers to hold back: nobody tells a website chatbot about their symptoms, debts or legal trouble if it might be recorded.

## What we built

**Sir Near** is a voice assistant with a live animated character that a business adds to its website with **one line of code**. Visitors talk to it by voice or show it a document (test results, an invoice, a contract), and it answers out loud. Every model that touches the visitor's data runs inside Trusted Execution Environments on **NEAR AI Cloud** — and the assistant **proves it** on screen. The business itself never sees the conversation.

- 🎙️ **Voice → text:** Whisper Large v3, hosted by NEAR AI inside a TEE (Private TEE).
- 🧠 **Thinking:** `deepseek-ai/DeepSeek-V4.1-Flash-1017`, hosted by NEAR AI inside a TEE (Private TEE).
- 🔊 **Text → voice:** on the visitor's device (optional server voice: Piper, see `Dockerfile`).
- 🛡️ **Verified panel:** the attestation report is fetched with a **fresh random nonce** (or the visitor's own number) and verified the way the NEAR AI verification docs describe. The panel lists every check.
- 🔏 **Every answer is signed** inside the enclave; the app checks the signature and that the signer is an attested TEE key.
- 🗑️ **Nothing is stored server-side.** See below.

## Add it to a website — one line

```html
<script src="https://<assistant-host>/widget.js" data-biz="clinic" data-lang="en" async></script>
```

`public/widget.js` puts a round button in the corner. Tapping it opens the assistant in an iframe served from the assistant's own origin, so **the host page has no access to the conversation** — not the voice, not the documents, not the answers.

Each business is one public JSON file, `public/biz/<id>.json`: name, greeting, sample documents and the instructions the assistant follows. Being public is deliberate — anyone can read exactly what the assistant was told. Business profiles do not use outside tools, so nothing leaves the TEE model call.

**Live demo business:** `/demo/clinic.html` — *Daisy Clinic*, a fictional family clinic. Ask which doctor you need, or tap 📄 → *Blood test results* / *Clinic invoice* (fictional). The main page `/` is the same assistant as the NEAR knight, without a business profile.

## Requirements → where they are

| Requirement | Where |
|---|---|
| OpenAI-compatible API, base URL `https://cloud-api.near.ai/v1`, key in `.env` | `lib/env.js`, `.env.example`, `server.js` (`API_URL`) |
| Choose a TEE-hosted model from the models endpoint | `server.js → checkModel()` reads `/v1/models`, prefers NEAR-hosted *Private TEE* models (`MODEL_PREFS`), never *Incognito* ones; same in `scripts/verify.js` |
| Fetch attestation with a fresh random nonce and verify it as the docs describe | `lib/attest.js → attest()` (port of the official `nearai-cloud-verifier`, see checks below) |
| Show a "Verified" panel listing what was checked | `public/index.html` → **TEE ✓** button in the header and the line under each answer |
| Keep nothing server-side after a response returns | header comment of `server.js`, `/api/health → storesUserData:false`, section below |
| Fictional sample documents | `public/samples/` (blood test, clinic invoice, bank statement, receipts, lease) — 📄 button in the assistant |

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

**In a TEE (Phala Cloud / dstack):** GitHub Actions (`.github/workflows/image.yml`) publishes the image to `ghcr.io/buterbro-cell/knight-site`; `docker-compose.phala.yml` runs it in an Intel TDX confidential VM with the dstack socket mounted. The server then attests **itself** (`lib/selfattest.js`, `GET /api/attestation/self`): a fresh Intel TDX quote with our nonce in `report_data`, verified with dcap-qvl, plus the app id and compose hash, which anyone can check on `https://trust.phala.com/app/<app_id>`. The Verified panel shows this as "Our relay server".

### Real output (captured live on the deployed server via `/api/selftest`, Nov 1 2026)

```
$ node scripts/verify.js   (run live on this server, 2026-11-01T23:40:31.963Z)

Libraries: { dcap: true, ethers: true }

1) Model: deepseek-ai/DeepSeek-V4.1-Flash-1017  (from 64 models on /v1/models)

2) Completion id: chatcmpl-2163a327-174d-4c4c-b26e-4d183f17a32d
   Answer: A TEE (Trusted Execution Environment) is a secure, isolated processing area that protects sensitive code and data from the main operating system and other applications.

3) Attestation (fresh random nonce)…
   nonce: 7039cfc3a00b62a69ce1d816ff1fbe27a08ed6d39e40a6358531ce0d87950b5b

   Gateway — signing address 0xb98a789cdc4817275f5155593ba73ef2a957e779
     ✅ Intel TDX quote is genuine  (dcap-qvl status: UpToDate)
     ✅ Signing key is bound to this enclave  (report_data[0..32] = signing address 0xb98a789cdc4817275f5155593ba73ef2a957e779)
     ✅ Report is fresh (our nonce inside the quote)  (report_data[32..64] = 7039cfc3a00b62a6…)
     ✅ Server echoed our nonce  [info]
     ✅ Running code matches the attested manifest  (compose sha256 f571e5dafe8f96ba… = mr_config_id)  [info]

   Model #1 — signing address 0xfe0071895500a9755c18044948ab4f4e1a7f337e
     ✅ Intel TDX quote is genuine  (dcap-qvl status: UpToDate)
     ✅ Signing key is bound to this enclave  (report_data[0..32] = signing address 0xfe0071895500a9755c18044948ab4f4e1a7f337e)
     ✅ Report is fresh (our nonce inside the quote)  (report_data[32..64] = 7039cfc3a00b62a6…)
     ✅ Server echoed our nonce  [info]
     ✅ Running code matches the attested manifest  (compose sha256 ae66f844658a7aee… = mr_config_id)  [info]
     ✅ GPU evidence uses our nonce
     ✅ NVIDIA GPU is in confidential-computing mode  (NVIDIA NRAS verdict: true)

   Attestation overall: ✅ VERIFIED  (2054 ms)

4) Response signature…
     ✅ Question reached the enclave unchanged  (SHA-256 of our request vs. the signed hash)
     ✅ Answer left the enclave unchanged  (SHA-256 of the received answer vs. the signed hash)
     ✅ Signature is valid  (signer 0xfe0071895500a9755c18044948ab4f4e1a7f337e)
     ✅ Signer is an attested TEE key  (matches a verified enclave)

   Signature overall: ✅

Nothing was stored: this script only printed results.
```

## Try it as a judge

1. Open `/demo/clinic.html` → tap **Private assistant** in the corner → **Talk to the assistant**.
2. Tap 📄 → **Blood test results** (fictional patient). The assistant names the values out of range (hemoglobin, ferritin, vitamin D, LDL, HbA1c, CRP), explains them simply and suggests which of the clinic's doctors to see. Try 📄 → **Clinic invoice**: it finds the duplicated biochemistry panel, the unexplained "priority processing fee" and the insurance amount that does not add up.
3. Tap **TEE ✓** in the assistant's header → the Verified panel. The line under each answer shows that it was signed inside the TEE.
4. Ask by voice: "Which doctor should I see for chest pain?" — urgent symptoms are redirected to emergency services first.
5. **Prove it is live, not a recording:** in the Verified panel type *your own* number or word under "Check it yourself" and tap **Verify**. The server sends `nonce = sha256(your word)` to NEAR AI; the panel shows that this exact value sits inside `report_data` of the Intel-signed TDX quote (and in the NVIDIA GPU evidence). Nobody could have prepared that report in advance. Download it and re-check with [nearai-cloud-verifier](https://github.com/nearai/nearai-cloud-verifier), or run `echo -n "your word" | sha256sum` to confirm the nonce. Endpoint: `GET /api/attestation/challenge?word=…` (the word is used for that one request and never stored).
6. **See the minimal script's output on the live server:** open `/api/selftest` — it runs exactly `node scripts/verify.js` (one completion + attestation with a fresh nonce + response signature) and prints the result as text. Limited to once a minute.
7. **Don't trust this site at all:** clone the repo, put your own key in `.env`, run `npm run verify` — it talks to NEAR AI directly with its own random nonce.

## What attestation does and does not prove

The whole path is now attested:

| Hop | Runs in | Proof |
|---|---|---|
| Our relay server (this repo) | Intel TDX confidential VM on Phala Cloud (dstack) | "Our relay server" block in the Verified panel: fresh TDX quote with our nonce; app id + compose hash; public report at [trust.phala.com/app/a8fa8d779fbe978b9ed7ffda75e01abc952f7ee9](https://trust.phala.com/app/a8fa8d779fbe978b9ed7ffda75e01abc952f7ee9) |
| NEAR AI gateway | TEE | gateway attestation in the panel |
| Model (DeepSeek V4.1 Flash) and Whisper | Intel TDX + NVIDIA confidential computing | model attestation + signature of every answer |

What ties the relay's attestation to *this source code*: `docker-compose.phala.yml` pins the image **by digest**; the image is built by GitHub Actions (`.github/workflows/image.yml`) from a public commit with build provenance; the compose hash is measured into RTMR3 and shown on the Trust Center page. The relay verifies its own quote in the panel for convenience — the independent check is the Trust Center report or the downloadable raw quote (`/api/attestation/self?raw=1`), verifiable with `dcap-qvl` or dstack-verifier.

Not covered: the visitor's own device, and a malicious host page that draws a *fake* assistant instead of embedding ours (it cannot read the real one — it is a cross-origin iframe). The real assistant always shows its own origin and can be opened in a new tab.

## The knight

A rigged 3D character (`public/3d/models/knight-anim.glb`, 20 Mixamo animations) rendered with three.js by `public/knight3d.js`: idle / talking / thinking / waving states, a drawn face whose mouth moves only while the voice plays, and Talking-Tom-style touch — tap head, body or legs for different reactions, tap 5 times quickly and he falls over and gets up dizzy, rub him to tickle. Browsers without WebGL2 (or `?video=1`) get the previous video knight.

## Files

- `server.js` — API, streaming answers, proofs, Whisper, no storage
- `lib/attest.js` — attestation + signature verification
- `scripts/verify.js` — minimal end-to-end check
- `tools.js` — optional lookups (NEAR docs, network status)
- `public/index.html` — the assistant (voice, Verified panel, documents); `public/knight3d.js` — the 3D character
- `public/widget.js` — the one-line embed for business websites; `public/biz/*.json` — business profiles
- `public/demo/clinic.html` — fictional clinic website with the assistant embedded
- `public/samples/` — fictional documents
- `README.ru.md` — deployment guide in Russian
