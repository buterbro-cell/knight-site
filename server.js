// Sir Near — a voice AI knight on NEAR AI Cloud.
//
// PRIVACY BY DESIGN — this server keeps NOTHING after a response returns:
//   • questions, answers, documents and voice recordings live only in local variables of the
//     request handler and are dropped when the response ends (no database, no files, no logs of content);
//   • no answer cache, no TTS cache, no conversation history (the browser keeps the history and
//     sends the last few turns with each question);
//   • rate limiting keeps only salted hashes of IP addresses with timestamps (needed to stop abuse),
//     the /dev page keeps only aggregate counters (tokens, cost) — never content;
//   • attestation results are kept briefly in memory: they contain only hardware evidence, no user data.
// Inference runs on a TEE-hosted model ("Private TEE" on near.ai/models), and every answer is
// checked: the TEE signature is verified and the signer must be an attested enclave key.
'use strict';
require('./lib/env');                       // loads NEAR_AI_KEY etc. from .env if present
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { attest, verifyResponseSignature, libsReady } = require('./lib/attest');
const { selftest } = require('./lib/selftest');
const { parseChatInput } = require('./lib/input');
const { createLimiter } = require('./lib/ratelimit');
const relay = require('./lib/selfattest');   // attestation of this server when it runs in a TEE (Phala / dstack)
const util = require('util');

// ---------- Settings ----------
const PORT = Number(process.env.PORT || 3000);
const KEY = process.env.NEAR_AI_KEY || '';
const BASE = (process.env.NEAR_AI_BASE || 'https://cloud-api.near.ai').replace(/\/v1\/?$/, '').replace(/\/$/, '');
const API_URL = process.env.API_URL || `${BASE}/v1/chat/completions`;
// DeepSeek V4.1 Flash 1017 is "Private TEE" (hosted by NEAR AI inside TEEs). Repeated system prompt is
// almost free thanks to prompt caching ($0.006 per 1M cached tokens).
let MODEL = process.env.MODEL || 'deepseek-ai/DeepSeek-V4.1-Flash-1017';
// Fallbacks — only models NEAR AI hosts itself in TEEs (not "Incognito" models of OpenAI/Anthropic/Google)
const MODEL_PREFS = ['deepseek-ai/DeepSeek-V4.1-Flash-1017', 'Qwen3.8-27B', 'GLM-5.3-Flash', 'Qwen3.6-35B-A3B', 'Qwen3-VL-30B-A3B'];
const DEV_KEY = process.env.DEV_KEY || '';
const CHAR_NAME = process.env.CHAR_NAME || 'Сэр Ниар';
const PER_USER_LIMIT = Number(process.env.PER_USER_LIMIT || 40);
const PER_USER_WINDOW_MIN = Number(process.env.PER_USER_WINDOW_MIN || 60);
const DAILY_LIMIT = Number(process.env.DAILY_LIMIT || 3000);
const MAX_QUESTION_CHARS = 600;
const MAX_DOC_CHARS = 20000;
const MAX_ANSWER_TOKENS = 900;
const TRUST_PROXY = process.env.TRUST_PROXY === '1';
const PUBLIC_DIR = path.join(__dirname, 'public');
const KNOWLEDGE = fs.readFileSync(path.join(__dirname, 'knowledge.md'), 'utf8');
const { TOOLS, runTool, webSearchEnabled, loadDocIndex } = require('./tools');
let toolsOn = process.env.USE_TOOLS !== '0';
const MAX_TOOL_ROUNDS = 3;
// Control marks inside the text stream to the browser
const SEARCH_MARK = '\u0007';   // "the knight is looking something up"
const PROOF_MARK = '\u0002';    // followed by JSON with the signature check of this answer

// Prices per 1M tokens [input, output, cached input] from near.ai/models — used only for the /dev page
const PRICES = {
  'deepseek-v4.1-flash-1017': [0.3, 1.2, 0.006], 'qwen3.8-27b': [0.04, 1.35, 0.018],
  'glm-5.3-flash': [0.08, 0.5, 0.012], 'qwen3.6-35b-a3b': [0.17, 1.1, 0.056], 'qwen3-vl-30b-a3b': [0.15, 0.55, 0.03],
};
const priceFor = m => { const k = m.toLowerCase(); let best = null; for (const key in PRICES) if (k.includes(key) && (!best || key.length > best.length)) best = key; return best ? PRICES[best] : null; };

