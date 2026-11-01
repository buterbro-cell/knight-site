// Сервер говорящего рыцаря. Без внешних зависимостей, нужен Node.js 18+.
// Запуск:  NEAR_AI_KEY=ваш_ключ node server.js
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

// ---------- Настройки (можно менять через переменные окружения) ----------
const PORT = Number(process.env.PORT || 3000);
const KEY = process.env.NEAR_AI_KEY || '';
// DeepSeek V4.1 Flash 1017 — «Private TEE» у NEAR AI: работает на их железе в защищённой среде.
// Умная, недорогая, а повторяющаяся шпаргалка почти бесплатна благодаря кешу ($0.006 за 1M токенов).
let MODEL = process.env.MODEL || 'deepseek-ai/DeepSeek-V4.1-Flash-1017';
const DEV_KEY = process.env.DEV_KEY || '';   // код для режима разработчика (/dev.html)

// Цены за 1M токенов: [вход, выход, вход из кеша] — с near.ai/models (ноябрь 2026)
const PRICES = {
  'deepseek-v4.1-flash-1017': [0.3, 1.2, 0.006],
  'qwen3.8-27b': [0.04, 1.35, 0.018], 'qwen3-8-27b': [0.04, 1.35, 0.018],
  'glm-5.3-flash': [0.08, 0.5, 0.012],
  'qwen3.6-35b-a3b': [0.17, 1.1, 0.056],
  'qwen3-vl-30b-a3b': [0.15, 0.55, 0.03],
  'deepseek-v3.2': [1.1, 1.1, 0.55],
  'glm-5.3': [1.8, 5.75, 0.45],
  'kimi-k2.6': [0.81, 3.85, 0.41],
  'qwen3.5-397b-a17b': [0.5, 3.3, 0.25],
};
const priceFor = m => { const k = m.toLowerCase(); let best = null; for (const key in PRICES) if (k.includes(key) && (!best || key.length > best.length)) best = key; return best ? PRICES[best] : null; };

// Статистика расхода (без текстов вопросов — только числа)
const stats = { since: new Date().toISOString(), answers: 0, fromCache: 0, errors: 0, inTokens: 0, cachedTokens: 0, outTokens: 0, costUsd: 0, days: {}, last: [] };
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
// Если такой модели нет у NEAR AI — сервер сам выберет похожую из этого списка (по порядку)
// Сначала — модели, которые NEAR AI запускает у себя в защищённой среде TEE (открытые модели),
// а не модели OpenAI/Anthropic/Google, которые работают у тех компаний вне TEE.
const MODEL_PREFS = ['deepseek-ai/DeepSeek-V4.1-Flash-1017', 'Qwen3.8-27B', 'GLM-5.3-Flash', 'Qwen3.6-35B-A3B', 'Qwen3-VL-30B-A3B'];
let modelInfo = null;
let lastError = null, modelChecked = false, availableModels = [];
const API_URL = process.env.API_URL || 'https://cloud-api.near.ai/v1/chat/completions';
const CHAR_NAME = process.env.CHAR_NAME || 'Сэр Ниар';
const PER_USER_LIMIT = Number(process.env.PER_USER_LIMIT || 20);      // вопросов на человека...
const PER_USER_WINDOW_MIN = Number(process.env.PER_USER_WINDOW_MIN || 60); // ...за столько минут
const DAILY_LIMIT = Number(process.env.DAILY_LIMIT || 3000);          // всего вопросов в сутки на весь сайт
const MAX_QUESTION_CHARS = 400;
const MAX_ANSWER_TOKENS = 700; // с запасом: «думающие» модели тратят часть токенов на размышления
const TRUST_PROXY = process.env.TRUST_PROXY === '1';                   // включить, если сайт за nginx/Caddy

const PUBLIC_DIR = path.join(__dirname, 'public');
const { TOOLS, runTool, webSearchEnabled, loadDocIndex } = require('./tools');
let toolsOn = process.env.USE_TOOLS !== '0';   // самостоятельный поиск информации
const MAX_TOOL_ROUNDS = 3;
const SEARCH_MARK = '\u0007';                    // сигнал браузеру: «рыцарь ищет информацию»
const KNOWLEDGE = fs.readFileSync(path.join(__dirname, 'knowledge.md'), 'utf8');

