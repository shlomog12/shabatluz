
    const CACHE_KEY = 'givat_haroe_schedule_v1';
    const toM = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const frM = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    const r5 = m => Math.ceil(m / 5) * 5;
    const val = id => document.getElementById(id).value;
    const chk = id => document.getElementById(id).checked;
    let raw = '';

    const DEFAULTS = {
      'parasha': '', 'mincha-pm': '18:00', 'mincha-week': '13:30',
      'off-shir': 10, 'off-kabbalat': 15, 'off-shki': 30, 'mincha-minutes-before-sunset': 20,
      'arvit-offset-minutes': 0, 'arvit-round': 'none',
      'fix-chavura-s': '08:00', 'fix-chavura-w': '07:30',
      'fix-shacharit-s': '08:30', 'fix-shacharit-w': '08:00',
      'fix-yeladim-s': '10:00', 'fix-yeladim-w': '09:30',
      'fix-gdola-s': '13:15', 'fix-gdola-w': '12:30',
      'off-chlimud': 60, 'off-oneg': 35, 'off-horim': 20,
      'fix-wk-shach': '06:20', 'fix-wk-fri': '06:30', 'fix-wk-arvit': '20:15',
      'lbl-shir': 'שיר השירים', 'lbl-kabbalat': 'מנחה וקבלת שבת', 'lbl-shki': 'שקיעה',
      'lbl-chavura': 'חבורא בעין איה', 'lbl-shacharit': 'שחרית', 'lbl-yeladim': 'תפילת ילדים',
      'lbl-gdola': 'מנחה גדולה', 'lbl-chlimud': 'חבורת לימוד פרשת שבוע',
      'lbl-oneg': 'עונג שבת לילדים', 'lbl-horim': 'לימוד הורים וילדים'
    };

    const ALL_ROWS = [
      ['row-shir', 'show-shir'], ['row-kabbalat', 'show-kabbalat'], ['row-shki', 'show-shki'],
      ['row-chavura', 'show-chavura'], ['row-shacharit', 'show-shacharit'], ['row-yeladim', 'show-yeladim'],
      ['row-gdola', 'show-gdola'], ['row-chlimud', 'show-chlimud'], ['row-oneg', 'show-oneg'],
      ['row-livui', 'show-livui'], ['row-horim', 'show-horim'], ['row-mincha-sunset', 'show-mincha-sunset'],
      ['row-wk-shach', 'show-wk-shach'], ['row-wk-arvit', 'show-wk-arvit']
    ];

    function syncRow(rowId, chkId) {
      document.getElementById(rowId).classList.toggle('disabled', !document.getElementById(chkId).checked);
    }

    function toggleSettings() {
      const p = document.getElementById('settings-panel');
      const b = document.getElementById('stoggle');
      const open = p.style.display === 'none';
      p.style.display = open ? 'block' : 'none';
      b.classList.toggle('open', open);
    }

    function saveToCache() {
      const data = {};
      // Save all inputs and selects
      document.querySelectorAll('input:not([type="radio"]), select, input[type="radio"]:checked').forEach(el => {
        if (el.type === 'checkbox') data[el.id] = el.checked;
        else if (el.type === 'radio') data[el.name] = el.value;
        else data[el.id] = el.value;
      });
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    }

    function loadFromCache() {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return;
      const data = JSON.parse(cached);
      Object.keys(data).forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          if (el.type === 'checkbox') el.checked = data[id];
          else el.value = data[id];
        } else {
          // Check for radio buttons by name
          const radio = document.querySelector(`input[name="${id}"][value="${data[id]}"]`);
          if (radio) radio.checked = true;
        }
      });
      // Sync row UI
      ALL_ROWS.forEach(([r, c]) => {
        const el = document.getElementById(c);
        if (el) document.getElementById(r)?.classList.toggle('disabled', !el.checked);
      });
    }

    function clearCache() {
      if (confirm('האם אתה בטוח שברצונך למחוק את כל הבחירות השמורות ולאפס הכל?')) {
        localStorage.removeItem(CACHE_KEY);
        location.reload();
      }
    }

    function resetSettings() {
      Object.entries(DEFAULTS).forEach(([id, v]) => { const el = document.getElementById(id); if (el && id !== 'parasha') el.value = v; });
      ALL_ROWS.forEach(([r, c]) => {
        const el = document.getElementById(c);
        if (el) el.checked = (c !== 'show-livui');
        document.getElementById(r)?.classList.toggle('disabled', !el.checked);
      });
      updateWkMincha();
      autoGen();
    }

    function updateWkMincha() {
      const sel = document.getElementById('parasha');
      const o = sel.options[sel.selectedIndex];
      if (o && o.value) {
        const candleTime = o.dataset.c;
        const candleM = toM(candleTime);
        const sunSetM = candleM + 30; // Sunset is 30 minutes after candle lighting
        const minchaMinutesBeforeSunset = parseInt(val('mincha-minutes-before-sunset'));
        const roundedM = Math.round((sunSetM - minchaMinutesBeforeSunset) / 5) * 5;
        document.getElementById('mincha-week').value = frM(roundedM);
      }
    }

    function autoGen() {
      if (document.getElementById('parasha').value) {
        gen();
        saveToCache();
      }
    }

    function gen() {
      const sel = document.getElementById('parasha');
      const o = sel.options[sel.selectedIndex];
      if (!o || !o.value) return;

      const parasha = o.value;
      const c = o.dataset.c;
      const h = o.dataset.h;
      const mevorchim = o.dataset.m === '1';
      const pm = val('mincha-pm');
      const pmWeek = val('mincha-week');
      const kayitz = document.querySelector('input[name="season"]:checked').value === 'summer';
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
      document.getElementById('bubble').innerHTML = rWA(raw.replace(/\n/g, '<br>'));
      document.getElementById('btime').textContent = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
      document.getElementById('pw').classList.add('visible');
    }

    function doCopy() {
      if (!raw) return;
      navigator.clipboard.writeText(raw).then(() => {
        const b = document.getElementById('cbtn');
        const s = document.getElementById('copy-status');
        b.innerHTML = '✓ הועתק!'; b.classList.add('copied');
        s.className = 'copy-status success'; s.textContent = '✅ הועתק!';
        setTimeout(() => {
          b.innerHTML = 'העתק לוואטסאפ'; b.classList.remove('copied'); s.className = 'copy-status';
        }, 2000);
      });
    }

    // Initialization
    window.addEventListener('DOMContentLoaded', () => {
      loadFromCache();
      if (document.getElementById('parasha').value) gen();
    });