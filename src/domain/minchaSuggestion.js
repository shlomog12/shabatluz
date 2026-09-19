import { toM, frM } from '../utils/time.js';

// קירוב: השקיעה מוערכת כ-30 דקות אחרי זמן הדלקת הנרות המקומי. משמש
// רק להצעה אוטומטית לשעת מנחה באמצע השבוע - ניתן לדריסה ידנית תמיד.
const SUNSET_AFTER_CANDLE_MINUTES = 30;

/**
 * מחשב הצעה לשעת מנחה באמצע השבוע, לפי זמן הדלקת הנרות של הפרשה
 * הנבחרת ומספר הדקות הרצוי לפני השקיעה. פונקציה טהורה.
 * @param {string} candleTime - "HH:MM"
 * @param {number} minutesBeforeSunset
 * @returns {string} "HH:MM" מעוגל לכפולה של 5
 */
export function suggestWeekdayMincha(candleTime, minutesBeforeSunset) {
  const candleM = toM(candleTime);
  const sunsetM = candleM + SUNSET_AFTER_CANDLE_MINUTES;
  const roundedM = Math.round((sunsetM - minutesBeforeSunset) / 5) * 5;
  return frM(roundedM);
}
