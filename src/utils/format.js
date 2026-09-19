/**
 * Converts free text / a schedule message into safe display HTML.
 * Pure module - no dependency on the DOM.
 */

/** Escapes special HTML characters, to prevent tag injection via free-text fields. */
export const escapeHtml = s => s.replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[c]);

/**
 * Converts message text (including light WhatsApp-style Markdown syntax:
 * *bold*, _italic_) into display HTML. Escapes HTML before applying the
 * syntax, so free text (e.g. from editable label fields) can't inject
 * its own tags into the preview.
 */
export const toWhatsAppHtml = text => escapeHtml(text)
  .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
  .replace(/_(.*?)_/g, '<em>$1</em>')
  .replace(/\n/g, '<br>');
