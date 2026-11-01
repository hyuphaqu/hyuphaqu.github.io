'use strict';
const menuButton=document.querySelector('.menu-button');
const siteNav=document.querySelector('#site-nav');
function closeMenu(){siteNav?.classList.remove('is-open');menuButton?.setAttribute('aria-expanded','false');menuButton?.setAttribute('aria-label','메뉴 열기');}
menuButton?.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';siteNav?.classList.toggle('is-open',open);menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'메뉴 닫기':'메뉴 열기');});
siteNav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menuButton?.getAttribute('aria-expanded')==='true'){closeMenu();menuButton.focus();}});
function showToast(text){const el=document.querySelector('.toast');if(!el)return;el.textContent=text;el.dataset.visible='true';clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>delete el.dataset.visible,2500);}
async function copyText(text){if(navigator.clipboard?.writeText&&isSecureContext){try{await navigator.clipboard.writeText(text);return;}catch(_){}}const area=document.createElement('textarea');area.value=text;area.style.cssText='position:fixed;left:-9999px;top:0';document.body.append(area);area.focus();area.select();const ok=document.execCommand('copy');area.remove();if(!ok)throw Error('copy');}
document.querySelectorAll('[data-copy-email]').forEach(b=>b.addEventListener('click',async()=>{try{await copyText(b.dataset.copyEmail);showToast('이메일을 복사했습니다.');}catch(_){showToast('이메일 주소를 선택해 복사해 주세요.');}b.focus();}));
document.querySelector('[data-copy-resume]')?.addEventListener('click',async e=>{const button=e.currentTarget;try{await copyText(document.querySelector('#resume-copy-source').value);showToast('이력서 원고를 복사했습니다.');}catch(_){showToast('TXT 다운로드를 이용해 주세요.');}button.focus();});
document.querySelector('[data-print]')?.addEventListener('click',()=>window.print());
const images=[...document.querySelectorAll('[data-lightbox]')];
if(images.length&&typeof HTMLDialogElement!=='undefined'){
 const modal=document.createElement('dialog');modal.className='image-dialog';modal.setAttribute('aria-label','프로젝트 이미지 확대');modal.innerHTML='<div class="dialog-toolbar"><span>PROJECT DETAIL</span><button type="button" data-close>닫기 ×</button></div><div class="dialog-body" tabindex="0"><img alt=""></div><p class="dialog-caption"></p>';document.body.append(modal);let opener;
 images.forEach(link=>link.addEventListener('click',e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button!==0)return;e.preventDefault();opener=link;const img=modal.querySelector('img');img.src=link.href;img.alt=link.querySelector('img')?.alt||'프로젝트 이미지';modal.querySelector('.dialog-caption').textContent=img.alt;modal.showModal();document.body.classList.add('modal-open');}));
 modal.querySelector('[data-close]').addEventListener('click',()=>modal.close());modal.addEventListener('click',e=>{if(e.target===modal)modal.close();});modal.addEventListener('close',()=>{document.body.classList.remove('modal-open');opener?.focus();});
}
const sections=[...document.querySelectorAll('.case-section')];
if(sections.length&&'IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{const visible=entries.filter(x=>x.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top)[0];if(!visible)return;document.querySelectorAll('.case-nav a').forEach(a=>{const active=a.getAttribute('href')==='#'+visible.target.id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});},{rootMargin:'-10% 0px -60% 0px',threshold:0});sections.forEach(s=>observer.observe(s));}
