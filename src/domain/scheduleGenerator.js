import { toM, frM, r5 } from '../utils/time.js';

// הפרש משוער בין זמן הדלקת הנרות המקומי (גבעת הרואה) לזה של תל אביב,
// המוצג כשורת עזר בראש ההודעה.
const CANDLE_TO_TLV_OFFSET_MINUTES = 5;

// תפילת ילדים מתחילה קבוע 90 דקות אחרי תחילת שחרית.
const YELADIM_AFTER_SHACHARIT_MINUTES = 90;

/**
 * @typedef {Object} FormState - ערכי טופס נוכחיים (ראו ui/formBinding.js),
 *   עם שדות מספריים כבר מומרים למספר (0 אם ריק/לא תקין) ותיבות סימון
 *   כבר מומרות ל-boolean.
 */

/**
 * מייצר את הודעת לוח הזמנים (מערך שורות + טקסט מלא) עבור פרשה נתונה
 * וערכי טופס נוכחיים. פונקציה טהורה - אינה נוגעת ב-DOM וניתנת לבדיקה
 * באופן מבודד.
 * @param {import('../csv/parashaRepository.js').ParashaRecord} parasha
 * @param {FormState} form
 * @returns {{lines: string[], raw: string}}
 */
export function buildSchedule(parasha, form) {
  const { name: parashaName, candle, havdalah, mevorchim, isDst } = parasha;

  // ערך שדה שתלוי בעונה (קיץ/חורף), למשל 'fix-chavura' -> fix-chavura-s/-w
  const seasonVal = baseId => form[isDst ? `${baseId}-s` : `${baseId}-w`];

  // --- זמני ערב שבת (יחסית להדלקת נרות) ---
  const candleM = toM(candle);
  const tlvM = candleM + CANDLE_TO_TLV_OFFSET_MINUTES;
  const kabbalatM = r5(candleM + form['off-kabbalat']);
  const shirM = kabbalatM - form['off-shir'];
  const sunsetM = candleM + form['off-shki'];

  // --- זמני שחרית שבת (תלויי עונה) ---
  const chavura = seasonVal('fix-chavura');
  const shacharit = seasonVal('fix-shacharit');
  const yeladim = frM(toM(shacharit) + YELADIM_AFTER_SHACHARIT_MINUTES);
  const gdola = seasonVal('fix-gdola');
  const nashim = form['fix-nashim'];

  // --- ערבית וצאת שבת ---
  // havdalah עשוי להיות חסר (חג שחל בשבת) - במקרה כזה לא נציג את
  // שורות ערבית/צאת שבת, במקום להציג 00:00 שגוי.
  let arvit = null;
  let tzet = null;
  if (havdalah) {
    const havdalahM = toM(havdalah);
    let arvitM = havdalahM + form['arvit-offset-minutes'];
    if (form['arvit-round'] === 'up') arvitM = Math.ceil(arvitM / 5) * 5;
    else if (form['arvit-round'] === 'down') arvitM = Math.floor(arvitM / 5) * 5;
    arvit = frM(arvitM);
    tzet = frM(havdalahM);
  }

  // --- זמני אחר הצהריים (יחסית למנחה שבת אחה"צ) ---
  const pm = form['mincha-pm'];
  const pmM = toM(pm);
  const chLimudM = pmM - form['off-chlimud'];
  const onegM = pmM - form['off-oneg'];
  const horimM = pmM - form['off-horim'];

  const kabbalatLabel = mevorchim
    ? `${form['lbl-kabbalat']} (קרליבך) - ${frM(kabbalatM)}`
    : `${form['lbl-kabbalat']} - ${frM(kabbalatM)}`;

  // --- הרכבת הודעת הוואטסאפ שורה אחר שורה ---
  const lines = [`*לו"ז שבת ${parashaName}*`, '', `זמן הדלקת נרות - ${candle} (בתל אביב ${frM(tlvM)})`];
  if (form['show-shir']) lines.push(`* ${form['lbl-shir']} - ${frM(shirM)}`);
  if (form['show-kabbalat']) lines.push(`* *${kabbalatLabel}*`);
  if (form['show-shki']) lines.push(`* ${form['lbl-shki']} - ${frM(sunsetM)}`);
  lines.push('');
  if (form['show-chavura']) lines.push(`* ${form['lbl-chavura']} - ${chavura}`);
  if (form['show-shacharit']) lines.push(`*${form['lbl-shacharit']} - ${shacharit}*`);
  if (form['show-yeladim']) lines.push(`* ${form['lbl-yeladim']} - ${yeladim}`);
  lines.push('');
  if (form['show-gdola']) lines.push(`*${form['lbl-gdola']} - ${gdola}*`);
  lines.push('');
  if (form['show-nashim']) lines.push(`* ${form['lbl-nashim']} - ${nashim}`);
  if (form['show-chlimud']) lines.push(`* ${form['lbl-chlimud']} - ${frM(chLimudM)}`);
  if (form['show-oneg']) {
    const livui = form['show-livui'] ? ' *(בליווי הורה/מבוגר)*' : '';
    lines.push(`* ${form['lbl-oneg']} - ${frM(onegM)}${livui}`);
  }
  if (form['show-horim']) lines.push(`* ${form['lbl-horim']} - ${frM(horimM)}`);
  lines.push(`*מנחה - ${pm}*`);
  if (arvit && tzet) {
    lines.push('', `*ערבית:* ${arvit}`, `*צאת שבת:* ${tzet}`);
  }

  if (form['show-wk-shach'] || form['show-wk-arvit']) {
    lines.push('', '___________________________', '*_תפילות אמצע שבוע:_*');
    if (form['show-wk-shach']) lines.push(`*שחרית:* ${form['fix-wk-shach']} (יום ו' ${form['fix-wk-fri']})`);
    lines.push(`*מנחה:* ${form['mincha-week']}`);
    if (form['show-wk-arvit']) lines.push(`*ערבית:* ${form['fix-wk-arvit']}`);
  }
  lines.push('', '*שבת שלום!*');

  return { lines, raw: lines.join('\n') };
}
