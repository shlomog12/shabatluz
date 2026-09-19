import { toM, frM } from '../utils/time.js';

// Approximation: sunset is estimated as 30 minutes after the local
// candle-lighting time. Used only for the auto-suggested weekday
// mincha time - always manually overridable.
const SUNSET_AFTER_CANDLE_MINUTES = 30;

/**
 * Computes a suggested weekday mincha time, based on the selected
 * parasha's candle-lighting time and the desired number of minutes
 * before sunset. Pure function.
 * @param {string} candleTime - "HH:MM"
 * @param {number} minutesBeforeSunset
 * @returns {string} "HH:MM", rounded to the nearest multiple of 5
 */
export function suggestWeekdayMincha(candleTime, minutesBeforeSunset) {
  const candleM = toM(candleTime);
  const sunsetM = candleM + SUNSET_AFTER_CANDLE_MINUTES;
  const roundedM = Math.round((sunsetM - minutesBeforeSunset) / 5) * 5;
  return frM(roundedM);
}
