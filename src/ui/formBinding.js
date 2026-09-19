import { CONFIG } from '../config.js';

/**
 * הגבול בין ה-DOM לשכבת הלוגיקה הטהורה: קורא את כל שדות הטופס
 * הרלוונטיים ומחזיר אובייקט FormState "נקי" (מספרים כבר מומרים
 * למספר, תיבות סימון כבר מומרות ל-boolean), כך ש-domain/* לא צריך
 * לדעת דבר על אלמנטים או ערכי מחרוזת גולמיים.
 */

let allFieldIds = null;

function getAllFieldIds() {
  if (!allFieldIds) {
    const checkboxIds = CONFIG.ALL_ROWS.map(([, checkboxId]) => checkboxId);
    allFieldIds = [...Object.keys(CONFIG.DEFAULTS), ...checkboxIds];
  }
  return allFieldIds;
}

/** ממיר מחרוזת למספר שלם; ריק/לא תקין -> 0 (לא NaN). */
function toIntOrZero(value) {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? 0 : n;
}

/**
 * קורא את מצב הטופס הנוכחי מה-DOM.
 * @returns {import('../domain/scheduleGenerator.js').FormState}
 */
export function readFormState() {
  const state = {};
  for (const id of getAllFieldIds()) {
    const el = document.getElementById(id);
    if (!el) continue;

    if (el.type === 'checkbox') {
      state[id] = el.checked;
    } else if (CONFIG.NUMERIC_FIELD_IDS.includes(id)) {
      state[id] = toIntOrZero(el.value);
    } else {
      state[id] = el.value || '';
    }
  }
  return state;
}
