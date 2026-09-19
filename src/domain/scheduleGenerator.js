import { toM, frM, r5 } from '../utils/time.js';

// Approximate offset between the local (Giv'at HaRoe) candle-lighting
// time and Tel Aviv's, shown as a helper line at the top of the message.
const CANDLE_TO_TLV_OFFSET_MINUTES = 5;

// Children's tefillah always starts 90 minutes after shacharit begins.
const YELADIM_AFTER_SHACHARIT_MINUTES = 90;

/**
 * @typedef {Object} FormState - Current form values (see
 *   ui/formBinding.js), with numeric fields already converted to
 *   numbers (0 if empty/invalid) and checkboxes already converted to
 *   booleans.
 */

/**
 * Builds the schedule message (array of lines + full text) for a given
 * parasha and the current form state. Pure function - doesn't touch
 * the DOM, and can be tested in isolation.
 * @param {import('../csv/parashaRepository.js').ParashaRecord} parasha
 * @param {FormState} form
 * @returns {{lines: string[], raw: string}}
 */
export function buildSchedule(parasha, form) {
  const { name: parashaName, candle, havdalah, mevorchim, isDst } = parasha;

  // Season-dependent field value, e.g. 'fix-chavura' -> fix-chavura-s/-w
  const seasonVal = baseId => form[isDst ? `${baseId}-s` : `${baseId}-w`];

  // --- Friday evening times (relative to candle-lighting) ---
  const candleM = toM(candle);
  const tlvM = candleM + CANDLE_TO_TLV_OFFSET_MINUTES;
  const kabbalatM = r5(candleM + form['off-kabbalat']);
  const shirM = kabbalatM - form['off-shir'];
  const sunsetM = candleM + form['off-shki'];

  // --- Shabbat morning times (season-dependent) ---
  const chavura = seasonVal('fix-chavura');
  const shacharit = seasonVal('fix-shacharit');
  const yeladim = frM(toM(shacharit) + YELADIM_AFTER_SHACHARIT_MINUTES);
  const gdola = seasonVal('fix-gdola');
  const nashim = form['fix-nashim'];

  // --- Arvit and havdalah ---
  // havdalah may be missing (a Yom Tov falling on Shabbat) - in that
  // case the arvit/havdalah lines are omitted rather than showing an
  // incorrect 00:00.
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

  // --- Afternoon times (relative to Shabbat afternoon mincha) ---
  const pm = form['mincha-pm'];
  const pmM = toM(pm);
  const chLimudM = pmM - form['off-chlimud'];
  const onegM = pmM - form['off-oneg'];
  const horimM = pmM - form['off-horim'];

  const kabbalatLabel = mevorchim
    ? `${form['lbl-kabbalat']} (קרליבך) - ${frM(kabbalatM)}`
    : `${form['lbl-kabbalat']} - ${frM(kabbalatM)}`;

  // --- Assembling the WhatsApp message, line by line ---
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
