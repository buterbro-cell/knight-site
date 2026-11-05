// JSON-safe encoding for evidence bundles: Intel collateral may contain byte arrays (Uint8Array),
// which plain JSON would turn into objects. Encoded as { "$u8": "<base64>" } and decoded back exactly.
'use strict';
function encode(v) {
  if (v instanceof Uint8Array) return { $u8: Buffer.from(v).toString('base64') };
  if (Array.isArray(v)) return v.map(encode);
  if (v instanceof Map) return { $map: [...v.entries()].map(([k, x]) => [k, encode(x)]) };
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, encode(x)]));
  if (typeof v === 'bigint') return { $big: v.toString() };
  return v;
}
function decode(v) {
  if (Array.isArray(v)) return v.map(decode);
  if (v && typeof v === 'object') {
    if (typeof v.$u8 === 'string' && Object.keys(v).length === 1) return new Uint8Array(Buffer.from(v.$u8, 'base64'));
    if (Array.isArray(v.$map) && Object.keys(v).length === 1) return new Map(v.$map.map(([k, x]) => [k, decode(x)]));
    if (typeof v.$big === 'string' && Object.keys(v).length === 1) return BigInt(v.$big);
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, decode(x)]));
  }
  return v;
}
module.exports = { encode, decode };
