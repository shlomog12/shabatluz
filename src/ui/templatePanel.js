import { CONFIG } from '../config.js';

/** מעדכן את מראה שורת טמפלט לפי מצב תיבת הסימון שלה. */
export function syncRowVisibility(rowId, checkboxId) {
  const checked = document.getElementById(checkboxId)?.checked;
  document.getElementById(rowId)?.classList.toggle('disabled', !checked);
}

/** מסנכרן את מראה כל שורות הטמפלט (לשימוש באתחול/לאחר שחזור קאש). */
export function syncAllRowsVisibility() {
  CONFIG.ALL_ROWS.forEach(([rowId, checkboxId]) => syncRowVisibility(rowId, checkboxId));
}

/** פותח/סוגר את פאנל "עריכת טמפלט". */
export function toggleSettingsPanel() {
  const panel = document.getElementById('settings-panel');
  const toggleBtn = document.getElementById('stoggle');
  if (!panel || !toggleBtn) return;
  const opening = panel.style.display === 'none';
  panel.style.display = opening ? 'block' : 'none';
  toggleBtn.classList.toggle('open', opening);
}

/** מאפס את כל שדות הטמפלט לערכי ברירת המחדל שלהם (CONFIG.DEFAULTS). */
export function resetTemplateSettings() {
  Object.entries(CONFIG.DEFAULTS).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el && id !== 'parasha') el.value = value;
  });

  CONFIG.ALL_ROWS.forEach(([rowId, checkboxId]) => {
    const el = document.getElementById(checkboxId);
    if (el) el.checked = !CONFIG.UNCHECKED_BY_DEFAULT.includes(checkboxId);
    syncRowVisibility(rowId, checkboxId);
  });
}
