import { parseCSV } from './csvParser.js';

/**
 * @typedef {Object} ParashaRecord
 * @property {string} name - Parasha name (shown in the dropdown and message)
 * @property {string} candle - Candle-lighting time, "HH:MM"
 * @property {string|null} havdalah - Havdalah time, "HH:MM", or null if
 *   not applicable (e.g. a Yom Tov that falls on Shabbat, with no
 *   separate havdalah time)
 * @property {boolean} mevorchim - Whether this is Shabbat Mevorchim
 * @property {boolean} isDst - Whether this Shabbat falls in DST
 */

/**
 * Loads and parses the CSV file at the given path, returning an array
 * of valid ParashaRecord entries (rows missing a name or candle time
 * are filtered out).
 * @param {string} csvPath
 * @returns {Promise<ParashaRecord[]>}
 */
export async function loadParashaRecords(csvPath) {
  const response = await fetch(csvPath);
  if (!response.ok) {
    throw new Error(`Failed to load CSV file: ${response.statusText}`);
  }

  const csvText = await response.text();
  return parseCSV(csvText)
    .map(toParashaRecord)
    .filter(Boolean);
}

function toParashaRecord(row) {
  const name = row.parasha?.trim();
  const candle = row.candle?.trim();
  // Name and candle-lighting time are required. Havdalah may be
  // missing (e.g. a Yom Tov that falls on Shabbat) - the parasha is
  // still shown, but the generated message omits the arvit/havdalah
  // lines for it (see domain/scheduleGenerator.js).
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
