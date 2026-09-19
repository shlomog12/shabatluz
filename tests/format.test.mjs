import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, toWhatsAppHtml } from '../src/utils/format.js';

test('escapeHtml: בורח מכל תווי ה-HTML המיוחדים', () => {
  assert.equal(escapeHtml('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  assert.equal(escapeHtml("it's & <b>"), 'it&#39;s &amp; &lt;b&gt;');
});

test('toWhatsAppHtml: ממיר *מודגש* ו-_נטוי_ לתגיות', () => {
  assert.equal(toWhatsAppHtml('*שלום* _עולם_'), '<strong>שלום</strong> <em>עולם</em>');
});

test('toWhatsAppHtml: ממיר ירידות שורה ל-<br>', () => {
  assert.equal(toWhatsAppHtml('שורה א\nשורה ב'), 'שורה א<br>שורה ב');
});

test('toWhatsAppHtml: בורח מ-HTML לפני החלת תחביר Markdown (מונע הזרקה)', () => {
  const malicious = '*<img src=x onerror=alert(1)>*';
  const html = toWhatsAppHtml(malicious);
  assert.ok(!html.includes('<img'), 'לא אמור להכיל תגית <img> גולמית');
  assert.equal(html, '<strong>&lt;img src=x onerror=alert(1)&gt;</strong>');
});
