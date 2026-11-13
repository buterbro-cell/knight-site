# AGENTS.md — for AI reviewers

SECRA is a voice assistant that a business adds to its website with one line of code (`public/widget.js`). Visitors talk to it or show it a document or a photo of one. Everything that touches the visitor's data runs in TEEs, and the assistant proves it on screen. Tracks: Privacy & Private AI, Open Innovation, Agent Economy (the assistant's own agent wallet pays, buys on schedule and buys services through NEAR Intents).

## How to check quickly

| Without a key | `npm install && npm test` (unit tests: attestation and signature checks, input handling, rate limits, no-storage guarantees). CI: `.github/workflows/test.yml`. |
|---|---|
| Live | Deployed on Phala Cloud (Intel TDX): see the links table at the top of `README.md`. `GET /api/health` (state, no content), `GET /api/selftest` (minimal end-to-end check run live), `GET /api/attestation/challenge?word=<anything>` (your own nonce inside the Intel quote). |
| With your own NEAR AI key | `cp .env.example .env`, set `NEAR_AI_KEY`, then `npm run verify`. It calls NEAR AI directly, not through our server. |

## Claims → proof

| Claim | Code | Test / evidence |
|---|---|---|
| Answers come from a TEE-hosted model on NEAR AI Cloud, chosen from `/v1/models` | `server.js` `checkModel()`, `MODEL_PREFS`; `lib/selftest.js` | `/api/selftest` output; `docs/verify-output.txt` |
| Attestation: Intel TDX quote verified (dcap-qvl), signing key bound in `report_data[0..32]`, fresh nonce in `report_data[32..64]`, NVIDIA GPU verdict from NRAS, compose hash = `mr_config_id` | `lib/attest.js` `verifyOne()`, `reportDataMatches()`, `composeMatches()` | `test/attest.test.js` |
| Each answer is signed in the enclave; the request/response sha256 and the signer are checked against the attested key | `lib/attest.js` `signedTextChecks()`, `verifyResponseSignature()`; `server.js` `proveAnswer()` | `test/attest.test.js` (edited answer, edited question, forged signature, non-attested signer) |
| A real signed answer can be re-verified offline (signature, hashes, Intel quotes with saved collateral, binding, nonce, compose) | `scripts/verify-bundle.js`, `lib/bundle.js`; `/api/selftest?bundle=1` | `evidence/*.json`; `test/bundle.test.js` (verifies, and tampering fails); CI step |
| A visitor can choose the nonce (sha256 of their word), so the report cannot be pre-recorded | `server.js` `/api/attestation/challenge` | live endpoint; `test/attest.test.js` (replayed report fails) |
| Our relay server also runs in Intel TDX (Phala dstack) and attests itself | `lib/selfattest.js`; `server.js` `/api/attestation/self`; `docker-compose.phala.yml` pins the image digest built by `.github/workflows/image.yml` | Phala Trust Center link in `README.md`; `/api/health` → `relayInTee` |
| Nothing about conversations is stored: no database, no content in logs; the only file is the owner's standing orders (DCA / limit orders), AES-256-GCM with a TEE-derived key | `server.js`, `lib/dca.js` | `test/privacy.test.js`, `test/dca.test.js` |
| Rate limiting keeps only salted IP hashes and timestamps; salt is new per process | `lib/ratelimit.js` | `test/ratelimit.test.js` |
| Documents and photos are attached to the current question only, treated as data (anti-prompt-injection rule), images limited to jpeg/png/webp ≤ 1.4 MB | `lib/input.js` | `test/input.test.js` |
| Photos are read by the TEE model itself (DeepSeek V4.1 Flash, native vision) and shrunk in the browser first | `public/app.js` `imageData()`, `lib/input.js` | manual: demo → Document → "Photo of a blood test" |
| PDFs are read in the browser with pdf.js served from our origin, with no third-party CDN | `public/app.js` `pdfText()`, `public/vendor/pdfjs/` | — |
| Voice on the web and phone: speech-to-text by Whisper in a NEAR AI TEE; the browser's speech services are never used; spoken answers only by Piper in our TEE relay (no browser voices; text if Piper is down) | `server.js` `transcribe()`, `/api/tts`; `public/app.js` `speak()` (no `webkitSpeechRecognition`, no `speechSynthesis.speak` call path) | — |
| TV app: the TV holds no wallet; a QR pairs it with the owner's phone, which signs the 24-hour agent session and hands it over (in memory, single use, 10 min). On the TV, speech is recognised by the TV's own voice input, outside our TEE | `lib/pair.js`, `server.js` `/api/pair/*`, `public/app.js` `tvPair()`, `android/` | `test/pair.test.js` |
| The host page cannot read the conversation (iframe from our origin, no `postMessage` to the host) | `public/widget.js`, `public/app.js` | — |
| Official-install badge: iframe referrer vs the business profile's domains | `public/app.js` `showOfficial()`, `public/biz/*.json` | — |
| Business profiles are public JSON (the exact instructions the assistant follows) and run without tools | `public/biz/clinic.json`, `public/biz/bank.json`; `server.js` (`tools: false` for profiles) | — |

| Payments are prepared by the model but only sent after the visitor's wallet signs; never offered with a document attached; $50 cap | `server.js` (`PAY_TOOL`, `payTool`), `lib/pay.js` `buildQuote()`, `public/wallet.js` `depositActions()` | `test/pay.test.js`, `test/wallet.test.js` |
| Payments are confidential NEAR Intents quotes (payer and payout unlinkable) | `lib/pay.js` (`confidentiality: 'advanced'`, partner key in `X-API-Key`) | `/api/pay/probe` (dry quotes) |
| Paid private review: answer unlocked only after the server verifies SUCCESS to the clinic's address, one payment per document; samples free | `server.js` paid-review gate, `lib/pay.js` `checkPaid()`, `consumeDeposit()` | `test/pay.test.js` |
| Full mode: agent wallet key only inside the TEE; owner-only sessions (NEP-413, full-access key checked on chain); $10/action, $25/day | `lib/agentwallet.js` | `test/agentwallet.test.js` |
| Agent voice payments only after the recipient is confirmed (repeated spelled-out + "yes", a typed address, or a saved contact); misheard `.near` suffixes fixed; recipients must exist on chain | `server.js` `recipientConfirmed()`, `lib/pay.js` `normalizeRecipient()`, `recipientExists()` | `test/pay.test.js` |
| Recurring purchases and limit orders from the agent wallet, through the same limits | `lib/dca.js`, `server.js` (`schedule_purchase`) | `test/dca.test.js` |
| NEAR transactions and NEP-413 without SDKs, byte-identical to near-api-js | `lib/near.js` | `test/near-tx.test.js` (CI), `test/near.test.js` |

## Not built (stated as such in README → Not built yet)

Agent-to-agent hiring; an on-chain policy contract for the agent wallet; notifications; the phone as the TV's microphone; store apps; bring-your-own relay.

## Known limits

The development host (Northflank) is not a TEE; only the Phala deployment gives the full chain. TEE hardware bugs and side channels are out of scope. More in `docs/THREAT_MODEL.md`. All businesses, people and documents in this repository are fictional.
