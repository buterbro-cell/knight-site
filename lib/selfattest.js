// Attestation of THIS server (the relay between the browser and NEAR AI).
// When the app runs in a confidential VM on Phala Cloud (dstack), the guest agent socket
// /var/run/dstack.sock is mounted into the container (see docker-compose.phala.yml).
// We ask it for an Intel TDX quote whose report_data contains a fresh nonce, verify the quote
// with dcap-qvl, and read the app id / compose hash so anyone can check the code on the
// Phala Trust Center: https://trust.phala.com/app/<app_id>
// PRIVACY: hardware evidence only, no user data.
'use strict';
const fs = require('fs');
const http = require('http');
const crypto = require('crypto');
const { verifyTdxQuote } = require('./attest');

const SOCK = ['/var/run/dstack.sock', '/run/dstack.sock'].find(p => { try { return fs.existsSync(p); } catch { return false; } });
const inTee = () => !!SOCK;

function agent(pathAndQuery) {
  return new Promise((resolve, reject) => {
    const req = http.request({ socketPath: SOCK, path: pathAndQuery, method: 'GET', timeout: 20000 }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { if (res.statusCode >= 400) return reject(new Error('dstack ' + res.statusCode + ' ' + d.slice(0, 200))); try { resolve(JSON.parse(d)); } catch { reject(new Error('dstack: bad JSON')); } });
    });
    req.on('timeout', () => req.destroy(new Error('dstack timeout'))); req.on('error', reject); req.end();
  });
}

let infoCache = null;
async function info() {
  if (infoCache) return infoCache;
  const i = await agent('/Info');
  let tcb = i.tcb_info; if (typeof tcb === 'string') { try { tcb = JSON.parse(tcb); } catch { tcb = {}; } }
  infoCache = { appId: i.app_id || '', instanceId: i.instance_id || '', composeHash: (tcb && (tcb.compose_hash || tcb.app_compose_hash)) || i.compose_hash || '', name: i.app_name || '' };
  return infoCache;
}

// nonceHex: 64 hex chars (32 bytes). report_data = "knight-relay:" domain tag hash || nonce  (64 bytes)
async function selfAttest(nonceHex) {
  if (!inTee()) return { inTee: false };
  const nonce = /^[0-9a-f]{64}$/.test(nonceHex || '') ? nonceHex : crypto.randomBytes(32).toString('hex');
  const tag = crypto.createHash('sha256').update('knight-site relay attestation').digest('hex');
  const reportData = tag + nonce;                                    // 64 bytes
  const t0 = Date.now();
  const checks = [];
  const add = (id, ok, label, detail, critical = true) => checks.push({ id, ok: !!ok, label, detail: detail || '', critical });
  const [q, inf] = await Promise.all([agent('/GetQuote?report_data=0x' + reportData), info().catch(() => ({}))]);
  let v = null;
  try { v = await verifyTdxQuote(String(q.quote || '').replace(/^0x/, '')); }
  catch (e) { add('intel', false, 'Intel TDX quote is genuine', e.message); }
  if (v) {
    add('intel', v.verified, 'Intel TDX quote is genuine', 'dcap-qvl status: ' + (v.status || '?'));
    // older agents hash report_data; accept the raw value or its SHA-512/SHA-256 forms, and say which matched
    const rd = v.reportData.toLowerCase();
    const sha512 = crypto.createHash('sha512').update(Buffer.from(reportData, 'hex')).digest('hex');
    const sha256 = crypto.createHash('sha256').update(Buffer.from(reportData, 'hex')).digest('hex').padEnd(128, '0');
    const how = rd === reportData ? 'raw' : rd === sha512 ? 'sha512' : rd === sha256 ? 'sha256' : '';
    add('nonce', !!how, 'Report is fresh (our nonce inside the quote)', how ? `report_data = tag‖nonce (${how}), nonce ${nonce.slice(0, 16)}…` : 'nonce not found in report_data');
  }
  add('app', !!inf.appId, 'App identity measured (app id, compose hash in RTMR3)', inf.appId ? `app_id ${inf.appId}${inf.composeHash ? ', compose ' + String(inf.composeHash).slice(0, 16) + '…' : ''}` : 'unknown', false);
  return {
    inTee: true, ok: checks.filter(c => c.critical).every(c => c.ok), nonce, reportData, checkedAt: new Date().toISOString(), ms: Date.now() - t0,
    appId: inf.appId || '', composeHash: inf.composeHash || '', trustCenter: inf.appId ? 'https://trust.phala.com/app/' + inf.appId : '',
    checks, quote: q.quote, eventLog: q.event_log,
  };
}

module.exports = { inTee, selfAttest, info };
