'use strict';
// Static guarantees the README makes about storage: the server code never writes files or logs content.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const sources = ['server.js', 'tools.js', ...fs.readdirSync(path.join(root, 'lib')).map(f => 'lib/' + f)];
const code = Object.fromEntries(sources.map(f => [f, fs.readFileSync(path.join(root, f), 'utf8')]));

test('no file writes anywhere in the server code', () => {
  for (const [f, src] of Object.entries(code)) assert.doesNotMatch(src, /writeFile|appendFile|createWriteStream|fs\.write/, f);
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
