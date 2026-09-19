import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSchedule } from '../src/domain/scheduleGenerator.js';
import { CONFIG } from '../src/config.js';

/** בונה FormState בסיסי מ-CONFIG.DEFAULTS + כל שורות ה"הצג" מסומנות (חוץ מ-UNCHECKED_BY_DEFAULT). */
function baseForm(overrides = {}) {
  const form = { ...CONFIG.DEFAULTS };
  CONFIG.ALL_ROWS.forEach(([, checkboxId]) => {
    form[checkboxId] = !CONFIG.UNCHECKED_BY_DEFAULT.includes(checkboxId);
  });
  return { ...form, ...overrides };
}

const winterParasha = {
  name: 'וירא', candle: '16:25', havdalah: '17:28', mevorchim: false, isDst: false
};

test('buildSchedule: כולל את שם הפרשה ואת זמן הדלקת הנרות', () => {
  const { raw } = buildSchedule(winterParasha, baseForm());
  assert.ok(raw.includes('וירא'));
  assert.ok(raw.includes('16:25'));
});

test('buildSchedule: שבת מברכים מוסיפה "(קרליבך)" לשורת קבלת שבת', () => {
  const { raw } = buildSchedule({ ...winterParasha, mevorchim: true }, baseForm());
  assert.ok(raw.includes('(קרליבך)'));
});

test('buildSchedule: ללא הבדלה (חג שחל בשבת) - שורות ערבית/צאת שבת של שבת מושמטות', () => {
  // מכבים את בלוק "תפילות אמצע שבוע" (שגם הוא מכיל שורת "ערבית:" משלו,
  // ללא קשר להבדלה) כדי לבודד את בדיקת שורות סוף השבת בלבד.
  const form = baseForm({ 'show-wk-shach': false, 'show-wk-arvit': false });
  const { raw } = buildSchedule({ ...winterParasha, havdalah: null }, form);
  assert.ok(!raw.includes('ערבית:'));
  assert.ok(!raw.includes('צאת שבת:'));
});

test('buildSchedule: checkbox "הצג" כבוי מסתיר את השורה המתאימה', () => {
  const { raw } = buildSchedule(winterParasha, baseForm({ 'show-nashim': false }));
  assert.ok(!raw.includes(CONFIG.DEFAULTS['lbl-nashim']));
});

test('buildSchedule: בוחר שעות קיץ/חורף לפי isDst של הפרשה', () => {
  const form = baseForm();
  const winter = buildSchedule({ ...winterParasha, isDst: false }, form);
  const summer = buildSchedule({ ...winterParasha, isDst: true }, form);
  assert.ok(winter.raw.includes(CONFIG.DEFAULTS['fix-shacharit-w']));
  assert.ok(summer.raw.includes(CONFIG.DEFAULTS['fix-shacharit-s']));
});

test('buildSchedule: שדה מספרי ריק (0 אחרי המרה) לא מייצר NaN בהודעה', () => {
  const { raw } = buildSchedule(winterParasha, baseForm({ 'off-kabbalat': 0, 'off-chlimud': 0 }));
  assert.ok(!raw.includes('NaN'));
});

test('buildSchedule: היסט גדול מזמן מנחה מוקדם לא מייצר זמן שלילי בהודעה', () => {
  const form = baseForm({ 'mincha-pm': '00:20', 'off-chlimud': 60 });
  const { raw } = buildSchedule(winterParasha, form);
  assert.ok(!/-\d/.test(raw), 'אין להופיע מקף לפני ספרה (זמן שלילי) בהודעה');
});

test('buildSchedule: "בליווי הורה/מבוגר" מופיע רק כש-show-livui דלוק', () => {
  const without = buildSchedule(winterParasha, baseForm());
  const withLivui = buildSchedule(winterParasha, baseForm({ 'show-livui': true }));
  assert.ok(!without.raw.includes('בליווי הורה/מבוגר'));
  assert.ok(withLivui.raw.includes('בליווי הורה/מבוגר'));
});