const SYSTEM_PROMPT = `Ты — ${CHAR_NAME}, весёлый, добрый и умный рыцарь-талисман сайта про NEAR. Ты говоришь голосом, поэтому:
- отвечай коротко и по делу: обычно 2–5 предложений, как в живом разговоре; если вопрос сложный — можно чуть длиннее;
- никакой разметки, списков, эмодзи и спецсимволов — только обычный текст для озвучки;
- отвечай на языке вопроса (русский — по-русски, английский — по-английски);
- объясняй сложное простыми словами, можно с лёгким рыцарским юмором, но без перебора.

Ты помогаешь с любыми нормальными вопросами, а не только про NEAR: программирование, учёба, работа, идеи, жизненные ситуации.
- Про NEAR, NEAR AI, TEE и приватность в первую очередь опирайся на шпаргалку ниже. Если в ней нет нужного факта, отвечай из своих знаний, но свежие цифры, даты и цены не выдумывай — скажи, что лучше проверить на docs.near.org или docs.near.ai.
- Про программирование (например, смарт-контракты на NEAR: Rust или JavaScript через near-sdk, команды near-cli) объясняй по шагам словами: что установить, что написать, как задеплоить. Код целиком голосом не зачитывай — опиши суть и предложи главные команды коротко.
- Если человеку тяжело или у него жизненные трудности — ответь тепло и по-человечески, поддержи, предложи один-два конкретных шага. Если звучит серьёзная опасность для здоровья или жизни — мягко посоветуй обратиться к близким или к специалисту.
- Не давай финансовых советов и не предсказывай цены токенов.
- Если просят что-то вредное или незаконное — вежливо откажись.

Как искать информацию:
- Сначала смотри шпаргалку ниже — если ответ там есть, отвечай сразу, без поиска.
- Если в шпаргалке ответа нет или нужны свежие данные (цена NEAR, текущие цифры сети, новости, новые версии, точные инструкции из документации) — сам найди и проверь с помощью инструментов: near_live для цены и состояния сети, near_docs_search и затем read_page для документации NEAR и NEAR AI${webSearchEnabled ? ', web_search для новостей и всего остального' : ''}.
- Ищи коротко: обычно один-два вызова, максимум три. Не выдумывай то, что не нашёл.
- В ответе голосом коротко назови источник, например: «по данным документации NEAR» или «по CoinGecko на сейчас».
- Цену называй как факт на текущий момент, без прогнозов и советов покупать или продавать.

`;
const SYSTEM_PROMPT_KB = `ШПАРГАЛКА ПРО NEAR:
${KNOWLEDGE}`;

// ---------- Защита от перерасхода ----------
const hits = new Map(); // ip -> [timestamps]
let day = new Date().toISOString().slice(0, 10), dayCount = 0;
setInterval(() => { // чистим старые записи
  const cut = Date.now() - PER_USER_WINDOW_MIN * 60e3;
  for (const [ip, arr] of hits) { const a = arr.filter(t => t > cut); a.length ? hits.set(ip, a) : hits.delete(ip); }
}, 60e3).unref();

function allow(ip) {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== day) { day = today; dayCount = 0; }
  if (dayCount >= DAILY_LIMIT) return 'daily';
  const cut = Date.now() - PER_USER_WINDOW_MIN * 60e3;
  const arr = (hits.get(ip) || []).filter(t => t > cut);
  if (arr.length >= PER_USER_LIMIT) return 'user';
  arr.push(Date.now()); hits.set(ip, arr); dayCount++;
  return null;
}

// Кеш ответов на одинаковые первые вопросы («привет», «что такое TEE»)
const cache = new Map();
const CACHE_MAX = 1000;
const norm = s => s.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim();

// Ограничиваем число одновременных запросов к нейросети, остальные ждут в очереди
const MAX_PARALLEL = Number(process.env.MAX_PARALLEL || 100);
let active = 0; const queue = [];
const slot = () => new Promise(res => { if (active < MAX_PARALLEL) { active++; res(); } else queue.push(res); });
const release = () => { const next = queue.shift(); next ? next() : active--; };

