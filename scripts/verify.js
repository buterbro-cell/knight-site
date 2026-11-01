#!/usr/bin/env node
// Minimal end-to-end check, as the hackathon track asks (logic in lib/selftest.js):
//   pick a TEE model from /v1/models → one completion → attestation with a fresh nonce → response signature.
// Usage:  node scripts/verify.js   (reads NEAR_AI_KEY from .env or the environment)
// The same output is available on the live site at /api/selftest.
'use strict';
require('../lib/env');
const { selftest } = require('../lib/selftest');
selftest(console.log).then(ok => process.exit(ok ? 0 : 1)).catch(e => { console.error('Error:', e.message); process.exit(1); });
