import { CONFIG } from '../config.js';

/** Updates a template row's appearance based on its checkbox state. */
export function syncRowVisibility(rowId, checkboxId) {
  const checked = document.getElementById(checkboxId)?.checked;
  document.getElementById(rowId)?.classList.toggle('disabled', !checked);
}

/** Syncs the appearance of every template row (used on init / after cache restore). */
export function syncAllRowsVisibility() {
  CONFIG.ALL_ROWS.forEach(([rowId, checkboxId]) => syncRowVisibility(rowId, checkboxId));
}

/** Opens/closes the "edit template" panel. */
export function toggleSettingsPanel() {
  const panel = document.getElementById('settings-panel');
  const toggleBtn = document.getElementById('stoggle');
  if (!panel || !toggleBtn) return;
  const opening = panel.style.display === 'none';
  panel.style.display = opening ? 'block' : 'none';
  toggleBtn.classList.toggle('open', opening);
}

/** Resets every template field to its default value (CONFIG.DEFAULTS). */
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
