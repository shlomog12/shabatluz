import { CONFIG } from './config.js';
import { loadParashaRecords } from './csv/parashaRepository.js';
import { buildSchedule } from './domain/scheduleGenerator.js';
import { suggestWeekdayMincha } from './domain/minchaSuggestion.js';
import { readFormState } from './ui/formBinding.js';
import { toWhatsAppHtml } from './utils/format.js';
import { showSchedulePreview, wireCopyButton } from './ui/preview.js';
import {
  syncRowVisibility,
  syncAllRowsVisibility,
  toggleSettingsPanel,
  resetTemplateSettings
} from './ui/templatePanel.js';
import { saveFormToStorage, loadFormFromStorage, clearStoredSettings } from './storage/settingsStore.js';

/**
 * נקודת הכניסה של האפליקציה: מחברת בין שכבת הנתונים (CSV), שכבת
 * הלוגיקה הטהורה (domain/*) ושכבת ה-DOM (ui/*, storage/*).
 * זהו המודול היחיד שמכיר את כל השכבות יחד.
 */

// מקור האמת היחיד לנתוני הפרשות (במקום להטמיע אותם כ-dataset על
// אלמנטי <option> ב-DOM, כפי שהיה בגרסה הקודמת).
let parashaRecords = [];

// ההודעה הגולמית (טקסט וואטסאפ) שנוצרה לאחרונה, לשימוש כפתור ההעתקה.
let lastGeneratedMessage = '';

function findParasha(name) {
  return parashaRecords.find(p => p.name === name) ?? null;
}

function getSelectedParasha() {
  const selectEl = document.getElementById('parasha');
  return selectEl?.value ? findParasha(selectEl.value) : null;
}

function updateWeekdayMinchaSuggestion() {
  const parasha = getSelectedParasha();
  if (!parasha) return;

  const minutesBeforeSunset = readFormState()['mincha-minutes-before-sunset'];
  const minchaWeekInput = document.getElementById('mincha-week');
  if (minchaWeekInput) {
    minchaWeekInput.value = suggestWeekdayMincha(parasha.candle, minutesBeforeSunset);
  }
}

function generateSchedule() {
  const parasha = getSelectedParasha();
  if (!parasha) return;

  const { raw } = buildSchedule(parasha, readFormState());
  lastGeneratedMessage = raw;
  showSchedulePreview(toWhatsAppHtml(raw));
}

/** מייצר מחדש ושומר לקאש, אך רק אם כבר נבחרה פרשה. */
function generateAndPersist() {
  if (!document.getElementById('parasha')?.value) return;
  generateSchedule();
  saveFormToStorage();
}

function populateParashaSelect() {
  const selectEl = document.getElementById('parasha');
  if (!selectEl) return;

  selectEl.innerHTML = '<option value="">-- בחר פרשה --</option>';
  parashaRecords.forEach(parasha => {
    const option = document.createElement('option');
    option.value = parasha.name;
    option.textContent = parasha.name;
    selectEl.appendChild(option);
  });
}

function showLoadError() {
  const errEl = document.getElementById('load-error');
  if (errEl) errEl.style.display = 'block';
}

function handleClearCache() {
  if (!confirm('האם אתה בטוח שברצונך למחוק את כל הבחירות השמורות ולאפס הכל?')) return;
  clearStoredSettings();
  location.reload();
}

function handleResetTemplate() {
  resetTemplateSettings();
  updateWeekdayMinchaSuggestion();
  generateAndPersist();
}

function bindEvents() {
  document.getElementById('parasha')?.addEventListener('change', () => {
    updateWeekdayMinchaSuggestion();
    generateAndPersist();
  });
  document.getElementById('mincha-pm')?.addEventListener('input', generateAndPersist);
  document.getElementById('mincha-week')?.addEventListener('input', generateAndPersist);

  document.getElementById('stoggle')?.addEventListener('click', toggleSettingsPanel);
  document.getElementById('clear-cache-btn')?.addEventListener('click', handleClearCache);
  document.getElementById('reset-link')?.addEventListener('click', handleResetTemplate);

  // checkbox "הצג שורה" של כל שורת טמפלט: מסנכרן מראה + מייצר מחדש
  CONFIG.ALL_ROWS.forEach(([rowId, checkboxId]) => {
    document.getElementById(checkboxId)?.addEventListener('change', () => {
      syncRowVisibility(rowId, checkboxId);
      generateAndPersist();
    });
  });

  // כל שאר שדות פאנל "עריכת טמפלט" (טקסט/מספר/שעה/בחירה) רק מייצרים מחדש
  document.querySelectorAll(
    '#settings-panel input[type="text"], #settings-panel input[type="number"], #settings-panel input[type="time"]'
  ).forEach(el => el.addEventListener('input', generateAndPersist));
  document.querySelectorAll('#settings-panel select').forEach(el => el.addEventListener('change', generateAndPersist));

  wireCopyButton(() => lastGeneratedMessage);
}

async function init() {
  bindEvents();

  try {
    parashaRecords = await loadParashaRecords(CONFIG.CSV_FILE_PATH);
    populateParashaSelect();
    loadFormFromStorage();
    syncAllRowsVisibility();

    if (document.getElementById('parasha')?.value) {
      updateWeekdayMinchaSuggestion();
      generateSchedule();
    }
  } catch (error) {
    console.error('נכשלה טעינת נתוני הפרשות מה-CSV:', error);
    showLoadError();
  }
}

window.addEventListener('DOMContentLoaded', init);
