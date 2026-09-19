/* ============================================================
 * עזרי זמן וגישה לטופס
 * ============================================================ */

/** ממיר מחרוזת "HH:MM" למספר דקות מחצות. מחרוזת ריקה/חסרה -> 0. */
const toM = t => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/** ממיר מספר דקות מחצות בחזרה למחרוזת "HH:MM", עם גלישה סביב חצות (0-1439). */
const frM = m => {
  const wrapped = ((m % 1440) + 1440) % 1440;
  return `${String(Math.floor(wrapped / 60)).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`;
};

/** מעגל דקות כלפי מעלה לכפולה של 5. */
const r5 = m => Math.ceil(m / 5) * 5;

/** ערך שדה טופס לפי מזהה (מחרוזת ריקה אם השדה לא קיים). */
const val = id => document.getElementById(id)?.value || '';

/** מצב checkbox לפי מזהה (false אם השדה לא קיים). */
const chk = id => document.getElementById(id)?.checked || false;

/** כמו val(), אך ממיר למספר שלם. שדה ריק/לא תקין -> 0 (לא NaN). */
const numVal = id => {
  const n = parseInt(val(id), 10);
  return Number.isNaN(n) ? 0 : n;
};

/** בורח מתווי HTML מיוחדים, למניעת הזרקת תגיות דרך שדות טקסט חופשיים. */
const escapeHtml = s => s.replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[c]);

/** ההודעה הגולמית (טקסט וואטסאפ) שנוצרה לאחרונה על ידי gen(), לשימוש doCopy(). */
let raw = '';

/* ============================================================
 * טעינה ופירוס של קובץ ה-CSV (זמני הדלקת נרות/הבדלה לכל פרשה)
 * ============================================================ */

/**
 * טוען את קובץ ה-CSV שמוגדר ב-CONFIG.CSV_FILE_PATH, ובונה ממנו
 * את רשימת הפרשות בתפריט הנפתח (id="parasha").
 */
async function loadParashotCSV() {
  const selectEl = document.getElementById('parasha');
  if (!selectEl) return;

  try {
    const response = await fetch(CONFIG.CSV_FILE_PATH);
    if (!response.ok) {
      throw new Error(`שגיאה בטעינת קובץ CSV: ${response.statusText}`);
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);

    // ניקוי אפשרויות קיימות והוספת ברירת מחדל
    selectEl.innerHTML = '<option value="">-- בחר פרשה --</option>';

    rows.forEach(row => {
      const name = row.parasha?.trim();
      const candle = row.candle?.trim();
      const havdalah = row.havdalah?.trim();
      const mevorchim = row.mevorchim?.trim() || '0';
      const isDst = row.is_dst?.trim() || '0';

      // שם ושעת הדלקת נרות הם חובה. הבדלה יכולה להיות חסרה (למשל בחג
      // שחל בשבת) - הפרשה עדיין תוצג, רק שההודעה שתיווצר לא תכלול
      // עבורה שורות ערבית/צאת שבת (ראו gen()).
      if (!name || !candle) return;

      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      option.dataset.c = candle;
      if (havdalah) {
        option.dataset.h = havdalah;
      }
      if (mevorchim === '1' || mevorchim.toLowerCase() === 'true') {
        option.dataset.m = '1';
      }
      // שעון קיץ/חורף לפרשה זו, כפי שמוגדר בעמודת is_dst בקובץ ה-CSV.
      option.dataset.dst = (isDst === '1' || isDst.toLowerCase() === 'true') ? '1' : '0';
      selectEl.appendChild(option);
    });

    loadFromCache();
    if (selectEl.value) {
      updateWkMincha();
      gen();
    }
  } catch (error) {
    console.error('נכשלה טעינת נתוני הפרשות מה-CSV:', error);
    const errEl = document.getElementById('load-error');
    if (errEl) errEl.style.display = 'block';
  }
}

/**
 * מפצל שורת CSV בודדת לשדות, בתמיכה בפסיקים בתוך שדה מצוטט (כפי
 * שאקסל/Google Sheets מייצאים אותם) וגרשיים כפולים ("") כגרש בודד.
 */
