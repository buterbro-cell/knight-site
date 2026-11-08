// Инструменты SECRA: он сам ищет свежую информацию и проверяет её.
//  - near_docs_search — поиск по официальной документации NEAR и NEAR AI (бесплатно)
//  - read_page        — прочитать страницу по ссылке (бесплатно)
//  - near_live        — живые данные сети NEAR и цена токена (бесплатно)
//  - web_search       — поиск в интернете (нужен ключ TAVILY_API_KEY или BRAVE_API_KEY)
'use strict';
const dns = require('dns').promises;
const net = require('net');

// Web search sends a search phrase to a third party outside the TEE, so it is OFF unless ALLOW_WEB_SEARCH=1.
const WEB_OK = process.env.ALLOW_WEB_SEARCH === '1';
const TAVILY = WEB_OK ? (process.env.TAVILY_API_KEY || '') : '';
const BRAVE = WEB_OK ? (process.env.BRAVE_API_KEY || '') : '';
const UA = 'Mozilla/5.0 (compatible; SecraBot/1.0)';

async function getText(url, { timeout = 10e3, max = 400e3, headers = {} } = {}) {
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(url, { signal: ctrl.signal, redirect: 'follow', headers: { 'User-Agent': UA, ...headers } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const reader = r.body.getReader(); const chunks = []; let size = 0;
    while (true) { const { value, done } = await reader.read(); if (done) break; size += value.length; chunks.push(value); if (size > max) { try { reader.cancel(); } catch {} break; } }
    return { text: Buffer.concat(chunks.map(c => Buffer.from(c))).toString('utf8'), type: r.headers.get('content-type') || '' };
  } finally { clearTimeout(t); }
}

// Защита: не даём серверу ходить во внутреннюю сеть
async function safeUrl(u) {
  let url; try { url = new URL(u); } catch { throw new Error('плохая ссылка'); }
  if (url.protocol !== 'https:') throw new Error('только https');
  const host = url.hostname;
  if (/^(localhost|.*\.local|.*\.internal)$/i.test(host)) throw new Error('закрытый адрес');
  const addrs = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true });
  for (const { address } of addrs) {
    if (/^(10\.|127\.|169\.254\.|192\.168\.|0\.|::1|fc|fd|fe80)/i.test(address) || /^172\.(1[6-9]|2\d|3[01])\./.test(address)) throw new Error('закрытый адрес');
  }
  return url.toString();
}

const htmlToText = h => h
  .replace(/<(script|style|noscript|svg|nav|footer|header)[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<br\s*\/?>|<\/(p|div|li|h\d|tr)>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();

// ---------- Документация NEAR: оглавления llms.txt, обновляются раз в сутки ----------
const DOC_INDEXES = ['https://docs.near.org/llms.txt', 'https://docs.near.ai/llms.txt'];
let docIndex = [], docIndexAt = 0;
async function loadDocIndex() {
  if (docIndex.length && Date.now() - docIndexAt < 24 * 3600e3) return docIndex;
  const items = [];
  for (const src of DOC_INDEXES) {
    try {
      const { text } = await getText(src, { max: 2e6 });
      for (const line of text.split('\n')) {
        const m = line.match(/\[([^\]]+)\]\((https?:[^)]+)\)(?::\s*(.*))?/);
        if (m) items.push({ title: m[1], url: m[2], desc: (m[3] || '').slice(0, 200), site: new URL(src).hostname });
      }
    } catch (e) { console.error('Оглавление документации не загрузилось:', src, e.message); }
  }
  if (items.length) { docIndex = items; docIndexAt = Date.now(); }
  return docIndex;
}
const words = s => s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 1);

async function nearDocsSearch({ query }) {
  const idx = await loadDocIndex();
  if (!idx.length) return 'Документация сейчас недоступна.';
  const q = words(query);
  const scored = idx.map(it => {
    const t = words(it.title), d = words(it.desc), u = words(it.url);
    let s = 0; for (const w of q) { if (t.some(x => x.startsWith(w))) s += 3; if (d.some(x => x.startsWith(w))) s += 1; if (u.some(x => x.startsWith(w))) s += 1; }
    return { ...it, s };
  }).filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 6);
  if (!scored.length) return 'Ничего не нашлось в оглавлении документации. Попробуй другие слова (на английском) или web_search.';
  return scored.map(x => `${x.title} — ${x.url}${x.desc ? ' — ' + x.desc : ''}`).join('\n') + '\nЧтобы прочитать страницу, вызови read_page с её ссылкой.';
}