// Проверяем, какие модели доступны по ключу, и выбираем подходящую
async function checkModel() {
  if (!KEY) return;
  try {
    const r = await fetch(API_URL.replace(/\/chat\/completions$/, '/models'), { headers: { Authorization: `Bearer ${KEY}` } });
    if (!r.ok) { lastError = `Список моделей: NEAR AI ответил ${r.status}: ${(await r.text()).slice(0, 200)}`; console.error(lastError); return; }
    const data = await r.json();
    availableModels = (data.data || data.models || []).map(m => m.id || m.name || m).filter(x => typeof x === 'string');
    if (!availableModels.length) return;
    modelChecked = true;
    if (availableModels.includes(MODEL)) { console.log('Модель найдена:', MODEL); return loadModelInfo(); }
    const low = availableModels.map(x => x.toLowerCase());
    for (const pref of MODEL_PREFS) {
      const pl = pref.toLowerCase();
      let i = low.indexOf(pl);
      if (i < 0) i = low.findIndex(x => x.includes(pl) && !x.includes('abliterated'));
      if (i >= 0 && !/abliterated/i.test(availableModels[i])) { console.log(`Модели ${MODEL} нет, беру ${availableModels[i]}`); MODEL = availableModels[i]; return loadModelInfo(); }
    }
    console.log(`Модели ${MODEL} нет, беру первую доступную: ${availableModels[0]}`); MODEL = availableModels[0]; loadModelInfo();
  } catch (e) { lastError = 'Не удалось получить список моделей: ' + e.message; console.error(lastError); }
}

// Цена и сведения о выбранной модели — для страницы проверки
async function loadModelInfo() {
  try {
    const r = await fetch(API_URL.replace(/\/v1\/chat\/completions$/, '/v1/model/list'), { headers: { Authorization: `Bearer ${KEY}` } });
    if (!r.ok) return;
    const data = await r.json();
    const list = Array.isArray(data) ? data : (data.models || data.data || []);
    const m = list.find(x => [x.modelId, x.id, x.name, x.model].includes(MODEL));
    if (m) modelInfo = JSON.parse(JSON.stringify(m, (k, v) => (typeof v === 'string' && v.length > 300 ? v.slice(0, 300) + '…' : v)));
  } catch {}
}

async function askModel(messages) {
  await slot();
  const t0 = Date.now();
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30e3);
    const r = await fetch(API_URL, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'system', content: SYSTEM_PROMPT + SYSTEM_PROMPT_KB }, ...messages],
        max_tokens: MAX_ANSWER_TOKENS,
        temperature: 0.6,
      }),
    }).finally(() => clearTimeout(timer));
    if (!r.ok) {
      const t = (await r.text()).slice(0, 300);
      if ((r.status === 404 || /model/i.test(t)) && !askModel.retried) { askModel.retried = true; await checkModel(); }
      throw new Error(`NEAR AI ответил ${r.status}: ${t}`);
    }
    const data = await r.json();
    recordUsage(data.usage, Date.now() - t0, null);
    let text = data?.choices?.[0]?.message?.content || '';
    text = text.replace(/<think>[\s\S]*?<\/think>/g, '')      // убираем «мысли» у рассуждающих моделей
      .replace(/[*_#`>]+/g, '').replace(/\s+\n/g, '\n').trim();
    return text;
  } finally { release(); }
}

