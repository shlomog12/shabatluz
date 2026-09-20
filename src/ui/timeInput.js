/**
 * Turns plain `.time-input` text fields into masked 24-hour time
 * entry, so displayed/entered times never depend on the browser's
 * locale (unlike native `<input type="time">`, whose AM/PM display
 * follows the OS region setting and ignores the page's `lang`).
 */

const COMPLETE_TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Formats raw digits as the user types: "1800" -> "18:00". */
function maskDigits(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

/** Clamps typed digits into a valid zero-padded "HH:MM", once the field loses focus. */
function normalizeTime(raw) {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const h = Math.min(23, parseInt(digits.slice(0, 2), 10) || 0);
  const m = Math.min(59, parseInt(digits.slice(2, 4), 10) || 0);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Wires masking on every `.time-input` field. Must run before other
 * 'input' listeners are attached to the same fields (e.g. the ones
 * that regenerate the schedule): while the typed value is still
 * incomplete, this stops the event from reaching them, so the
 * schedule isn't regenerated from a half-typed time.
 */
export function initTimeInputs(root = document) {
  root.querySelectorAll('.time-input').forEach(el => {
    el.addEventListener('input', event => {
      el.value = maskDigits(el.value);
      if (!COMPLETE_TIME_RE.test(el.value)) event.stopImmediatePropagation();
    });

    el.addEventListener('blur', () => {
      const normalized = normalizeTime(el.value);
      if (normalized !== el.value) {
        el.value = normalized;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  });
}
