import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitCSVLine, parseCSV } from '../src/csv/csvParser.js';

test('splitCSVLine: מפצל שורה פשוטה לפי פסיקים', () => {
  assert.deepEqual(splitCSVLine('a,b,c'), ['a', 'b', 'c']);
});

test('splitCSVLine: תומך בפסיק בתוך שדה מצוטט', () => {
  assert.deepEqual(splitCSVLine('"a, b",c'), ['a, b', 'c']);
});

test('splitCSVLine: תומך בגרשיים כפולים ("") כגרש בודד בתוך שדה מצוטט', () => {
  assert.deepEqual(splitCSVLine('"שמיני עצרת ושמ""ת",17:57'), ['שמיני עצרת ושמ"ת', '17:57']);
});

test('parseCSV: הופך טקסט CSV למערך אובייקטים לפי כותרות', () => {
  const text = 'a,b\n1,2\n3,4\n';
  assert.deepEqual(parseCSV(text), [{ a: '1', b: '2' }, { a: '3', b: '4' }]);
});

test('parseCSV: מדלג בשקט על שורה שמספר השדות בה לא תואם לכותרות', () => {
  const text = 'a,b\n1,2\n3\n5,6\n';
  assert.deepEqual(parseCSV(text), [{ a: '1', b: '2' }, { a: '5', b: '6' }]);
});

test('parseCSV: קובץ עם כותרות בלבד (ללא נתונים) מחזיר מערך ריק', () => {
  assert.deepEqual(parseCSV('a,b\n'), []);
});
