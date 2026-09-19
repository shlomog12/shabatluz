import { test } from 'node:test';
import assert from 'node:assert/strict';
import { suggestWeekdayMincha } from '../src/domain/minchaSuggestion.js';

test('suggestWeekdayMincha: מחשב לפי הדלקת נרות + 30 דק\' שקיעה - היסט, מעוגל ל-5', () => {
  // candle 18:00 -> sunset 18:30 -> minus 20 -> 18:10 -> מעוגל כבר לכפולה של 5
  assert.equal(suggestWeekdayMincha('18:00', 20), '18:10');
});

test('suggestWeekdayMincha: מעגל לכפולה הקרובה של 5 דקות', () => {
  // candle 18:03 -> sunset 18:33 -> minus 20 -> 18:13 -> מתעגל ל-18:15
  assert.equal(suggestWeekdayMincha('18:03', 20), '18:15');
});
