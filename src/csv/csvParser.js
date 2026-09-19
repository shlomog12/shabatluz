/**
 * פרסר CSV כללי (לא תלוי בסכמת הנתונים של פרשות השבוע).
 * מודול טהור - ללא תלות ב-DOM או ב-fetch.
 */

/**
 * מפצל שורת CSV בודדת לשדות, בתמיכה בפסיקים בתוך שדה מצוטט (כפי
 * שאקסל/Google Sheets מייצאים אותם) וגרשיים כפולים ("") כגרש בודד.
 */
export function splitCSVLine(line) {
  const fields = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { field += ch; }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(field.trim());
      field = '';
    } else {
      field += ch;
    }
  }
  fields.push(field.trim());
  return fields;
}

/**
 * מפענח טקסט CSV מלא למערך אובייקטים (שורת כותרות + שורות נתונים).
 * שורה שמספר השדות בה לא תואם למספר הכותרות מדולגת בשקט.
 */
export function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  const headers = splitCSVLine(lines[0]);
  const results = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i]);
    if (values.length === headers.length) {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index];
      });
      results.push(obj);
    }
  }

  return results;
}
