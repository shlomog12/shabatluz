import { CONFIG } from '../config.js';

/**
 * שמירה/שחזור/מחיקה של מצב הטופס ב-localStorage. אחראי רק על
 * הסנכרון בין ה-DOM ל-localStorage; החלטות UI (כגון אישור מחיקה,
 * רענון הדף) הן באחריות שכבת האפליקציה (src/app.js).
 */

/** שומר את כל ערכי הטופס הנוכחיים ל-localStorage. */
export function saveFormToStorage() {
  const data = {};
  // הבחירה כוללת גם input[type="radio"]:checked באופן גנרי, למקרה
  // שבעתיד יתווספו כפתורי רדיו לטופס (כרגע אין כאלה בפועל).
  document.querySelectorAll('input:not([type="radio"]), select, input[type="radio"]:checked').forEach(el => {
    if (el.type === 'checkbox') data[el.id] = el.checked;
    else if (el.type === 'radio') data[el.name] = el.value;
    else data[el.id] = el.value;
  });
  localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(data));
}

/**
 * משחזר ערכי טופס שנשמרו קודם ב-localStorage, אם קיימים.
 * @returns {boolean} true אם היה קאש שמור ושוחזר
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

/** מוחק את הקאש השמור. */
export function clearStoredSettings() {
  localStorage.removeItem(CONFIG.CACHE_KEY);
}
