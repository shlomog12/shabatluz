import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitCSVLine, parseCSV } from '../src/csv/csvParser.js';

test('splitCSVLine: splits a simple line on commas', () => {
  assert.deepEqual(splitCSVLine('a,b,c'), ['a', 'b', 'c']);
});

test('splitCSVLine: supports a comma inside a quoted field', () => {
  assert.deepEqual(splitCSVLine('"a, b",c'), ['a, b', 'c']);
});

test('splitCSVLine: supports double quotes ("") as an escaped quote inside a quoted field', () => {
  assert.deepEqual(splitCSVLine('"שמיני עצרת ושמ""ת",17:57'), ['שמיני עצרת ושמ"ת', '17:57']);
});

test('parseCSV: turns CSV text into an array of objects keyed by header', () => {
  const text = 'a,b\n1,2\n3,4\n';
  assert.deepEqual(parseCSV(text), [{ a: '1', b: '2' }, { a: '3', b: '4' }]);
});

test('parseCSV: silently skips a row whose field count does not match the headers', () => {
  const text = 'a,b\n1,2\n3\n5,6\n';
  assert.deepEqual(parseCSV(text), [{ a: '1', b: '2' }, { a: '5', b: '6' }]);
});

test('parseCSV: a header-only file (no data rows) returns an empty array', () => {
  assert.deepEqual(parseCSV('a,b\n'), []);
});
