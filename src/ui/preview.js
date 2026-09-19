/** מציג HTML מוכן (שכבר עבר עיבוד ב-utils/format.js) בבועת התצוגה המקדימה. */
export function showSchedulePreview(html) {
  const bubbleEl = document.getElementById('bubble');
  const btimeEl = document.getElementById('btime');
  const pwEl = document.getElementById('pw');

  if (bubbleEl) bubbleEl.innerHTML = html;
  if (btimeEl) btimeEl.textContent = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  if (pwEl) pwEl.classList.add('visible');
}

/**
 * מחווט את כפתור "העתק לוואטסאפ". מקבל getRawText() ולא מחרוזת קבועה,
 * כדי תמיד להעתיק את ההודעה האחרונה שנוצרה, גם אם היא השתנתה מאז
 * שהכפתור חוּוַט.
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
