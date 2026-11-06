'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const pay = require('../lib/pay');

test('amounts become exact integer units; junk is rejected', () => {
  assert.equal(pay.toUnits('2', 6), 2000000n);
  assert.equal(pay.toUnits('2.5', 6), 2500000n);
  assert.equal(pay.toUnits('0.000001', 6), 1n);
  assert.equal(pay.toUnits('1.5', 24), 1500000000000000000000000n);
  for (const bad of ['-1', '0', '1e3', '1.0000001', 'abc', '', '1,5']) assert.throws(() => pay.toUnits(bad, 6), bad);
});

test('send: recipient gets exactly the amount (EXACT_OUTPUT), confidential, refunds to the sender', () => {
  const q = pay.buildQuote({ action: 'send', amount: '2', token: 'USDC', to: 'anna.near', from: 'mcloven1.tg' });
  assert.equal(q.swapType, 'EXACT_OUTPUT');
  assert.equal(q.amount, '2000000');
  assert.equal(q.recipient, 'anna.near');
  assert.equal(q.refundTo, 'mcloven1.tg');
  assert.equal(q.confidentiality, 'advanced');
  assert.equal(q.originAsset, pay.ASSETS['USDC@near'].assetId);
  assert.equal(q.destinationAsset, pay.ASSETS['USDC@near'].assetId);
});

test('send to Base needs an EVM address', () => {
  assert.throws(() => pay.buildQuote({ action: 'send', amount: '1', token: 'USDC', toChain: 'base', to: 'anna.near', from: 'me.near' }));
  const q = pay.buildQuote({ action: 'send', amount: '1', token: 'USDC', toChain: 'base', to: '0x' + 'a'.repeat(40), from: 'me.near' });
  assert.equal(q.destinationAsset, pay.ASSETS['USDC@base'].assetId);
});

test('swap: the user puts in exactly the amount (EXACT_INPUT) and receives on their own account', () => {
  const q = pay.buildQuote({ action: 'swap', amount: '3', token: 'NEAR', toToken: 'USDC', from: 'me.near' }, { prices: { NEAR: 2 } });
  assert.equal(q.swapType, 'EXACT_INPUT');
  assert.equal(q.recipient, 'me.near');
  assert.equal(q.amount, (3n * 10n ** 24n).toString());
  assert.throws(() => pay.buildQuote({ action: 'swap', amount: '3', token: 'USDC', toToken: 'USDC', from: 'me.near' }), /different/);
});

test('safety limits: per-action cap, known tokens only, a connected wallet, valid accounts', () => {
  assert.throws(() => pay.buildQuote({ action: 'send', amount: String(pay.MAX_USD + 1), token: 'USDC', to: 'a.near', from: 'me.near' }), /limit/);
  assert.throws(() => pay.buildQuote({ action: 'swap', amount: '100', token: 'NEAR', toToken: 'USDC', from: 'me.near' }, { prices: { NEAR: 2 } }), /limit/);
  assert.throws(() => pay.buildQuote({ action: 'swap', amount: '1', token: 'NEAR', toToken: 'USDC', from: 'me.near' }), /price/);
  assert.throws(() => pay.buildQuote({ action: 'send', amount: '1', token: 'DOGE', to: 'a.near', from: 'me.near' }), /unsupported/);
  assert.throws(() => pay.buildQuote({ action: 'send', amount: '1', token: 'USDC', to: 'a.near' }), /wallet/);
  assert.throws(() => pay.buildQuote({ action: 'send', amount: '1', token: 'USDC', to: 'Bad Name!', from: 'me.near' }), /recipient/);
  assert.throws(() => pay.buildQuote({ action: 'withdraw_all', amount: '1', token: 'USDC', from: 'me.near' }), /action/);
});

test('account validators', () => {
  for (const ok of ['ro52.near', 'mcloven1.tg', 'a-b_c.near', 'f'.repeat(64)]) assert.ok(pay.isNearAccount(ok), ok);
  for (const bad of ['A.near', 'a..near', '.near', 'a', 'x'.repeat(65), 'a.near.']) assert.ok(!pay.isNearAccount(bad), bad);
});

test('one payment unlocks one document (follow-ups on it are free), not a second document', () => {
  const d = 'e'.repeat(64);
  assert.equal(pay.consumeDeposit(d, 'blood.jpg'), true);
  assert.equal(pay.consumeDeposit(d, 'blood.jpg'), true, 'follow-up question on the same document');
  assert.equal(pay.consumeDeposit(d, 'other.pdf'), false, 'a different document needs a new payment');
});

test('send with another token: recipient still gets exactly the requested token; USDT supported', () => {
  const q = pay.buildQuote({ action: 'send', amount: '5', token: 'USDT', payWith: 'NEAR', to: 'anna.near', from: 'me.near' });
  assert.equal(q.originAsset, pay.ASSETS['NEAR@near'].assetId);
  assert.equal(q.destinationAsset, pay.ASSETS['USDT@near'].assetId);
  assert.equal(q.swapType, 'EXACT_OUTPUT');
  assert.equal(q.amount, '5000000');
  const same = pay.buildQuote({ action: 'send', amount: '5', token: 'USDT', to: 'anna.near', from: 'me.near' });
  assert.equal(same.originAsset, pay.ASSETS['USDT@near'].assetId);
  assert.throws(() => pay.buildQuote({ action: 'send', amount: '5', token: 'USDT', payWith: 'DOGE', to: 'anna.near', from: 'me.near' }), /unsupported/);
});

