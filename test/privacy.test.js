'use strict';
// Static guarantees the README makes about storage: the server code never writes files or logs content.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const sources = ['server.js', 'tools.js', ...fs.readdirSync(path.join(root, 'lib')).map(f => 'lib/' + f)];
const code = Object.fromEntries(sources.map(f => [f, fs.readFileSync(path.join(root, f), 'utf8')]));

test('no file writes anywhere in the server code, except the encrypted standing orders', () => {
  // lib/dca.js keeps only the plans the owner created (tokens, amount, period), AES-256-GCM with a TEE-derived key
  for (const [f, src] of Object.entries(code)) if (!/lib[\\/]dca\.js$/.test(f)) assert.doesNotMatch(src, /writeFile|appendFile|createWriteStream|fs\.write/, f);
  const dca = Object.entries(code).find(([f]) => /lib[\\/]dca\.js$/.test(f));
  if (dca) { assert.match(dca[1], /aes-256-gcm/); assert.doesNotMatch(dca[1], /\b(messages|question|answer|audio)\b\s*[:=]/); }
});

test('no database or cache client is used', () => {
  for (const [f, src] of Object.entries(code)) assert.doesNotMatch(src, /require\(['"](redis|ioredis|pg|mysql2?|mongodb|sqlite3|better-sqlite3|level)['"]\)/, f);
});

test('logs never print questions, answers, documents or audio', () => {
  for (const [f, src] of Object.entries(code)) {
    for (const line of src.split('\n').filter(l => /console\.(log|error|warn|info)\(/.test(l)).map(l => l.replace(/\/\/.*$/, '').replace(/'[^']*'|"[^"]*"/g, "''"))) {
      assert.doesNotMatch(line, /\b(msgs|messages|body|question|answer|content|doc(ument)?|text|audio|img|image|convo|raw)\b(?!\.length)/, `${f}: ${line.trim()}`);
    }
  }
});