function splitCSVLine(line) {
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
 * פרסר CSV פשוט. שורה שמספר השדות בה לא תואם לכותרות מדולגת בשקט.
 */
function parseCSV(text) {
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

/* ============================================================
 * ממשק פאנל ההגדרות (פתיחה/סגירה, שורות מושבתות)
 * ============================================================ */

/** מעדכן את מראה השורה (row) בהתאם למצב תיבת הסימון (checkbox) שלה. */
function syncRow(rowId, chkId) {
  document.getElementById(rowId)?.classList.toggle('disabled', !document.getElementById(chkId)?.checked);
}

/** פותח/סוגר את פאנל "עריכת טמפלט". */
function toggleSettings() {
  const p = document.getElementById('settings-panel');
  const b = document.getElementById('stoggle');
  if (!p || !b) return;
  const open = p.style.display === 'none';
  p.style.display = open ? 'block' : 'none';
  b.classList.toggle('open', open);
}

/* ============================================================
 * שמירה/שחזור של הגדרות המשתמש ב-localStorage
 * ============================================================ */

/** שומר את כל ערכי הטופס הנוכחיים ל-localStorage. */
function saveToCache() {
  const data = {};
  // הבחירה כוללת גם input[type="radio"]:checked באופן גנרי, למקרה
  // שבעתיד יתווספו כפתורי רדיו לטופס (כרגע אין כאלה בפועל).
  document.querySelectorAll('input:not([type="radio"]), select, input[type="radio"]:checked').forEach(el => {
    if (el.type === 'checkbox') data[el.id] = el.checked;
    else if (el.type === 'radio') data[el.name] = el.value;
    else data[el.id] = el.value;
  });
  localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(data));
}

/** משחזר ערכי טופס שנשמרו קודם ב-localStorage, אם קיימים. */
function loadFromCache() {
  const cached = localStorage.getItem(CONFIG.CACHE_KEY);
  if (!cached) return;
  const data = JSON.parse(cached);
  Object.keys(data).forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (el.type === 'checkbox') el.checked = data[id];
      else el.value = data[id];
    } else {
      const radio = document.querySelector(`input[name="${id}"][value="${data[id]}"]`);
      if (radio) radio.checked = true;
    }
  });

  CONFIG.ALL_ROWS.forEach(([r, c]) => {
    const el = document.getElementById(c);
    if (el) document.getElementById(r)?.classList.toggle('disabled', !el.checked);
  });
}

/** מוחק את הקאש השמור ומרענן את הדף (לאחר אישור המשתמש). */
function clearCache() {
  if (confirm('האם אתה בטוח שברצונך למחוק את כל הבחירות השמורות ולאפס הכל?')) {
    localStorage.removeItem(CONFIG.CACHE_KEY);
    location.reload();
  }
}

/** מאפס את כל שדות הטמפלט לערכי ברירת המחדל שלהם (CONFIG.DEFAULTS). */
function resetSettings() {
  Object.entries(CONFIG.DEFAULTS).forEach(([id, v]) => {
    const el = document.getElementById(id);
    if (el && id !== 'parasha') el.value = v;
  });
  CONFIG.ALL_ROWS.forEach(([r, c]) => {
    const el = document.getElementById(c);
    if (el) el.checked = !CONFIG.UNCHECKED_BY_DEFAULT.includes(c);
    document.getElementById(r)?.classList.toggle('disabled', !el.checked);
  });
  updateWkMincha();
  autoGen();
}

/* ============================================================
 * חישוב וייצור לוח הזמנים
 * ============================================================ */

/** מציע שעת מנחה לאמצע השבוע, לפי זמן ההדלקה של הפרשה הנבחרת. */
function updateWkMincha() {
  const sel = document.getElementById('parasha');
  if (!sel || sel.selectedIndex < 0) return;
  const o = sel.options[sel.selectedIndex];
  if (o && o.value) {
    const candleTime = o.dataset.c;
    const candleM = toM(candleTime);
    const sunSetM = candleM + 30; // השקיעה 30 דקות לאחר הדלקת נרות
    const minchaMinutesBeforeSunset = numVal('mincha-minutes-before-sunset');
    const roundedM = Math.round((sunSetM - minchaMinutesBeforeSunset) / 5) * 5;
    const minchaWeekInput = document.getElementById('mincha-week');
    if (minchaWeekInput) minchaWeekInput.value = frM(roundedM);
  }
}

/** מפעיל gen() ושומר לקאש, אך רק אם כבר נבחרה פרשה. */
function autoGen() {
  if (document.getElementById('parasha')?.value) {
    gen();
    saveToCache();
  }
}