// ---------- Aggregate counters for /dev (numbers only, never content) ----------
const stats = { since: new Date().toISOString(), answers: 0, errors: 0, inTokens: 0, cachedTokens: 0, outTokens: 0, costUsd: 0, signedOk: 0, signedFail: 0, days: {}, last: [] };
function recordUsage(usage, ms, firstMs) {
  const p = priceFor(MODEL);
  const inT = usage?.prompt_tokens || 0, outT = usage?.completion_tokens || 0;
  const cached = usage?.prompt_tokens_details?.cached_tokens || usage?.prompt_cache_hit_tokens || 0;
  const cost = p ? ((inT - cached) * p[0] + cached * p[2] + outT * p[1]) / 1e6 : 0;
  const day = new Date().toISOString().slice(0, 10);
  const d = stats.days[day] || (stats.days[day] = { answers: 0, costUsd: 0, inTokens: 0, outTokens: 0 });
  stats.answers++; stats.inTokens += inT; stats.cachedTokens += cached; stats.outTokens += outT; stats.costUsd += cost;
  d.answers++; d.costUsd += cost; d.inTokens += inT; d.outTokens += outT;
  stats.last.unshift({ time: new Date().toISOString(), model: MODEL, inTokens: inT, cachedTokens: cached, outTokens: outT, costUsd: +cost.toFixed(6), totalMs: ms, firstWordMs: firstMs });
  stats.last.length = Math.min(stats.last.length, 30);
  const days = Object.keys(stats.days).sort(); while (days.length > 31) delete stats.days[days.shift()];
}

// ---------- Prompt ----------
const SYSTEM_PROMPT = `Ты — ${CHAR_NAME}, весёлый, добрый и умный рыцарь-талисман сайта про NEAR. Ты говоришь голосом, поэтому:
- отвечай коротко и по делу: обычно 2–5 предложений, как в живом разговоре; если вопрос сложный — можно чуть длиннее;
- никакой разметки, списков, эмодзи и спецсимволов — только обычный текст для озвучки;
- отвечай на языке вопроса (русский — по-русски, английский — по-английски);
- объясняй сложное простыми словами, можно с лёгким рыцарским юмором, но без перебора.

Ты помогаешь с любыми нормальными вопросами, а не только про NEAR: программирование, учёба, работа, идеи, жизненные ситуации.
- Про NEAR, NEAR AI, TEE и приватность в первую очередь опирайся на шпаргалку ниже. Если в ней нет нужного факта, отвечай из своих знаний, но свежие цифры, даты и цены не выдумывай.
- Про программирование объясняй по шагам словами. Код целиком голосом не зачитывай — опиши суть и главные команды коротко.
- Если человеку тяжело — ответь тепло и по-человечески, поддержи, предложи один-два конкретных шага. Если звучит серьёзная опасность для здоровья или жизни — мягко посоветуй обратиться к близким или к специалисту.
- Не давай финансовых советов и не предсказывай цены токенов.
- Если просят что-то вредное или незаконное — вежливо откажись.

Документы пользователя:
- Если пользователь приложил документ (выписку, чеки, счёт, договор), разбери именно его. Для выписок и чеков: назови главные категории трат с суммами и итог, затем то, что выглядит необычно — повторные списания, очень крупные или ночные операции, незнакомые получатели, зарубежные списания, выросшие подписки. Говори конкретно: дата, сумма, получатель. 4–8 предложений.
- Не придумывай операций, которых нет в документе. Документ обрабатывается приватно в защищённой среде и не сохраняется — можешь так и сказать, если спросят.

Как искать информацию:
- Сначала смотри шпаргалку ниже — если ответ там есть, отвечай сразу, без поиска.
- Если ответа нет или нужны свежие данные (цена NEAR, текущие цифры сети, точные инструкции из документации) — найди и проверь с помощью инструментов: near_live для цены и состояния сети, near_docs_search и затем read_page для документации NEAR и NEAR AI${webSearchEnabled ? ', web_search для новостей и всего остального' : ''}. Никогда не передавай в инструменты личные данные пользователя или текст его документа.
- Ищи коротко: один-два вызова, максимум три. В ответе голосом коротко назови источник.

`;
const SYSTEM_PROMPT_KB = `ШПАРГАЛКА ПРО NEAR:\n${KNOWLEDGE}`;

// ---------- Business profiles: one JSON file per business in public/biz/ ----------
// A business that embeds the assistant gets its own name, greeting, sample documents and instructions.
// The files are public on purpose: anyone can read exactly what the assistant was told.
const PROFILES = {};
try {
  for (const f of fs.readdirSync(path.join(__dirname, 'public', 'biz'))) {
    if (!f.endsWith('.json')) continue;
    const p = JSON.parse(fs.readFileSync(path.join(__dirname, 'public', 'biz', f), 'utf8'));
    if (p.id && p.prompt) PROFILES[p.id] = p;
  }
} catch (e) { console.error('Profiles:', e.message); }

