const toM = t => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const frM = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const r5 = m => Math.ceil(m / 5) * 5;
const val = id => document.getElementById(id)?.value || '';
const chk = id => document.getElementById(id)?.checked || false;

let raw = '';

/**
 * טעינה ופירוס של קובץ ה-CSV
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

      if (name && candle && havdalah) {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        option.dataset.c = candle;
        option.dataset.h = havdalah;
        if (mevorchim === '1' || mevorchim.toLowerCase() === 'true') {
          option.dataset.m = '1';
        }
        selectEl.appendChild(option);
      }
    });

    loadFromCache();
    if (selectEl.value) {
      updateWkMincha();
      gen();
    }
  } catch (error) {
    console.error('נכשלה טעינת נתוני הפרשות מה-CSV:', error);
  }
}

/**
 * פונקציית עזר לפרסום קובץ CSV
 */
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"(.*)"$/, '$1'));
  const results = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"(.*)"$/, '$1'));
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

function syncRow(rowId, chkId) {
  document.getElementById(rowId)?.classList.toggle('disabled', !document.getElementById(chkId)?.checked);
}

function toggleSettings() {
  const p = document.getElementById('settings-panel');
  const b = document.getElementById('stoggle');
  if (!p || !b) return;
  const open = p.style.display === 'none';
  p.style.display = open ? 'block' : 'none';
  b.classList.toggle('open', open);
}

function saveToCache() {
  const data = {};
  document.querySelectorAll('input:not([type="radio"]), select, input[type="radio"]:checked').forEach(el => {
    if (el.type === 'checkbox') data[el.id] = el.checked;
    else if (el.type === 'radio') data[el.name] = el.value;
    else data[el.id] = el.value;
  });
  localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(data));
}

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

function clearCache() {
  if (confirm('האם אתה בטוח שברצונך למחוק את כל הבחירות השמורות ולאפס הכל?')) {
    localStorage.removeItem(CONFIG.CACHE_KEY);
    location.reload();
  }
}

function resetSettings() {
  Object.entries(CONFIG.DEFAULTS).forEach(([id, v]) => {
    const el = document.getElementById(id);
    if (el && id !== 'parasha') el.value = v;
  });
  CONFIG.ALL_ROWS.forEach(([r, c]) => {
    const el = document.getElementById(c);
    if (el) el.checked = (c !== 'show-livui');
    document.getElementById(r)?.classList.toggle('disabled', !el.checked);
  });
  updateWkMincha();
  autoGen();
}

function updateWkMincha() {
  const sel = document.getElementById('parasha');
  if (!sel || sel.selectedIndex < 0) return;
  const o = sel.options[sel.selectedIndex];
  if (o && o.value) {
    const candleTime = o.dataset.c;
    const candleM = toM(candleTime);
    const sunSetM = candleM + 30; // השקיעה 30 דקות לאחר הדלקת נרות
    const minchaMinutesBeforeSunset = parseInt(val('mincha-minutes-before-sunset')) || 20;
    const roundedM = Math.round((sunSetM - minchaMinutesBeforeSunset) / 5) * 5;
    const minchaWeekInput = document.getElementById('mincha-week');
    if (minchaWeekInput) minchaWeekInput.value = frM(roundedM);
  }
}

function autoGen() {
  if (document.getElementById('parasha')?.value) {
    gen();
    saveToCache();
  }
}

