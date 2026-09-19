import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSchedule } from '../src/domain/scheduleGenerator.js';
import { CONFIG } from '../src/config.js';

/** Builds a base FormState from CONFIG.DEFAULTS + every "show" row checked (except UNCHECKED_BY_DEFAULT). */
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

test('buildSchedule: includes the parasha name and candle-lighting time', () => {
  const { raw } = buildSchedule(winterParasha, baseForm());
  assert.ok(raw.includes('וירא'));
  assert.ok(raw.includes('16:25'));
});

test('buildSchedule: Shabbat Mevorchim adds "(קרליבך)" to the kabbalat shabbat line', () => {
  const { raw } = buildSchedule({ ...winterParasha, mevorchim: true }, baseForm());
  assert.ok(raw.includes('(קרליבך)'));
});

test('buildSchedule: no havdalah (Yom Tov falling on Shabbat) - arvit/havdalah lines are omitted', () => {
  // Turns off the "midweek prayers" block (which has its own "ערבית:"
  // line unrelated to havdalah) to isolate the Shabbat-end lines.
  const form = baseForm({ 'show-wk-shach': false, 'show-wk-arvit': false });
  const { raw } = buildSchedule({ ...winterParasha, havdalah: null }, form);
  assert.ok(!raw.includes('ערבית:'));
  assert.ok(!raw.includes('צאת שבת:'));
});

test('buildSchedule: an unchecked "show" checkbox hides the corresponding line', () => {
  const { raw } = buildSchedule(winterParasha, baseForm({ 'show-nashim': false }));
  assert.ok(!raw.includes(CONFIG.DEFAULTS['lbl-nashim']));
});

test('buildSchedule: picks summer/winter times based on the parasha\'s isDst flag', () => {
  const form = baseForm();
  const winter = buildSchedule({ ...winterParasha, isDst: false }, form);
  const summer = buildSchedule({ ...winterParasha, isDst: true }, form);
  assert.ok(winter.raw.includes(CONFIG.DEFAULTS['fix-shacharit-w']));
  assert.ok(summer.raw.includes(CONFIG.DEFAULTS['fix-shacharit-s']));
});

test('buildSchedule: an empty numeric field (0 after conversion) does not produce NaN in the message', () => {
  const { raw } = buildSchedule(winterParasha, baseForm({ 'off-kabbalat': 0, 'off-chlimud': 0 }));
  assert.ok(!raw.includes('NaN'));
});

test('buildSchedule: a large offset from an early mincha time does not produce a negative time in the message', () => {
  const form = baseForm({ 'mincha-pm': '00:20', 'off-chlimud': 60 });
  const { raw } = buildSchedule(winterParasha, form);
  assert.ok(!/-\d/.test(raw), 'a dash before a digit (negative time) should not appear in the message');
});

test('buildSchedule: "(בליווי הורה/מבוגר)" only appears when show-livui is on', () => {
  const without = buildSchedule(winterParasha, baseForm());
  const withLivui = buildSchedule(winterParasha, baseForm({ 'show-livui': true }));
  assert.ok(!without.raw.includes('בליווי הורה/מבוגר'));
  assert.ok(withLivui.raw.includes('בליווי הורה/מבוגר'));
});