// ---------- Abuse protection (salted IP hashes + timestamps only, see lib/ratelimit.js) ----------
// Behind a proxy (Phala dstack gateway, Northflank) the visitor's address comes in a forwarding header
const clientIp = req => (TRUST_PROXY && ((req.headers['x-forwarded-for'] || '').split(',')[0].trim() || String(req.headers['x-real-ip'] || '').trim())) || req.socket.remoteAddress;
// Separate budgets per action, so voice playback or re-checking the proof never eats the question quota.
// Per visitor per window: questions PER_USER_LIMIT, speech-to-text 2x, voice playback 15x (one request per sentence), proof checks 10.
const BUDGET = { chat: PER_USER_LIMIT, stt: PER_USER_LIMIT * 2, tts: PER_USER_LIMIT * 15, verify: 10, selftest: 6 };
const limiter = createLimiter({ budget: BUDGET, defaultLimit: PER_USER_LIMIT, windowMin: PER_USER_WINDOW_MIN, dailyLimit: DAILY_LIMIT });
setInterval(limiter.sweep, 60e3).unref();
const allow = (req, kind = 'chat') => limiter.allow(clientIp(req), kind);

// Concurrency limit towards NEAR AI
const MAX_PARALLEL = Number(process.env.MAX_PARALLEL || 100);
let active = 0; const queue = [];
const slot = () => new Promise(res => { if (active < MAX_PARALLEL) { active++; res(); } else queue.push(res); });
const release = () => { const next = queue.shift(); next ? next() : active--; };

// ---------- Model selection from the models endpoint ----------
let lastReject = null, lastError = null, modelChecked = false, availableModels = [], sttModel = null;
async function checkModel() {
  if (!KEY) return;
  try {
    const r = await fetch(`${BASE}/v1/models`, { headers: { Authorization: `Bearer ${KEY}` } });
    if (!r.ok) { lastError = `models endpoint: HTTP ${r.status}`; console.error(lastError); return; }
    const data = await r.json();
    availableModels = (data.data || data.models || []).map(m => m.id || m.name || m).filter(x => typeof x === 'string');
    if (!availableModels.length) return;
    modelChecked = true;
    // Speech-to-text: Whisper is hosted by NEAR AI inside a TEE as well
    sttModel = process.env.STT_MODEL || availableModels.find(m => /whisper/i.test(m)) || null;
    if (!availableModels.includes(MODEL)) {
      const low = availableModels.map(x => x.toLowerCase());
      for (const pref of MODEL_PREFS) {
        const pl = pref.toLowerCase();
        let i = low.indexOf(pl);
        if (i < 0) i = low.findIndex(x => x.includes(pl) && !x.includes('abliterated'));
        if (i >= 0) { console.log(`Model ${MODEL} not available, using ${availableModels[i]}`); MODEL = availableModels[i]; break; }
      }
    }
    console.log('Model:', MODEL, '| STT:', sttModel || 'none (browser speech recognition)');
  } catch (e) { lastError = 'models endpoint: ' + e.message; console.error(lastError); }
}

// ---------- Attestation (hardware evidence only — no user data) ----------
let attestation = null, attesting = null;
let selftestBusy = false, selftestAt = 0, bundleRun = null, lastBundle = null, lastBundleError = '';
let relayAtt = null;   // latest attestation of this server (hardware evidence only)
async function runAttestation(signingAddress) {
  if (attesting && !signingAddress) return attesting;
  const p = (async () => {
    try {
      const a = await attest(MODEL, signingAddress ? { signingAddress } : {});
      if (!signingAddress || a.ok) attestation = a;
      console.log(`Attestation ${a.ok ? 'VERIFIED' : 'NOT verified'} for ${MODEL} (${a.ms} ms)`);
      return a;
    } catch (e) {
      console.error('Attestation error:', e.message);
      const a = { ok: false, model: MODEL, checkedAt: new Date().toISOString(), error: e.message, gateway: null, models: [], signers: [] };
      if (!signingAddress) attestation = a;
      return a;
    }
  })();
  if (!signingAddress) { attesting = p; p.finally(() => { attesting = null; }); }
  return p;
}
const attestationFresh = () => attestation && attestation.ok && Date.now() - Date.parse(attestation.checkedAt) < 10 * 60e3;