function gen() {
  const sel = document.getElementById('parasha');
  if (!sel || sel.selectedIndex < 0) return;
  const o = sel.options[sel.selectedIndex];
  if (!o || !o.value) return;

  const parasha = o.value;
  const c = o.dataset.c;
  const h = o.dataset.h;
  const mevorchim = o.dataset.m === '1';
  const pm = val('mincha-pm');
  const pmWeek = val('mincha-week');
  const kayitz = document.querySelector('input[name="season"]:checked')?.value === 'summer';
  const arvitOffset = parseInt(val('arvit-offset-minutes')) || 0;
  const arvitRound = val('arvit-round');

  const cM = toM(c);
  const tlvM = cM + 5;
  const kabM = r5(cM + parseInt(val('off-kabbalat')));
  const shirM = kabM - parseInt(val('off-shir'));
  const sunM = cM + parseInt(val('off-shki'));

  const chavura = kayitz ? val('fix-chavura-s') : val('fix-chavura-w');
  const shacharit = kayitz ? val('fix-shacharit-s') : val('fix-shacharit-w');
  const yeladimM = toM(shacharit) + 90;
  const yeladim = frM(yeladimM);
  const gdola = kayitz ? val('fix-gdola-s') : val('fix-gdola-w');
  const nashim = val('fix-nashim');

  const arvitBaseM = toM(h);
  let arvitM = arvitBaseM + arvitOffset;
  if (arvitRound === 'up') arvitM = Math.ceil(arvitM / 5) * 5;
  else if (arvitRound === 'down') arvitM = Math.floor(arvitM / 5) * 5;
  const arvit = frM(arvitM);
  const tzet = frM(arvitBaseM);

  const pmM = toM(pm);
  const chLimudM = pmM - parseInt(val('off-chlimud'));
  const onegM = pmM - parseInt(val('off-oneg'));
  const horimM = pmM - parseInt(val('off-horim'));

  const kabStr = mevorchim ? `${val('lbl-kabbalat')} (קרליבך) - ${frM(kabM)}` : `${val('lbl-kabbalat')} - ${frM(kabM)}`;

  const L = [`*לו"ז שבת ${parasha}*`, '', `זמן הדלקת נרות - ${c} (בתל אביב ${frM(tlvM)})`];
  if (chk('show-shir')) L.push(`* ${val('lbl-shir')} - ${frM(shirM)}`);
  if (chk('show-kabbalat')) L.push(`* *${kabStr}*`);
  if (chk('show-shki')) L.push(`* ${val('lbl-shki')} - ${frM(sunM)}`);
  L.push('');
  if (chk('show-chavura')) L.push(`* ${val('lbl-chavura')} - ${chavura}`);
  if (chk('show-shacharit')) L.push(`*${val('lbl-shacharit')} - ${shacharit}*`);
  if (chk('show-yeladim')) L.push(`* ${val('lbl-yeladim')} - ${yeladim}`);
  L.push('');
  if (chk('show-gdola')) L.push(`*${val('lbl-gdola')} - ${gdola}*`);
  L.push('');
  if (chk('show-nashim')) L.push(`* ${val('lbl-nashim')} - ${nashim}`);
  if (chk('show-chlimud')) L.push(`* ${val('lbl-chlimud')} - ${frM(chLimudM)}`);
  if (chk('show-oneg')) {
    const livui = chk('show-livui') ? ' *(בליווי הורה/מבוגר)*' : '';
    L.push(`* ${val('lbl-oneg')} - ${frM(onegM)}${livui}`);
  }
  if (chk('show-horim')) L.push(`* ${val('lbl-horim')} - ${frM(horimM)}`);
  L.push(`*מנחה - ${pm}*`, '', `*ערבית:* ${arvit}`, `*צאת שבת:* ${tzet}`);

  if (chk('show-wk-shach') || chk('show-wk-arvit')) {
    L.push('', '___________________________', '*_תפילות אמצע שבוע:_*');
    if (chk('show-wk-shach')) L.push(`*שחרית:* ${val('fix-wk-shach')} (יום ו' ${val('fix-wk-fri')})`);
    L.push(`*מנחה:* ${pmWeek}`);
    if (chk('show-wk-arvit')) L.push(`*ערבית:* ${val('fix-wk-arvit')}`);
  }
  L.push('', '*שבת שלום!*');
  raw = L.join('\n');

  const rWA = t => t.replace(/\*(.*?)\*/g, '<strong>$1</strong>').replace(/_(.*?)_/g, '<em>$1</em>');
  const bubbleEl = document.getElementById('bubble');
  const btimeEl = document.getElementById('btime');
  const pwEl = document.getElementById('pw');

  if (bubbleEl) bubbleEl.innerHTML = rWA(raw.replace(/\n/g, '<br>'));
  if (btimeEl) btimeEl.textContent = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  if (pwEl) pwEl.classList.add('visible');
}

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

window.addEventListener('DOMContentLoaded', () => {
  loadParashotCSV();
});