/**
 * מייצר את הודעת לוח הזמנים (טקסט וואטסאפ) לפי הפרשה הנבחרת וכל
 * הגדרות הטמפלט, ומציג אותה בתצוגה המקדימה.
 */
function gen() {
  const sel = document.getElementById('parasha');
  if (!sel || sel.selectedIndex < 0) return;
  const o = sel.options[sel.selectedIndex];
  if (!o || !o.value) return;

  const parasha = o.value;
  const c = o.dataset.c;   // זמן הדלקת נרות
  const h = o.dataset.h;   // זמן הבדלה (עשוי להיות חסר)
  const mevorchim = o.dataset.m === '1';
  const kayitz = o.dataset.dst === '1'; // שעון קיץ/חורף, לפי עמודת is_dst בקובץ ה-CSV

  const pm = val('mincha-pm');
  const pmWeek = val('mincha-week');
  const arvitOffset = numVal('arvit-offset-minutes');
  const arvitRound = val('arvit-round');

  // ערך שדה שתלוי בעונה (קיץ/חורף), למשל 'fix-chavura' -> fix-chavura-s / fix-chavura-w
  const seasonVal = baseId => val(kayitz ? `${baseId}-s` : `${baseId}-w`);

  // --- זמני ערב שבת (יחסית להדלקת נרות) ---
  const cM = toM(c);
  const tlvM = cM + 5;
  const kabM = r5(cM + numVal('off-kabbalat'));
  const shirM = kabM - numVal('off-shir');
  const sunM = cM + numVal('off-shki');

  // --- זמני שחרית שבת (תלויי עונה) ---
  const chavura = seasonVal('fix-chavura');
  const shacharit = seasonVal('fix-shacharit');
  const yeladimM = toM(shacharit) + 90;
  const yeladim = frM(yeladimM);
  const gdola = seasonVal('fix-gdola');
  const nashim = val('fix-nashim');

  // --- ערבית וצאת שבת ---
  // h (הבדלה) יכול להיות חסר - למשל בחג שחל בשבת ואין לו זמן הבדלה נפרד.
  // במקרה כזה פשוט לא נציג את שורות ערבית/צאת שבת, במקום להציג 00:00 שגוי.
  let arvit = null;
  let tzet = null;
  if (h) {
    const arvitBaseM = toM(h);
    let arvitM = arvitBaseM + arvitOffset;
    if (arvitRound === 'up') arvitM = Math.ceil(arvitM / 5) * 5;
    else if (arvitRound === 'down') arvitM = Math.floor(arvitM / 5) * 5;
    arvit = frM(arvitM);
    tzet = frM(arvitBaseM);
  }

  // --- זמני אחר הצהריים (יחסית למנחה שבת אחה"צ) ---
  const pmM = toM(pm);
  const chLimudM = pmM - numVal('off-chlimud');
  const onegM = pmM - numVal('off-oneg');
  const horimM = pmM - numVal('off-horim');

  const kabStr = mevorchim ? `${val('lbl-kabbalat')} (קרליבך) - ${frM(kabM)}` : `${val('lbl-kabbalat')} - ${frM(kabM)}`;

  // --- הרכבת הודעת הוואטסאפ שורה אחר שורה ---
  const lines = [`*לו"ז שבת ${parasha}*`, '', `זמן הדלקת נרות - ${c} (בתל אביב ${frM(tlvM)})`];
  if (chk('show-shir')) lines.push(`* ${val('lbl-shir')} - ${frM(shirM)}`);
  if (chk('show-kabbalat')) lines.push(`* *${kabStr}*`);
  if (chk('show-shki')) lines.push(`* ${val('lbl-shki')} - ${frM(sunM)}`);
  lines.push('');
  if (chk('show-chavura')) lines.push(`* ${val('lbl-chavura')} - ${chavura}`);
  if (chk('show-shacharit')) lines.push(`*${val('lbl-shacharit')} - ${shacharit}*`);
  if (chk('show-yeladim')) lines.push(`* ${val('lbl-yeladim')} - ${yeladim}`);
  lines.push('');
  if (chk('show-gdola')) lines.push(`*${val('lbl-gdola')} - ${gdola}*`);
  lines.push('');
  if (chk('show-nashim')) lines.push(`* ${val('lbl-nashim')} - ${nashim}`);
  if (chk('show-chlimud')) lines.push(`* ${val('lbl-chlimud')} - ${frM(chLimudM)}`);
  if (chk('show-oneg')) {
    const livui = chk('show-livui') ? ' *(בליווי הורה/מבוגר)*' : '';
    lines.push(`* ${val('lbl-oneg')} - ${frM(onegM)}${livui}`);
  }
  if (chk('show-horim')) lines.push(`* ${val('lbl-horim')} - ${frM(horimM)}`);
  lines.push(`*מנחה - ${pm}*`);
  if (arvit && tzet) {
    lines.push('', `*ערבית:* ${arvit}`, `*צאת שבת:* ${tzet}`);
  }

  if (chk('show-wk-shach') || chk('show-wk-arvit')) {
    lines.push('', '___________________________', '*_תפילות אמצע שבוע:_*');
    if (chk('show-wk-shach')) lines.push(`*שחרית:* ${val('fix-wk-shach')} (יום ו' ${val('fix-wk-fri')})`);
    lines.push(`*מנחה:* ${pmWeek}`);
    if (chk('show-wk-arvit')) lines.push(`*ערבית:* ${val('fix-wk-arvit')}`);
  }
  lines.push('', '*שבת שלום!*');
  raw = lines.join('\n');

  // --- הצגת התצוגה המקדימה (בועת וואטסאפ) ---
  // בורחים מה-HTML לפני הפיכת *...*/_..._ לתגיות, כדי שטקסט חופשי
  // שהוזן בשדות התווית (lbl-*) לא יוכל להזריק HTML/תגיות לתצוגה.
  const rWA = t => escapeHtml(t)
    .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>');
  const bubbleEl = document.getElementById('bubble');
  const btimeEl = document.getElementById('btime');
  const pwEl = document.getElementById('pw');

  if (bubbleEl) bubbleEl.innerHTML = rWA(raw).replace(/\n/g, '<br>');
  if (btimeEl) btimeEl.textContent = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  if (pwEl) pwEl.classList.add('visible');
}