// Verify the signature of one answer; the signer must belong to an attested enclave
async function proveAnswer({ chatId, requestBody, responseText }) {
  if (!chatId) return { ok: false, checks: [{ id: 'sig', ok: false, label: 'Response signed inside the TEE', detail: 'no chat id' }] };
  if (!attestationFresh()) await runAttestation();
  let signers = attestation?.signers || [];
  let res = await verifyResponseSignature({ chatId, model: MODEL, requestBody, responseText, attestedSigners: signers });
  if (!res.ok && res.signer && !signers.includes(res.signer)) {
    // Another replica answered: attest exactly that signing key with a fresh nonce
    const a = await runAttestation(res.signer);
    if (a.ok) res = await verifyResponseSignature({ chatId, model: MODEL, requestBody, responseText, attestedSigners: a.signers });
  }
  res.ok ? stats.signedOk++ : stats.signedFail++;
  return { ok: res.ok, signer: res.signer, checks: res.checks, evidence: res.evidence, model: MODEL, attestedAt: attestation?.checkedAt };
}

// ---------- Streaming answer with tools and proof ----------
async function askModelStream(messages, res, { system = SYSTEM_PROMPT + SYSTEM_PROMPT_KB, tools = true, maxTokens = MAX_ANSWER_TOKENS } = {}) {
  await slot();
  let started = false, firstMs = null;
  const usageSum = { prompt_tokens: 0, completion_tokens: 0, prompt_tokens_details: { cached_tokens: 0 } };
  const t0 = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 90e3);
  res.on('close', () => { if (!res.writableEnded) ctrl.abort(); });
  const begin = () => { if (!started) { started = true; res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' }); } };
  let full = '', final = null, finish = null, thinkChars = 0;
  try {
    const convo = [{ role: 'system', content: system }, ...messages];
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const withTools = tools && toolsOn && round < MAX_TOOL_ROUNDS;
      const requestBody = JSON.stringify({
        model: MODEL, messages: convo,
        max_tokens: maxTokens, temperature: 0.6, stream: true, stream_options: { include_usage: true },
        ...(withTools ? { tools: TOOLS, tool_choice: 'auto' } : {}),
      });
      const r = await fetch(API_URL, { method: 'POST', signal: ctrl.signal, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` }, body: requestBody });
      if (!r.ok) {
        const t = (await r.text()).slice(0, 300);
        if (withTools && r.status === 400 && /tool|function/i.test(t)) { console.log('Model does not support tools, disabling'); toolsOn = false; round--; continue; }
        if (r.status === 404 || /model/i.test(t)) await checkModel();
        throw new Error(`NEAR AI HTTP ${r.status}: ${t}`);
      }
      let buf = '', raw = '', emitted = 0, rawResponse = '', chatId = null;
      const calls = [];
      const visible = () => {   // hide <think>…</think> of reasoning models and markdown
        let v = raw.replace(/<think>[\s\S]*?<\/think>/g, '');
        const open = v.indexOf('<think>'); if (open >= 0) v = v.slice(0, open);
        const lt = v.lastIndexOf('<'); if (lt >= 0 && v.length - lt < 8 && '<think>'.startsWith(v.slice(lt))) v = v.slice(0, lt);
        return v.replace(/[*_#`>]+/g, '').replace(/^\s+/, '');
      };
      const out = delta => {
        raw += delta;
        const v = visible();
        if (v.length <= emitted) return;
        const t = v.slice(emitted); emitted = v.length;
        begin(); if (firstMs == null) firstMs = Date.now() - t0;
        full += t; res.write(t);
      };
      const dec = new TextDecoder();
      for await (const chunk of r.body) {
        const s = dec.decode(chunk, { stream: true });
        rawResponse += s;                         // exact bytes, needed to check the TEE signature
        buf += s;
        let nl;
        while ((nl = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (data === '[DONE]') continue;
          let j; try { j = JSON.parse(data); } catch { continue; }
          if (j.id && !chatId) chatId = j.id;
          if (j.usage) { usageSum.prompt_tokens += j.usage.prompt_tokens || 0; usageSum.completion_tokens += j.usage.completion_tokens || 0; usageSum.prompt_tokens_details.cached_tokens += j.usage.prompt_tokens_details?.cached_tokens || j.usage.prompt_cache_hit_tokens || 0; }
          const d = j.choices && j.choices[0] && j.choices[0].delta;
          if (j.choices && j.choices[0] && j.choices[0].finish_reason) finish = j.choices[0].finish_reason;
          if (!d) continue;
          if (d.reasoning_content || d.reasoning) thinkChars += String(d.reasoning_content || d.reasoning).length;
          if (d.content) out(d.content);
          for (const tc of d.tool_calls || []) {
            const i = tc.index ?? 0;
            const c = calls[i] || (calls[i] = { id: '', type: 'function', function: { name: '', arguments: '' } });
            if (tc.id) c.id = tc.id;
            if (tc.function?.name) c.function.name += tc.function.name;
            if (tc.function?.arguments) c.function.arguments += tc.function.arguments;
          }
        }
      }
      rawResponse += dec.decode();
      const real = calls.filter(c => c && c.function.name);
      if (!real.length) { final = { chatId, requestBody, responseText: rawResponse }; break; }
      begin(); res.write(SEARCH_MARK);
      real.forEach((c, i) => { if (!c.id) c.id = 'call_' + round + '_' + i; });
      convo.push({ role: 'assistant', content: raw || null, tool_calls: real });
      const results = await Promise.all(real.map(c => runTool(c.function.name, c.function.arguments)));
      real.forEach((c, i) => convo.push({ role: 'tool', tool_call_id: c.id, content: results[i] }));
    }
    if (!full.trim()) throw new Error(`empty answer (finish=${finish}, out_tokens=${usageSum.completion_tokens}, reasoning_chars=${thinkChars}, max_tokens=${maxTokens})`);
    recordUsage(usageSum, Date.now() - t0, firstMs);
    // Proof for this answer: TEE signature + attested signer. Sent after the text, then forgotten.
    if (final) {
      let proof;
      try { proof = await proveAnswer(final); } catch (e) { proof = { ok: false, checks: [{ id: 'sig', ok: false, label: 'Response signed inside the TEE', detail: e.message }] }; }
      try { res.write(PROOF_MARK + JSON.stringify(proof)); } catch {}
    }
    clearTimeout(timer);
    res.end();
  } catch (e) {
    clearTimeout(timer);
    if (started) { try { res.end(); } catch {} }
    e.started = started; throw e;
  } finally { release(); }
  // nothing to return: question, answer and document are dropped here
}

