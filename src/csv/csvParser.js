/**
 * General-purpose CSV parser (not tied to the weekly-parasha data schema).
 * Pure module - no dependency on the DOM or fetch.
 */

/**
 * Splits a single CSV line into fields, supporting commas inside a
 * quoted field (as Excel/Google Sheets export them) and double quotes
 * ("") as an escaped single quote.
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
 * Parses full CSV text into an array of objects (header row + data
 * rows). A row whose field count doesn't match the header count is
 * silently skipped.
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