test('Intents rail: paid from the payer\'s Intents balance, payout to the recipient\'s private balance', () => {
  const q = pay.buildQuote({ action: 'send', amount: '1', token: 'USDT', to: 'ro52.near', from: 'me.near', source: 'private' });
  assert.equal(q.depositType, 'CONFIDENTIAL_INTENTS');
  assert.equal(q.refundType, 'CONFIDENTIAL_INTENTS');
  assert.equal(q.recipientType, 'CONFIDENTIAL_INTENTS');
  const pub = pay.buildQuote({ action: 'send', amount: '1', token: 'USDT', to: 'ro52.near', from: 'me.near' });
  assert.equal(pub.depositType, 'INTENTS');
  assert.throws(() => pay.buildQuote({ action: 'send', amount: '1', token: 'USDT', to: 'ro52.near', from: 'me.near', source: 'chain' }), /rail/);
});

test('the payer signs only one transfer of the origin token, at most the quoted amount, to the deposit address', () => {
  const dep = 'd'.repeat(64), msg = (o = {}) => JSON.stringify({ deadline: 'x', signer_id: 'me.near', intents: [{ intent: 'transfer', receiver_id: dep, tokens: { 'imt:abc:nep141:wrap.near': '100' } }], ...o });
  const ctx = { signer: 'me.near', depositAddress: dep, asset: 'nep141:wrap.near', maxAmount: '100' };
  assert.ok(pay.checkIntent(msg(), ctx));
  assert.throws(() => pay.checkIntent(msg(), { ...ctx, maxAmount: '99' }), /unexpected/);
  assert.throws(() => pay.checkIntent(msg({ signer_id: 'evil.near' }), ctx), /unexpected/);
  assert.throws(() => pay.checkIntent(msg({ intents: [{ intent: 'transfer', receiver_id: 'evil.near', tokens: { 'nep141:wrap.near': '1' } }] }), ctx), /unexpected/);
  assert.throws(() => pay.checkIntent(msg({ intents: [{ intent: 'ft_withdraw', token: 'wrap.near', receiver_id: dep, amount: '1' }] }), ctx), /unexpected/);
  assert.throws(() => pay.checkIntent(msg({ intents: [{ intent: 'transfer', receiver_id: dep, tokens: { 'nep141:usdt.tether-token.near': '1' } }] }), ctx), /unexpected/);
});

test('wallet signature (base64) becomes NEAR Intents signedData', () => {
  const nonce = Buffer.alloc(32, 7).toString('base64');
  const s = pay.signedFromWallet({ message: '{}', nonce, recipient: 'intents.near', publicKey: 'ed25519:' + '2'.repeat(44), signature: Buffer.alloc(64, 1).toString('base64') });
  assert.equal(s.standard, 'nep413');
  assert.match(s.signature, /^ed25519:[1-9A-HJ-NP-Za-km-z]+$/);
  assert.throws(() => pay.signedFromWallet({ message: '{}', nonce, recipient: 'evil.near', publicKey: 'ed25519:' + '2'.repeat(44), signature: 'x' }), /payload/);
});

test('spoken NEAR addresses: only the misheard suffix is fixed', () => {
  assert.equal(pay.normalizeRecipient('ro52.nir'), 'ro52.near');
  assert.equal(pay.normalizeRecipient('RO52 dot near'), 'ro52.near');
  assert.equal(pay.normalizeRecipient('anna.neer'), 'anna.near');
  assert.equal(pay.normalizeRecipient('mcloven1.tg'), 'mcloven1.tg');
  assert.equal(pay.normalizeRecipient('ro52.near'), 'ro52.near');
});

test('other chains: addresses are checked per chain, unknown chains refused', () => {
  assert.ok(pay.validAddress('bsc', '0x2527D02599Ba641c19FEa793cD0F167589a0f10D'));
  assert.ok(!pay.validAddress('bsc', 'anna.near'));
  assert.ok(pay.validAddress('sol', '13QkxhNMrTPxoCkRdYdJ65tFuwXPhL5gLS2Z5Nr6gjRK'));
  assert.ok(pay.validAddress('tron', 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9'));
  assert.ok(!pay.validAddress('tron', '0x2527D02599Ba641c19FEa793cD0F167589a0f10D'));
  assert.ok(!pay.validAddress('doge', 'D123'));
  pay.ASSETS['USDT@bsc'] = pay.ASSETS['USDT@bsc'] || { assetId: 'nep141:bsc-test.omft.near', decimals: 18, symbol: 'USDT', chain: 'bsc', usd: 1 };
  const q = pay.buildQuote({ action: 'send', amount: '2', token: 'USDT', toChain: 'bsc', to: '0x2527D02599Ba641c19FEa793cD0F167589a0f10D', from: 'me.near', source: 'private' });
  assert.equal(q.recipientType, 'DESTINATION_CHAIN');
  assert.equal(q.depositType, 'CONFIDENTIAL_INTENTS');
  assert.throws(() => pay.buildQuote({ action: 'send', amount: '2', token: 'USDT', toChain: 'bsc', to: 'anna.near', from: 'me.near' }), /BNB Chain address/);
});
