/**
 * המרות בין מחרוזת שעה "HH:MM" למספר דקות מחצות ובחזרה.
 * מודול טהור - ללא תלות ב-DOM או בממשק המשתמש.
 */

/** ממיר מחרוזת "HH:MM" למספר דקות מחצות. מחרוזת ריקה/חסרה -> 0. */
export const toM = t => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/** ממיר מספר דקות מחצות בחזרה למחרוזת "HH:MM", עם גלישה סביב חצות (0-1439). */
export const frM = m => {
  const wrapped = ((m % 1440) + 1440) % 1440;
  return `${String(Math.floor(wrapped / 60)).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`;
};

/** מעגל דקות כלפי מעלה לכפולה של 5. */
export const r5 = m => Math.ceil(m / 5) * 5;
