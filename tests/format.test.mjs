import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, toWhatsAppHtml } from '../src/utils/format.js';

test('escapeHtml: escapes all special HTML characters', () => {
  assert.equal(escapeHtml('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  assert.equal(escapeHtml("it's & <b>"), 'it&#39;s &amp; &lt;b&gt;');
});

test('toWhatsAppHtml: converts *bold* and _italic_ to tags', () => {
  assert.equal(toWhatsAppHtml('*שלום* _עולם_'), '<strong>שלום</strong> <em>עולם</em>');
});

test('toWhatsAppHtml: converts newlines to <br>', () => {
  assert.equal(toWhatsAppHtml('שורה א\nשורה ב'), 'שורה א<br>שורה ב');
});

test('toWhatsAppHtml: escapes HTML before applying Markdown syntax (prevents injection)', () => {
  const malicious = '*<img src=x onerror=alert(1)>*';
  const html = toWhatsAppHtml(malicious);
  assert.ok(!html.includes('<img'), 'should not contain a raw <img> tag');
  assert.equal(html, '<strong>&lt;img src=x onerror=alert(1)&gt;</strong>');
});
