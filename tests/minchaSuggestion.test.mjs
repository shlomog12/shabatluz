import { test } from 'node:test';
import assert from 'node:assert/strict';
import { suggestWeekdayMincha } from '../src/domain/minchaSuggestion.js';

test('suggestWeekdayMincha: computes from candle-lighting + 30min sunset estimate - offset, rounded to 5', () => {
  // candle 18:00 -> sunset 18:30 -> minus 20 -> 18:10 -> already a multiple of 5
  assert.equal(suggestWeekdayMincha('18:00', 20), '18:10');
});

test('suggestWeekdayMincha: rounds to the nearest multiple of 5 minutes', () => {
  // candle 18:03 -> sunset 18:33 -> minus 20 -> 18:13 -> rounds to 18:15
  assert.equal(suggestWeekdayMincha('18:03', 20), '18:15');
});
