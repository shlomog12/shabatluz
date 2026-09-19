import { parseCSV } from './csvParser.js';

/**
 * @typedef {Object} ParashaRecord
 * @property {string} name - שם הפרשה (מוצג בתפריט ובהודעה)
 * @property {string} candle - זמן הדלקת נרות, "HH:MM"
 * @property {string|null} havdalah - זמן הבדלה, "HH:MM", או null אם
 *   לא חל (למשל בחג שחל בשבת שאין לו זמן הבדלה נפרד)
 * @property {boolean} mevorchim - האם זו שבת מברכים
 * @property {boolean} isDst - האם השבת חלה בשעון קיץ
 */

/**
 * טוען ומפענח את קובץ ה-CSV שכתובתו ניתנת, ומחזיר מערך רשומות פרשה
 * תקינות בלבד (שורות ללא שם או ללא זמן הדלקת נרות מסוננות).
 * @param {string} csvPath
 * @returns {Promise<ParashaRecord[]>}
 */
export async function loadParashaRecords(csvPath) {
  const response = await fetch(csvPath);
  if (!response.ok) {
    throw new Error(`שגיאה בטעינת קובץ CSV: ${response.statusText}`);
  }

  const csvText = await response.text();
  return parseCSV(csvText)
    .map(toParashaRecord)
    .filter(Boolean);
}

function toParashaRecord(row) {
  const name = row.parasha?.trim();
  const candle = row.candle?.trim();
  // שם ושעת הדלקת נרות הם חובה. הבדלה יכולה להיות חסרה (למשל בחג
  // שחל בשבת) - הפרשה עדיין תוצג, רק שורות ערבית/צאת שבת יושמטו
  // מההודעה שתיווצר (ראו domain/scheduleGenerator.js).
  if (!name || !candle) return null;

  return {
    name,
    candle,
    havdalah: row.havdalah?.trim() || null,
    mevorchim: isTruthyFlag(row.mevorchim),
    isDst: isTruthyFlag(row.is_dst)
  };
}

function isTruthyFlag(value) {
  const v = (value?.trim() || '0').toLowerCase();
  return v === '1' || v === 'true';
}