// ---------- Speech-to-text via Whisper in a TEE ----------
async function transcribe(audio, mime, lang) {
  const fd = new FormData();
  const ext = /mp4|aac|m4a/.test(mime) ? 'm4a' : /ogg/.test(mime) ? 'ogg' : /wav/.test(mime) ? 'wav' : 'webm';
  fd.append('file', new Blob([audio], { type: mime || 'audio/webm' }), 'voice.' + ext);
  fd.append('model', sttModel);
  if (lang) fd.append('language', lang);
  const r = await fetch(`${BASE}/v1/audio/transcriptions`, { method: 'POST', headers: { Authorization: `Bearer ${KEY}` }, body: fd, signal: AbortSignal.timeout(45000) });
  const t = await r.text();
  if (!r.ok) throw new Error(`Whisper HTTP ${r.status}: ${t.slice(0, 200)}`);
  try { return (JSON.parse(t).text || '').trim(); } catch { return t.trim(); }
}

// ---------- Optional server voice (Piper) for browsers without speech synthesis. No cache. ----------
const { spawn } = require('child_process');
const PIPER_DIR = process.env.PIPER_DIR || path.join(__dirname, 'piper');
const PIPER_BIN = path.join(PIPER_DIR, 'piper', 'piper');
const VOICES = { ru: path.join(PIPER_DIR, 'ru.onnx'), en: path.join(PIPER_DIR, 'en.onnx') };
const ttsReady = l => fs.existsSync(PIPER_BIN) && fs.existsSync(VOICES[l]);
let ttsActive = 0; const ttsQueue = []; const TTS_PARALLEL = Number(process.env.TTS_PARALLEL || 2);
const ttsSlot = () => new Promise(res => { if (ttsActive < TTS_PARALLEL) { ttsActive++; res(); } else ttsQueue.push(res); });
const ttsRelease = () => { const n = ttsQueue.shift(); n ? n() : ttsActive--; };
async function synthesize(text, l) {
  await ttsSlot();
  try {
    return await new Promise((resolve, reject) => {
      const p = spawn(PIPER_BIN, ['-m', VOICES[l], '-f', '-', '-q', '--length_scale', '0.95'], { cwd: path.dirname(PIPER_BIN) });
      const out = []; const timer = setTimeout(() => { p.kill('SIGKILL'); reject(new Error('timeout')); }, 30e3);
      p.stdout.on('data', d => out.push(d));
      p.on('error', e => { clearTimeout(timer); reject(e); });
      p.on('close', code => { clearTimeout(timer); code === 0 ? resolve(Buffer.concat(out)) : reject(new Error('piper code ' + code)); });
      p.stdin.end(text.replace(/\s+/g, ' '));
    });
  } finally { ttsRelease(); }
}

// Memory of this process and of the VM (MemAvailable excludes reclaimable file cache)
function memInfo() {
  const mb = x => Math.round(x / 1048576);
  let total = require('os').totalmem(), avail = require('os').freemem();
  try { const m = fs.readFileSync('/proc/meminfo', 'utf8'); const g = k => Number((m.match(new RegExp(k + ':\\s+(\\d+)')) || [])[1]) * 1024; total = g('MemTotal') || total; avail = g('MemAvailable') || avail; } catch {}
  return { processMB: mb(process.memoryUsage().rss), vmTotalMB: mb(total), vmAvailableMB: mb(avail) };
}

