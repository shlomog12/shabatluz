import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toM, frM, r5 } from '../src/utils/time.js';

test('toM: ממיר "HH:MM" לדקות מחצות', () => {
  assert.equal(toM('00:00'), 0);
  assert.equal(toM('01:30'), 90);
  assert.equal(toM('18:45'), 1125);
});

test('toM: קלט ריק/חסר מחזיר 0', () => {
  assert.equal(toM(''), 0);
  assert.equal(toM(undefined), 0);
  assert.equal(toM(null), 0);
});

test('frM: ממיר דקות בחזרה ל-"HH:MM" עם אפסים מובילים', () => {
  assert.equal(frM(0), '00:00');
  assert.equal(frM(90), '01:30');
  assert.equal(frM(1125), '18:45');
});

test('frM: גולש סביב חצות עבור ערכים שליליים', () => {
  assert.equal(frM(-30), '23:30');
  assert.equal(frM(-1), '23:59');
});

test('frM: גולש סביב חצות עבור ערכים מעל 24:00', () => {
  assert.equal(frM(1440), '00:00');
  assert.equal(frM(1500), '01:00');
});

test('r5: מעגל כלפי מעלה לכפולה של 5', () => {
  assert.equal(r5(0), 0);
  assert.equal(r5(1), 5);
  assert.equal(r5(5), 5);
  assert.equal(r5(6), 10);
});
