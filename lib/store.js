'use strict';
// A small JSON file kept encrypted at rest (AES-256-GCM). The key comes from the caller (TEE-derived on Phala).
// Used for the owner's agent-wallet settings (limits and the day's spending), never for conversations.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function encryptedFile(file, getKey) {
  let cache = null, loading = null;
  async function load() {
    if (cache) return cache;
    if (!loading) loading = (async () => {
      cache = {};
      try {
        const k = await getKey(); if (!k) return cache;
        const b = fs.readFileSync(file);
        const d = crypto.createDecipheriv('aes-256-gcm', k, b.subarray(0, 12)); d.setAuthTag(b.subarray(12, 28));
        cache = JSON.parse(Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8')) || {};
      } catch (e) { if (e.code !== 'ENOENT') console.warn('[store] could not read', path.basename(file), e.message); }
      return cache;
    })();
    return loading;
  }
  async function save() {
    const k = await getKey().catch(() => null); if (!k || !cache) return;
    const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', k, iv);
    const body = Buffer.concat([c.update(JSON.stringify(cache), 'utf8'), c.final()]);
    try { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file + '.tmp', Buffer.concat([iv, c.getAuthTag(), body])); fs.renameSync(file + '.tmp', file); }
    catch (e) { console.warn('[store] could not save', path.basename(file), e.message); }
  }
  return { load, save };
}
module.exports = { encryptedFile };
