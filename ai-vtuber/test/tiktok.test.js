import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hediyeCoz } from '../src/giris/tiktok.js';

test('kombo sürerken hediye işlenmez, bitince toplam elmas hesaplanır', () => {
  const g = { giftType: 1, diamondCount: 1, giftName: 'Rose' };
  assert.equal(hediyeCoz({ giftDetails: g, repeatEnd: false, repeatCount: 3 }), null);
  assert.deepEqual(hediyeCoz({ giftDetails: g, repeatEnd: true, repeatCount: 12, user: { nickname: 'Ayşe' } }),
    { ad: 'Ayşe', hediye: 'Rose', elmas: 12 });
});

test('kombosuz hediye hemen işlenir', () => {
  const h = hediyeCoz({ giftDetails: { giftType: 2, diamondCount: 199, giftName: 'Corgi' }, repeatCount: 1, user: { uniqueId: 'x1' } });
  assert.deepEqual(h, { ad: 'x1', hediye: 'Corgi', elmas: 199 });
});
