/** Shows pre-built HTML (already processed by utils/format.js) in the preview bubble. */
export function showSchedulePreview(html) {
  const bubbleEl = document.getElementById('bubble');
  const btimeEl = document.getElementById('btime');
  const pwEl = document.getElementById('pw');

  if (bubbleEl) bubbleEl.innerHTML = html;
  if (btimeEl) btimeEl.textContent = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  if (pwEl) pwEl.classList.add('visible');
}

/**
 * Wires up the "copy to WhatsApp" button. Takes getRawText() rather
 * than a fixed string, so it always copies the latest generated
 * message, even if it changed after the button was wired up.
 */
export function wireCopyButton(getRawText) {
  document.getElementById('cbtn')?.addEventListener('click', () => copyToClipboard(getRawText()));
}

function copyToClipboard(raw) {
  if (!raw) return;
  navigator.clipboard.writeText(raw).then(() => {
    const btn = document.getElementById('cbtn');
    const status = document.getElementById('copy-status');
    if (btn) {
      btn.innerHTML = '✓ הועתק!';
      btn.classList.add('copied');
    }
    if (status) {
      status.className = 'copy-status success';
      status.textContent = '✅ הועתק!';
    }
    setTimeout(() => {
      if (btn) {
        btn.innerHTML = 'העתק לוואטסאפ';
        btn.classList.remove('copied');
      }
      if (status) status.className = 'copy-status';
    }, 2000);
  });
}
