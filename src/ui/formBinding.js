import { CONFIG } from '../config.js';

/**
 * The single boundary between the DOM and the pure logic layer: reads
 * every relevant form field and returns a "clean" FormState object
 * (numbers already converted to numbers, checkboxes already converted
 * to booleans), so domain/* never has to know about elements or raw
 * string values.
 */

let allFieldIds = null;

function getAllFieldIds() {
  if (!allFieldIds) {
    const checkboxIds = CONFIG.ALL_ROWS.map(([, checkboxId]) => checkboxId);
    allFieldIds = [...Object.keys(CONFIG.DEFAULTS), ...checkboxIds];
  }
  return allFieldIds;
}

/** Converts a string to an integer; empty/invalid -> 0 (not NaN). */
function toIntOrZero(value) {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? 0 : n;
}

/**
 * Reads the current form state from the DOM.
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