// ---------- HTTP ----------
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json', '.mp4': 'video/mp4', '.webm': 'video/webm', '.csv': 'text/csv; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.glb': 'model/gltf-binary' };
function send(res, code, obj) { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); }
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > limit) { reject(new Error('too big')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');

  // Ask the knight. Request body lives only inside this handler.
  if (url.pathname === '/api/chat' && req.method === 'POST') {
    let body;
    try { body = JSON.parse((await readBody(req, 1.6e6)).toString('utf8')); } catch (e) { lastReject = `${new Date().toISOString()} chat body: ${e.message} (${req.headers['content-length'] || '?'} bytes)`; return send(res, e.message === 'too big' ? 413 : 400, { error: 'bad_request' }); }
    const parsed = parseChatInput(body, { maxQuestion: MAX_QUESTION_CHARS, maxDoc: MAX_DOC_CHARS });
    if (parsed.error) {
      if (parsed.detail) lastReject = `${new Date().toISOString()} ${parsed.error}: ${parsed.detail}`;
      return send(res, 400, { error: parsed.error });
    }
    const msgs = parsed.msgs;
    const blocked = allow(req);
    if (blocked) return send(res, 429, { error: blocked === 'daily' ? 'daily_limit' : 'user_limit' });
    if (!KEY) return send(res, 500, { error: 'no_key' });
    // Business profile: its own instructions, no outside tools (nothing leaves the TEE model call)
    const prof = PROFILES[String(body.profile || '')];
    const hasImage = parsed.hasImage;
    const opts = { ...(prof ? { system: prof.prompt, tools: false } : {}), ...(hasImage ? { maxTokens: 4000 } : {}) };
    try { await askModelStream(msgs, res, opts); lastError = null; }
    catch (e) {
      lastError = new Date().toISOString() + ' ' + e.message; stats.errors++;
      console.error(new Date().toISOString(), 'AI error:', e.message);   // never logs content
      if (!e.started && !res.headersSent) send(res, 502, { error: 'ai_error' });
    }
    return;
  }

  // Voice → text with Whisper inside a TEE. Audio is held in memory for this request only.
  if (url.pathname === '/api/stt' && req.method === 'POST') {
    if (!sttModel) return send(res, 503, { error: 'no_stt' });
    const blocked = allow(req, 'stt');
    if (blocked) return send(res, 429, { error: blocked === 'daily' ? 'daily_limit' : 'user_limit' });
    let audio;
    try { audio = await readBody(req, 8e6); } catch { return send(res, 413, { error: 'too_big' }); }
    if (audio.length < 1000) return send(res, 400, { error: 'empty' });
    try {
      const text = await transcribe(audio, String(req.headers['content-type'] || 'audio/webm'), url.searchParams.get('lang') || '');
      return send(res, 200, { text });
    } catch (e) { console.error('STT error:', e.message); return send(res, 502, { error: 'stt_error' }); }
  }

  // Attestation report, verified on the server with a fresh random nonce
  if (url.pathname === '/api/attestation') {
    const force = url.searchParams.get('fresh') === '1';
    if (force || !attestation || Date.now() - Date.parse(attestation.checkedAt) > 5 * 60e3) {
      if (force && allow(req, 'verify')) return send(res, 200, { ...attestation, throttled: true });
      await runAttestation();
    }
    return send(res, 200, attestation || { ok: false, error: 'not_ready' });
  }

  // Same end-to-end check as `node scripts/verify.js`, run on this live server, output as plain text.
  // One tiny completion + attestation; rate-limited; prints results only, stores nothing.
  if (url.pathname === '/api/selftest') {
    // Evidence bundle: one shared run. Browsers often open a URL twice (address-bar preloading), so a second
    // request waits for the running test instead of being refused, and a finished bundle is reused for 10 minutes.
    // The bundle holds only a fixed public test prompt and hardware evidence — no visitor data.
    if (url.searchParams.get('bundle') === '1') {
      if (!(lastBundle && Date.now() - lastBundle.at < 10 * 60e3)) {
        if (!bundleRun) {
          if (allow(req, 'selftest')) return send(res, 429, { error: 'too_often', reason: 'self-test budget for this visitor used up', retryInSec: PER_USER_WINDOW_MIN * 60 });
          bundleRun = (async () => {
            const bundle = {}; const lines = [];
            const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout after 150 s')), 150e3).unref());
            try { await Promise.race([selftest((...x) => lines.push(util.format(...x)), bundle), timeout]); }
            catch (e) { lines.push('Error: ' + e.message); }
            if (bundle.format) lastBundle = { at: Date.now(), bundle }; else lastBundleError = lines.slice(-12).join('\n');
          })().finally(() => { bundleRun = null; });
        }
        await bundleRun;
      }
      if (!lastBundle) return send(res, 502, { error: 'selftest_failed', log: lastBundleError });
      const b = lastBundle.bundle;
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="evidence-${b.captured_at.slice(0, 19).replace(/[:T]/g, '-')}.json"`, 'Cache-Control': 'no-store' });
      return res.end(JSON.stringify(b, null, 1));
    }
    if (selftestBusy) return send(res, 429, { error: 'too_often', reason: 'a self-test is running right now', retryInSec: 30 });
    const wait = Math.ceil((60e3 - (Date.now() - selftestAt)) / 1000);
    if (wait > 0) return send(res, 429, { error: 'too_often', reason: 'one self-test per minute', retryInSec: wait });
    if (allow(req, 'selftest')) return send(res, 429, { error: 'too_often', reason: 'self-test budget for this visitor used up', retryInSec: PER_USER_WINDOW_MIN * 60 });
    selftestBusy = true; selftestAt = Date.now();
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.write(`$ node scripts/verify.js   (run live on this server, ${new Date().toISOString()})\n\n`);
    try { await selftest((...a) => res.write(util.format(...a) + '\n')); }
    catch (e) { res.write('Error: ' + e.message + '\n'); }
    finally { selftestBusy = false; }
    return res.end();
  }

  // Visitor's own challenge: they type any word/number, nonce = sha256(word).
  // The hardware must put exactly that value inside the Intel-signed quote, so the report
  // cannot be pre-recorded. The word is used only for this request and never stored.
  if (url.pathname === '/api/attestation/challenge') {
    const word = String(url.searchParams.get('word') || '').trim().slice(0, 64);
    if (!word) return send(res, 400, { error: 'empty' });
    if (allow(req, 'verify')) return send(res, 429, { error: 'too_often' });
    const nonce = /^[0-9a-fA-F]{64}$/.test(word) ? word.toLowerCase() : crypto.createHash('sha256').update(word, 'utf8').digest('hex');
    try {
      const a = await attest(MODEL, { nonce });
      const found = a.models.length > 0 && a.models.every(m => m.checks.some(c => c.id === 'nonce' && c.ok));
      const r = relay.inTee() ? await relay.selfAttest(nonce).catch(e => ({ inTee: true, ok: false, error: e.message, checks: [] })) : { inTee: false };
      return send(res, 200, { ...a, challenge: { word, nonce, found }, rawReport: a.raw, relay: r });
    } catch (e) { return send(res, 502, { error: 'attestation_error' }); }
  }

  // Attestation of THIS server (the relay). In a TEE on Phala Cloud it returns a fresh Intel TDX quote,
  // verified here and checkable by anyone on https://trust.phala.com/app/<app_id>. Outside a TEE: { inTee:false }.
  if (url.pathname === '/api/attestation/self') {
    if (!relay.inTee()) return send(res, 200, { inTee: false });
    const fresh = url.searchParams.get('fresh') === '1';
    if (!relayAtt || (fresh && !allow(req, 'verify')) || Date.now() - Date.parse(relayAtt.checkedAt) > 5 * 60e3) {
      try { relayAtt = await relay.selfAttest(); } catch (e) { return send(res, 200, { inTee: true, ok: false, error: e.message, checks: [] }); }
    }
    if (url.searchParams.get('raw') === '1') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': 'attachment; filename="relay-attestation.json"', 'Cache-Control': 'no-store' });
      return res.end(JSON.stringify({ nonce: relayAtt.nonce, report_data: relayAtt.reportData, app_id: relayAtt.appId, compose_hash: relayAtt.composeHash, checkedAt: relayAtt.checkedAt, quote: relayAtt.quote, event_log: relayAtt.eventLog }, null, 2));
    }
    const { quote, eventLog, ...pub } = relayAtt;
    return send(res, 200, pub);
  }

  // Raw attestation report of the latest check + its nonce: judges can re-verify it themselves
  // with the official tool (github.com/nearai/nearai-cloud-verifier). Hardware evidence only.
  if (url.pathname === '/api/attestation/raw') {
    if (!attestation || !attestation.raw) return send(res, 404, { error: 'not_ready' });
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': 'attachment; filename="near-ai-attestation.json"', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify({ model: attestation.model, nonce: attestation.nonce, checkedAt: attestation.checkedAt, signing_algo: 'ecdsa', report: attestation.raw }, null, 2));
  }

  if (url.pathname === '/api/tts' && req.method === 'POST') {
    let body;
    try { body = JSON.parse((await readBody(req, 20e3)).toString('utf8')); } catch { return send(res, 400, { error: 'bad_request' }); }
    const l = body.lang === 'en' ? 'en' : 'ru';
    const text = String(body.text || '').slice(0, 700).trim();
    if (!text) return send(res, 400, { error: 'empty' });
    if (!ttsReady(l)) return send(res, 503, { error: 'no_tts' });
    if (allow(req, 'tts')) return send(res, 429, { error: 'user_limit' });
    try { const wav = await synthesize(text, l); res.writeHead(200, { 'Content-Type': 'audio/wav', 'Content-Length': wav.length, 'Cache-Control': 'no-store' }); return res.end(wav); }
    catch (e) { console.error('TTS error:', e.message); return send(res, 502, { error: 'tts_error' }); }
  }

  // /dev page data (aggregate numbers only), protected by DEV_KEY
  if (url.pathname === '/api/stats') {
    if (!DEV_KEY) return send(res, 403, { error: 'no_dev_key' });
    const given = String(req.headers['x-dev-key'] || '');
    if (!(given.length === DEV_KEY.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(DEV_KEY)))) return send(res, 403, { error: 'bad_key' });
    return send(res, 200, { ...stats, model: MODEL, price: priceFor(MODEL), lastError, dailyLimit: DAILY_LIMIT, todayCount: limiter.todayCount(), attestationOk: attestation?.ok ?? null });
  }

  // Owner only: which NEAR AI organization this key belongs to and its remaining balance
  if (url.pathname === '/api/balance') {
    const given = String(req.headers['x-dev-key'] || '');
    if (!DEV_KEY || !(given.length === DEV_KEY.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(DEV_KEY)))) return send(res, 403, { error: 'bad_key' });
    const base = API_URL.replace(/\/chat\/completions$/, '');
    const out = {};
    try {
      const r = await fetch(base + '/check_api_key', { method: 'POST', headers: { Authorization: `Bearer ${KEY}` }, signal: AbortSignal.timeout(15000) });
      out.keyCheck = { status: r.status, body: (await r.json().catch(() => null)) };
      const org = out.keyCheck.body && (out.keyCheck.body.organization_id || out.keyCheck.body.org_id);
      if (org) {
        const b = await fetch(`${base}/organizations/${encodeURIComponent(org)}/usage/balance`, { headers: { Authorization: `Bearer ${KEY}` }, signal: AbortSignal.timeout(15000) });
        out.balance = { status: b.status, body: (await b.json().catch(() => null)) };
      }
    } catch (e) { out.error = e.message; }
    return send(res, 200, out);
  }

  if (url.pathname === '/api/health') return send(res, 200, {
    ok: true, key: !!KEY, model: MODEL, modelChecked, stt: !!sttModel, sttModel, lastError, lastReject, tools: toolsOn, webSearch: webSearchEnabled,
    verifierLibs: libsReady(), attestationOk: attestation?.ok ?? null, models: availableModels,
    tts: { ru: ttsReady('ru'), en: ttsReady('en') }, storesUserData: false, relayInTee: relay.inTee(), mem: memInfo(), visitorIpSeen: !!(req.headers['x-forwarded-for'] || req.headers['x-real-ip']),
  });

  // Static files
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  let file = path.normalize(path.join(PUBLIC_DIR, decodeURIComponent(url.pathname)));
  if (!file.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end(); }
  if (url.pathname.endsWith('/')) file = path.join(file, 'index.html');
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('Not found'); }
    const ext = path.extname(file);
    const headers = { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control': ['.html', '.js', '.css', '.json'].includes(ext) ? 'no-cache' : 'public, max-age=604800', 'Accept-Ranges': 'bytes' };
    const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');   // iPhone needs Range for video
    if (m) {
      let start = m[1] ? Number(m[1]) : st.size - Number(m[2]);
      let end = m[1] && m[2] ? Number(m[2]) : st.size - 1;
      if (start < 0) start = 0; end = Math.min(end, st.size - 1);
      if (start > end) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }); return res.end(); }
      res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': end - start + 1 });
      return fs.createReadStream(file, { start, end }).pipe(res);
    }
    res.writeHead(200, { ...headers, 'Content-Length': st.size });
    fs.createReadStream(file).pipe(res);
  });
});

checkModel().then(() => { if (KEY) runAttestation(); });
if (toolsOn) loadDocIndex().then(x => console.log('Docs index:', x.length, 'pages')).catch(() => {});
server.listen(PORT, () => {
  console.log(`Sir Near is on duty: http://localhost:${PORT}`);
  console.log(`NEAR AI key: ${KEY ? 'set' : 'MISSING'} | verifier libs: ${JSON.stringify(libsReady())} | web search: ${webSearchEnabled ? 'on' : 'off'}`);
  console.log('Privacy: no user data is stored — no cache, no history, no content logs.');
});
