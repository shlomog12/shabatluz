import { CONFIG } from './config.js';
import { loadParashaRecords } from './csv/parashaRepository.js';
import { buildSchedule } from './domain/scheduleGenerator.js';
import { suggestWeekdayMincha } from './domain/minchaSuggestion.js';
import { readFormState } from './ui/formBinding.js';
import { initTimeInputs } from './ui/timeInput.js';
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
 * The app's entry point: wires together the data layer (CSV), the
 * pure logic layer (domain/*), and the DOM layer (ui/*, storage/*).
 * This is the only module that knows about all the layers at once.
 */

// The single source of truth for parasha data (instead of embedding it
// as dataset attributes on <option> elements in the DOM, as in the
// previous version).
let parashaRecords = [];

// The raw (WhatsApp text) message most recently generated, used by the copy button.
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

/** Regenerates and saves to cache, but only once a parasha has been selected. */
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
  initTimeInputs();

  document.getElementById('parasha')?.addEventListener('change', () => {
    updateWeekdayMinchaSuggestion();
    generateAndPersist();
  });
  document.getElementById('mincha-pm')?.addEventListener('input', generateAndPersist);
  document.getElementById('mincha-week')?.addEventListener('input', generateAndPersist);

  document.getElementById('stoggle')?.addEventListener('click', toggleSettingsPanel);
  document.getElementById('clear-cache-btn')?.addEventListener('click', handleClearCache);
  document.getElementById('reset-link')?.addEventListener('click', handleResetTemplate);

  // Each template row's "show row" checkbox: syncs appearance + regenerates
  CONFIG.ALL_ROWS.forEach(([rowId, checkboxId]) => {
    document.getElementById(checkboxId)?.addEventListener('change', () => {
      syncRowVisibility(rowId, checkboxId);
      generateAndPersist();
    });
  });

  // Every other field in the "edit template" panel (text/number/time/select) just regenerates
  document.querySelectorAll(
    '#settings-panel input[type="text"], #settings-panel input[type="number"]'
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
    console.error('Failed to load parasha data from CSV:', error);
    showLoadError();
  }
}

window.addEventListener('DOMContentLoaded', init);
