'use strict';
const menuButton = document.querySelector('.menu-button');
const menu = document.querySelector('#site-nav');
const closeMenu = () => { menu?.classList.remove('open'); menuButton?.setAttribute('aria-expanded', 'false'); };
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menu?.classList.toggle('open', open);
});
menu?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') { closeMenu(); menuButton.focus(); } });
document.addEventListener('click', e => { if (menuButton && !e.target.closest('.header')) closeMenu(); });
const toast = (message) => {
  const el = document.querySelector('.toast');
  if (!el) return;
  el.textContent = message; el.classList.add('show');
  clearTimeout(window.toastTimer); window.toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
};
async function copyText(text) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try { await navigator.clipboard.writeText(text); return; } catch (_) {}
  }
  const area = document.createElement('textarea');
  area.value = text; area.style.cssText = 'position:fixed;left:-9999px;top:0';
  document.body.append(area); area.focus(); area.select();
  const ok = document.execCommand('copy'); area.remove();
  if (!ok) throw new Error('copy failed');
}
document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
  try { await copyText(button.dataset.copy); toast('이메일 주소를 복사했습니다.'); } catch (_) { toast('주소를 선택해서 복사해 주세요.'); }
}));
document.querySelector('[data-copy-resume]')?.addEventListener('click', async e => {
  const button = e.currentTarget;
  try {
    const response = await fetch('../downloads/resume.txt');
    if (!response.ok) throw new Error('load failed');
    await copyText(await response.text()); toast('이력서 원고를 복사했습니다. Word에 붙여넣어 주세요.');
  } catch (_) { toast('복사하지 못했어요. 옆의 원고 내려받기를 이용해 주세요.'); }
  button.focus();
});