/* ============================================================
 * העתקה ללוח (כפתור "העתק לוואטסאפ")
 * ============================================================ */

/** מעתיק את ההודעה האחרונה שנוצרה ללוח, ומציג משוב זמני על הכפתור. */
function doCopy() {
  if (!raw) return;
  navigator.clipboard.writeText(raw).then(() => {
    const b = document.getElementById('cbtn');
    const s = document.getElementById('copy-status');
    if (b) {
      b.innerHTML = '✓ הועתק!';
      b.classList.add('copied');
    }
    if (s) {
      s.className = 'copy-status success';
      s.textContent = '✅ הועתק!';
    }
    setTimeout(() => {
      if (b) {
        b.innerHTML = 'העתק לוואטסאפ';
        b.classList.remove('copied');
      }
      if (s) s.className = 'copy-status';
    }, 2000);
  });
}

/* ============================================================
 * חיווט מאזיני אירועים (נקרא פעם אחת באתחול)
 * ============================================================ */

/** מחווט את כל הטופס: בחירת פרשה, כפתורים, ושורות פאנל "עריכת טמפלט". */
function initEventListeners() {
  document.getElementById('parasha')?.addEventListener('change', () => { updateWkMincha(); autoGen(); });
  document.getElementById('mincha-pm')?.addEventListener('input', autoGen);
  document.getElementById('mincha-week')?.addEventListener('input', autoGen);

  document.getElementById('stoggle')?.addEventListener('click', toggleSettings);
  document.getElementById('cbtn')?.addEventListener('click', doCopy);
  document.getElementById('clear-cache-btn')?.addEventListener('click', clearCache);
  document.getElementById('reset-link')?.addEventListener('click', resetSettings);

  // checkbox "הצג שורה" של כל שורת טמפלט: מסנכרן מראה + מייצר מחדש
  CONFIG.ALL_ROWS.forEach(([rowId, chkId]) => {
    document.getElementById(chkId)?.addEventListener('change', () => { syncRow(rowId, chkId); autoGen(); });
  });

  // כל שאר שדות פאנל "עריכת טמפלט" (טקסט/מספר/שעה/בחירה) רק מייצרים מחדש
  document.querySelectorAll(
    '#settings-panel input[type="text"], #settings-panel input[type="number"], #settings-panel input[type="time"]'
  ).forEach(el => el.addEventListener('input', autoGen));
  document.querySelectorAll('#settings-panel select').forEach(el => el.addEventListener('change', autoGen));
}

/* ============================================================
 * אתחול
 * ============================================================ */

window.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  loadParashotCSV();
});