// Потоковый ответ: текст приходит кусочками, и мы сразу пересылаем их браузеру,
// чтобы рыцарь начинал говорить с первой фразы, не дожидаясь конца ответа.
async function askModelStream(messages, res) {
  await slot();
  let started = false, firstMs = null, usedTools = false;
  const usageSum = { prompt_tokens: 0, completion_tokens: 0, prompt_tokens_details: { cached_tokens: 0 } };
  const t0 = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 75e3);
  res.on('close', () => { if (!res.writableEnded) ctrl.abort(); });
  const begin = () => { if (!started) { started = true; res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' }); } };
  let full = '';
  try {
    const convo = [{ role: 'system', content: SYSTEM_PROMPT + SYSTEM_PROMPT_KB }, ...messages];
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const withTools = toolsOn && round < MAX_TOOL_ROUNDS;
      const r = await fetch(API_URL, {
        method: 'POST', signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
        body: JSON.stringify({
          model: MODEL, messages: convo,
          max_tokens: MAX_ANSWER_TOKENS, temperature: 0.6, stream: true, stream_options: { include_usage: true },
          ...(withTools ? { tools: TOOLS, tool_choice: 'auto' } : {}),
        }),
      });
      if (!r.ok) {
        const t = (await r.text()).slice(0, 300);
        // Модель не умеет инструменты — отключаем их и пробуем ещё раз без них
        if (withTools && r.status === 400 && /tool|function/i.test(t)) { console.log('Модель не поддерживает инструменты, отключаю поиск'); toolsOn = false; round--; continue; }
        if ((r.status === 404 || /model/i.test(t)) && !askModel.retried) { askModel.retried = true; await checkModel(); }
        throw new Error(`NEAR AI ответил ${r.status}: ${t}`);
      }
      let buf = '', raw = '', emitted = 0;
      const calls = [];
      // Что можно показать: без «мыслей» <think>…</think> рассуждающих моделей и без разметки
      const visible = () => {
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
        buf += dec.decode(chunk, { stream: true });
        let nl;
        while ((nl = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (data === '[DONE]') continue;
          let j; try { j = JSON.parse(data); } catch { continue; }
          if (j.usage) { usageSum.prompt_tokens += j.usage.prompt_tokens || 0; usageSum.completion_tokens += j.usage.completion_tokens || 0; usageSum.prompt_tokens_details.cached_tokens += j.usage.prompt_tokens_details?.cached_tokens || j.usage.prompt_cache_hit_tokens || 0; }
          const d = j.choices && j.choices[0] && j.choices[0].delta;
          if (!d) continue;
          if (d.content) out(d.content);
          for (const tc of d.tool_calls || []) {   // вызовы инструментов приходят кусочками — собираем
            const i = tc.index ?? 0;
            const c = calls[i] || (calls[i] = { id: '', type: 'function', function: { name: '', arguments: '' } });
            if (tc.id) c.id = tc.id;
            if (tc.function?.name) c.function.name += tc.function.name;
            if (tc.function?.arguments) c.function.arguments += tc.function.arguments;
          }
        }
      }
      const real = calls.filter(c => c && c.function.name);
      if (!real.length) break;           // ответ готов
      // Рыцарь ищет информацию: сообщаем браузеру, выполняем инструменты и продолжаем
      usedTools = true;
      begin(); res.write(SEARCH_MARK);
      real.forEach((c, i) => { if (!c.id) c.id = 'call_' + round + '_' + i; });
      convo.push({ role: 'assistant', content: raw || null, tool_calls: real });
      const results = await Promise.all(real.map(c => runTool(c.function.name, c.function.arguments)));
      real.forEach((c, i) => convo.push({ role: 'tool', tool_call_id: c.id, content: results[i] }));
      console.log(new Date().toISOString(), 'Инструменты:', real.map(c => c.function.name).join(', '));
    }
    clearTimeout(timer);
    if (!full.trim()) throw new Error('пустой ответ');
    res.end();
    recordUsage(usageSum, Date.now() - t0, firstMs);
    return { text: full.trim(), usedTools };
  } catch (e) {
    clearTimeout(timer);
    if (started) { try { res.write(full.trim() ? '' : ' '); res.end(); } catch {} }
    e.started = started; throw e;
  } finally { release(); }
}

// ---------- Голос на сервере (Piper) ----------
// Нужен для браузеров, которые сами не умеют говорить (встроенный браузер Telegram, приложения на Android).
// Установка описана в README. Если Piper не установлен — эти посетители увидят ответ текстом.
const { spawn } = require('child_process');
const crypto = require('crypto');
const PIPER_DIR = process.env.PIPER_DIR || path.join(__dirname, 'piper');
const PIPER_BIN = path.join(PIPER_DIR, 'piper', 'piper');
const VOICES = { ru: path.join(PIPER_DIR, 'ru.onnx'), en: path.join(PIPER_DIR, 'en.onnx') };
const ttsReady = l => fs.existsSync(PIPER_BIN) && fs.existsSync(VOICES[l]);
const TTS_PARALLEL = Number(process.env.TTS_PARALLEL || 2); // слабый сервер — не больше 2 озвучек одновременно
let ttsActive = 0; const ttsQueue = [];
const ttsSlot = () => new Promise(res => { if (ttsActive < TTS_PARALLEL) { ttsActive++; res(); } else ttsQueue.push(res); });
const ttsRelease = () => { const n = ttsQueue.shift(); n ? n() : ttsActive--; };
const ttsCache = new Map(); let ttsCacheBytes = 0; const TTS_CACHE_MAX = 60e6; // до 60 МБ готовых фраз в памяти

async function synthesize(text, l) {
  const key = crypto.createHash('sha1').update(l + '|' + text).digest('hex');
  if (ttsCache.has(key)) { const v = ttsCache.get(key); ttsCache.delete(key); ttsCache.set(key, v); return v; }
  await ttsSlot();
  try {
    const wav = await new Promise((resolve, reject) => {
      const p = spawn(PIPER_BIN, ['-m', VOICES[l], '-f', '-', '-q', '--length_scale', '0.95'], { cwd: path.dirname(PIPER_BIN) });
      const out = []; const timer = setTimeout(() => { p.kill('SIGKILL'); reject(new Error('timeout')); }, 30e3);
      p.stdout.on('data', d => out.push(d));
      p.on('error', e => { clearTimeout(timer); reject(e); });
      p.on('close', code => { clearTimeout(timer); code === 0 ? resolve(Buffer.concat(out)) : reject(new Error('piper code ' + code)); });
      p.stdin.end(text.replace(/\s+/g, ' '));
    });
    ttsCache.set(key, wav); ttsCacheBytes += wav.length;
    while (ttsCacheBytes > TTS_CACHE_MAX) { const [k, v] = ttsCache.entries().next().value; ttsCache.delete(k); ttsCacheBytes -= v.length; }
    return wav;
  } finally { ttsRelease(); }
}
const ttsHits = new Map();
setInterval(() => ttsHits.clear(), 60 * 60e3).unref();

// ---------- HTTP ----------
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json', '.mp4': 'video/mp4', '.webm': 'video/webm' };

function send(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > 20e3) { reject(new Error('big')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');

  if (url.pathname === '/api/chat' && req.method === 'POST') {
    const ip = (TRUST_PROXY && (req.headers['x-forwarded-for'] || '').split(',')[0].trim()) || req.socket.remoteAddress;
    let body;
    try { body = JSON.parse(await readBody(req)); } catch { return send(res, 400, { error: 'bad_request' }); }

    // Берём только последние 6 реплик и обрезаем длину
    const msgs = (Array.isArray(body.messages) ? body.messages : [])
      .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-6).map(m => ({ role: m.role, content: m.content.slice(0, MAX_QUESTION_CHARS) }));
    if (!msgs.length || msgs[msgs.length - 1].role !== 'user' || !msgs[msgs.length - 1].content.trim())
      return send(res, 400, { error: 'empty' });

    const firstQuestion = msgs.length === 1 ? norm(msgs[0].content) : null;
    if (firstQuestion && cache.has(firstQuestion)) { stats.fromCache++; return send(res, 200, { answer: cache.get(firstQuestion), cached: true }); }

    const blocked = allow(ip);
    if (blocked === 'user') return send(res, 429, { error: 'user_limit' });
    if (blocked === 'daily') return send(res, 429, { error: 'daily_limit' });
    if (!KEY) return send(res, 500, { error: 'no_key' });

    if (body.stream) {
      try {
        const { text: answer, usedTools } = await askModelStream(msgs, res);
        lastError = null; askModel.retried = false;
        if (firstQuestion && answer && !usedTools) { if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value); cache.set(firstQuestion, answer); }
      } catch (e) {
        lastError = new Date().toISOString() + ' ' + e.message; stats.errors++;
        console.error(new Date().toISOString(), 'Ошибка нейросети:', e.message);
        if (!e.started && !res.headersSent) send(res, 502, { error: 'ai_error' });
      }
      return;
    }
    try {
      const answer = await askModel(msgs);
      if (!answer) throw new Error('пустой ответ');
      lastError = null; askModel.retried = false;
      if (firstQuestion) { if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value); cache.set(firstQuestion, answer); }
      return send(res, 200, { answer });
    } catch (e) {
      lastError = new Date().toISOString() + ' ' + e.message; stats.errors++;
      console.error(new Date().toISOString(), 'Ошибка нейросети:', e.message); // текст вопроса не пишем в лог
      return send(res, 502, { error: 'ai_error' });
    }
  }

  if (url.pathname === '/api/tts' && req.method === 'POST') {
    const ip = (TRUST_PROXY && (req.headers['x-forwarded-for'] || '').split(',')[0].trim()) || req.socket.remoteAddress;
    let body;
    try { body = JSON.parse(await readBody(req)); } catch { return send(res, 400, { error: 'bad_request' }); }
    const l = body.lang === 'en' ? 'en' : 'ru';
    const text = String(body.text || '').slice(0, 700).trim();
    if (!text) return send(res, 400, { error: 'empty' });
    if (!ttsReady(l)) return send(res, 503, { error: 'no_tts' });
    const n = (ttsHits.get(ip) || 0) + 1; ttsHits.set(ip, n);
    if (n > PER_USER_LIMIT * 4) return send(res, 429, { error: 'user_limit' });
    try {
      const wav = await synthesize(text, l);
      res.writeHead(200, { 'Content-Type': 'audio/wav', 'Content-Length': wav.length, 'Cache-Control': 'no-store' });
      return res.end(wav);
    } catch (e) {
      console.error(new Date().toISOString(), 'Ошибка озвучки:', e.message);
      return send(res, 502, { error: 'tts_error' });
    }
  }

  // Режим разработчика: расход и скорость. Доступ только по коду DEV_KEY (потом привяжем к кошельку)
  if (url.pathname === '/api/stats') {
    const given = String(req.headers['x-dev-key'] || '');
    const ok = DEV_KEY && given.length === DEV_KEY.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(DEV_KEY));
    if (!DEV_KEY) return send(res, 403, { error: 'no_dev_key' });
    if (!ok) return send(res, 403, { error: 'bad_key' });
    return send(res, 200, { ...stats, model: MODEL, price: priceFor(MODEL), lastError, dailyLimit: DAILY_LIMIT, todayCount: dayCount });
  }

  // Страница проверки: откройте /api/health в браузере, чтобы увидеть, что не так
  if (url.pathname === '/api/health') return send(res, 200, {
    ok: true, key: !!KEY, model: MODEL, modelChecked, lastError, tools: toolsOn, webSearch: webSearchEnabled,
    modelInfo, models: availableModels, tts: { ru: ttsReady('ru'), en: ttsReady('en') },
  });

  // Статика
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  let file = path.normalize(path.join(PUBLIC_DIR, decodeURIComponent(url.pathname)));
  if (!file.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end(); }
  if (url.pathname.endsWith('/')) file = path.join(file, 'index.html');
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('Not found'); }
    const ext = path.extname(file);
    const headers = {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=604800',
      'Accept-Ranges': 'bytes',
    };
    // Видео на iPhone требует отдачи по кусочкам (Range)
    const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
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

checkModel();
if (toolsOn) loadDocIndex().then(x => console.log('Оглавление документации:', x.length, 'страниц')).catch(() => {});
server.listen(PORT, () => {
  console.log(`Рыцарь на посту: http://localhost:${PORT}`);
  console.log(`Модель: ${MODEL}. Ключ NEAR AI: ${KEY ? 'есть' : 'НЕ ЗАДАН — ответы работать не будут'}`);
  console.log(`Самостоятельный поиск: ${toolsOn ? 'включён' : 'выключен'}, интернет-поиск: ${webSearchEnabled ? 'есть' : 'нет (нужен TAVILY_API_KEY)'}`);
  console.log(`Голос на сервере: RU ${ttsReady('ru') ? 'есть' : 'нет'}, EN ${ttsReady('en') ? 'есть' : 'нет'}`);
});
