import { CONFIG } from '../config.js';

/**
 * Saving/restoring/clearing form state in localStorage. Responsible
 * only for syncing the DOM with localStorage; UI decisions (e.g.
 * confirming deletion, reloading the page) belong to the app layer
 * (src/app.js).
 */

/** Saves every current form value to localStorage. */
export function saveFormToStorage() {
  const data = {};
  // Also generically includes input[type="radio"]:checked, in case
  // radio buttons are added to the form in the future (none exist
  // currently).
  document.querySelectorAll('input:not([type="radio"]), select, input[type="radio"]:checked').forEach(el => {
    if (el.type === 'checkbox') data[el.id] = el.checked;
    else if (el.type === 'radio') data[el.name] = el.value;
    else data[el.id] = el.value;
  });
  localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(data));
}

/**
 * Restores previously saved form values from localStorage, if any.
 * @returns {boolean} true if a saved cache existed and was restored
 */
export function loadFormFromStorage() {
  const cached = localStorage.getItem(CONFIG.CACHE_KEY);
  if (!cached) return false;

  const data = JSON.parse(cached);
  Object.keys(data).forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (el.type === 'checkbox') el.checked = data[id];
      else el.value = data[id];
    } else {
      const radio = document.querySelector(`input[name="${id}"][value="${data[id]}"]`);
      if (radio) radio.checked = true;
    }
  });
  return true;
}

/** Clears the saved cache. */
export function clearStoredSettings() {
  localStorage.removeItem(CONFIG.CACHE_KEY);
}
