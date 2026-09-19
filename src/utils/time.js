/**
 * Conversions between an "HH:MM" time string and minutes-since-midnight.
 * Pure module - no dependency on the DOM or UI.
 */

/** Converts "HH:MM" to minutes since midnight. Empty/missing input -> 0. */
export const toM = t => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/** Converts minutes-since-midnight back to "HH:MM", wrapping around midnight (0-1439). */
export const frM = m => {
  const wrapped = ((m % 1440) + 1440) % 1440;
  return `${String(Math.floor(wrapped / 60)).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`;
};

/** Rounds minutes up to the nearest multiple of 5. */
export const r5 = m => Math.ceil(m / 5) * 5;
