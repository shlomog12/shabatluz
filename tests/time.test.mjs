import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toM, frM, r5 } from '../src/utils/time.js';

test('toM: converts "HH:MM" to minutes since midnight', () => {
  assert.equal(toM('00:00'), 0);
  assert.equal(toM('01:30'), 90);
  assert.equal(toM('18:45'), 1125);
});

test('toM: empty/missing input returns 0', () => {
  assert.equal(toM(''), 0);
  assert.equal(toM(undefined), 0);
  assert.equal(toM(null), 0);
});

test('frM: converts minutes back to "HH:MM" with leading zeros', () => {
  assert.equal(frM(0), '00:00');
  assert.equal(frM(90), '01:30');
  assert.equal(frM(1125), '18:45');
});

test('frM: wraps around midnight for negative values', () => {
  assert.equal(frM(-30), '23:30');
  assert.equal(frM(-1), '23:59');
});

test('frM: wraps around midnight for values above 24:00', () => {
  assert.equal(frM(1440), '00:00');
  assert.equal(frM(1500), '01:00');
});

test('r5: rounds up to the nearest multiple of 5', () => {
  assert.equal(r5(0), 0);
  assert.equal(r5(1), 5);
  assert.equal(r5(5), 5);
  assert.equal(r5(6), 10);
});