async function readPage({ url }) {
  const safe = await safeUrl(url);
  const { text, type } = await getText(safe);
  let body = /html/i.test(type) && !/\.md(\?|$)/.test(safe) ? htmlToText(text) : text;
  body = body.replace(/\n{3,}/g, '\n\n');
  return body.slice(0, 7000) + (body.length > 7000 ? '\n…(страница обрезана)' : '');
}

// ---------- Живые данные NEAR ----------
async function nearLive() {
  const out = [];
  try {
    const r = await fetch('https://rpc.mainnet.fastnear.com', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'status', params: [] }), signal: AbortSignal.timeout(8000) });
    const j = await r.json(); const s = j.result;
    out.push(`Сеть NEAR mainnet: последний блок ${s.sync_info.latest_block_height}, время блока ${s.sync_info.latest_block_time}, валидаторов в текущей эпохе ${s.validators.length}, версия протокола ${s.protocol_version}.`);
  } catch (e) { out.push('Данные сети сейчас недоступны.'); }
  try {
    const { text } = await getText('https://api.coingecko.com/api/v3/simple/price?ids=near&vs_currencies=usd,rub&include_24hr_change=true&include_market_cap=true', { timeout: 8000 });
    const p = JSON.parse(text).near;
    out.push(`Цена NEAR по CoinGecko: ${p.usd} $ (${p.rub} ₽), изменение за 24 часа ${p.usd_24h_change?.toFixed(2)}%, капитализация ${Math.round(p.usd_market_cap / 1e6)} млн $.`);
  } catch (e) { out.push('Цена сейчас недоступна.'); }
  out.push(`Время запроса: ${new Date().toISOString()}.`);
  return out.join('\n');
}

// ---------- Поиск в интернете ----------
async function webSearch({ query }) {
  if (TAVILY) {
    const r = await fetch('https://api.tavily.com/search', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: TAVILY, query, max_results: 5, search_depth: 'basic' }), signal: AbortSignal.timeout(15000) });
    const j = await r.json();
    return (j.results || []).map(x => `${x.title} — ${x.url}\n${(x.content || '').slice(0, 700)}`).join('\n\n') || 'Ничего не найдено.';
  }
  if (BRAVE) {
    const r = await fetch('https://api.search.brave.com/res/v1/web/search?count=5&q=' + encodeURIComponent(query), {
      headers: { 'X-Subscription-Token': BRAVE, Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
    const j = await r.json();
    return (j.web?.results || []).map(x => `${x.title} — ${x.url}\n${(x.description || '').replace(/<[^>]+>/g, '').slice(0, 500)}`).join('\n\n') || 'Ничего не найдено.';
  }
  return 'Поиск в интернете не подключён. Используй near_docs_search и read_page.';
}

const TOOLS = [
  { type: 'function', function: { name: 'near_docs_search', description: 'Найти страницы в официальной документации NEAR (docs.near.org) и NEAR AI (docs.near.ai). Запрос лучше на английском.', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } } },
  { type: 'function', function: { name: 'read_page', description: 'Прочитать текст страницы по https-ссылке (документация, статья, новость), чтобы проверить факты.', parameters: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] } } },
  { type: 'function', function: { name: 'near_live', description: 'Живые данные прямо сейчас: текущий блок и валидаторы сети NEAR, цена токена NEAR и изменение за сутки.', parameters: { type: 'object', properties: {} } } },
];
if (TAVILY || BRAVE) TOOLS.push({ type: 'function', function: { name: 'web_search', description: 'Поиск в интернете: свежие новости, события, всё, чего нет в документации.', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } } });

const IMPL = { near_docs_search: nearDocsSearch, read_page: readPage, near_live: nearLive, web_search: webSearch };

async function runTool(name, argsJson) {
  let args = {}; try { args = argsJson ? JSON.parse(argsJson) : {}; } catch {}
  const fn = IMPL[name];
  if (!fn) return 'Нет такого инструмента.';
  try { return String(await fn(args)).slice(0, 8000); } catch (e) { return 'Ошибка инструмента: ' + e.message; }
}

module.exports = { TOOLS, runTool, webSearchEnabled: !!(TAVILY || BRAVE), loadDocIndex };
