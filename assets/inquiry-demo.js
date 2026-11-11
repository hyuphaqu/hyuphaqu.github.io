import { processInquiry } from '../integrations/education-inquiry/engine.mjs';

const $ = id => document.getElementById(id);
const form = $('inquiry-form');
const text = $('inquiry-text');
const runtime = $('runtime-mode');
const runButton = $('run-demo');
const samples = {
  complete: '마케팅팀 실무자 20명 대상 AI 교육을 문의합니다. 보고서 작성과 데이터 분석에 활용하고 싶습니다. 2026년 12월 10일 온라인 진행을 희망합니다. 예산은 200만원이며, 교육 시간과 진행 가능 여부를 확인하고 싶습니다.',
  missing: '기관 실무자 대상 AI 교육을 문의합니다. 12월 중 온라인 진행을 희망하며, 예산과 인원은 협의 중입니다.',
  conflict: '영업팀 20명 대상 AI 교육을 문의합니다. 고객 응대에 활용하고 싶습니다. 추가로 참여할 인원을 합치면 40명일 수도 있습니다. 다음 달 온라인 또는 오프라인 교육을 검토 중이며 예산은 미정입니다.'
};
let result = null;
let busy = false;
let backend = '';
let backendConnected = false;
let lastInput = '';
const controls = [...form.querySelectorAll('button, select, textarea')];

function say(message) { $('demo-status').textContent = message; }
function status(message, state = '') { $('run-state').textContent = message; $('run-state').dataset.state = state; }
function clearResult() {
  result = null;
  $('result-content').hidden = true;
  $('result-empty').hidden = false;
  $('input-error').hidden = true;
  $('notification-details').open = false;
  status('입력 대기');
  say('');
}
function inputChanged() {
  $('character-count').textContent = `${text.value.length.toLocaleString('ko-KR')} / 3,000`;
  clearResult();
}
function chooseSample(key) {
  if (busy) return;
  text.value = samples[key];
  document.querySelectorAll('[data-sample]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.sample === key)));
  inputChanged();
}
function setBusy(value) {
  busy = value;
  controls.forEach(c => { c.disabled = value; });
  $('output-panel').setAttribute('aria-busy', String(value));
  runButton.textContent = value ? '문의 처리 중…' : '문의 정리하기 ↗';
}
function showError(message) {
  result = null;
  $('result-content').hidden = true;
  $('result-empty').hidden = false;
  $('input-error').textContent = message;
  $('input-error').hidden = false;
  status('처리하지 못함', 'error');
  say('입력이나 연결 상태를 확인한 후 다시 실행해주세요.');
}
function checkResponse(data, source) {
  if (!data || typeof data !== 'object' || Array.isArray(data) || data.status !== 'review_draft' || data.external_sent !== false ||
      typeof data.request_id !== 'string' || !data.request_id || !['browser-rules', 'n8n-rules'].includes(data.engine) ||
      typeof data.summary !== 'string' || !Array.isArray(data.facts) || !Array.isArray(data.needs_confirmation) ||
      typeof data.next_action !== 'string' || typeof data.notification_preview !== 'string' ||
      !data.needs_confirmation.every(x => typeof x === 'string') ||
      !data.facts.every(f => f && typeof f.field === 'string' && typeof f.value === 'string' && typeof f.evidence === 'string' && f.evidence.length > 0 && source.includes(f.evidence))) {
    throw new Error('응답 형식이나 원문 근거를 확인할 수 없습니다. 결과를 표시하지 않았습니다.');
  }
  return data;
}
function make(tag, className, content) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (content !== undefined) el.textContent = content;
  return el;
}
function render(data, elapsed) {
  result = data;
  $('result-empty').hidden = true;
  $('result-content').hidden = false;
  $('summary-label').textContent = data.mode === 'notification' ? '알림에 포함할 요약' : '문의 요약';
  $('result-summary').textContent = data.summary;
  $('result-origin').textContent = data.engine === 'n8n-rules' ? 'n8n 웹훅에서 처리한 검토용 초안 · 규칙 기반' : '이 브라우저에서 처리한 검토용 초안 · 규칙 기반';
  const facts = $('result-facts'); facts.replaceChildren();
  if (!data.facts.length) facts.append(make('p', 'result-origin', '추출 가능한 조건이 없습니다. 원문을 읽고 필요한 조건을 확인해주세요.'));
  data.facts.forEach(f => {
    const row = make('div', 'fact-row');
    const top = make('div', 'fact-top');
    top.append(make('span', 'fact-field', f.field), make('span', 'fact-value', f.value));
    row.append(top, make('blockquote', 'fact-evidence', f.evidence));
    facts.append(row);
  });
  const questions = $('result-confirmation'); questions.replaceChildren();
  (data.needs_confirmation.length ? data.needs_confirmation : ['원문과 추출 결과를 대조한 뒤 진행 조건을 최종 확인해주세요.']).forEach(q => questions.append(make('li', '', q)));
  $('result-next-action').textContent = data.next_action;
  $('notification-preview').textContent = data.notification_preview;
  $('notification-details').open = data.mode === 'notification';
  const ms = elapsed < 1 ? '1ms 미만' : `${Math.round(elapsed).toLocaleString('ko-KR')}ms`;
  $('execution-meta').textContent = `요청 ${data.request_id} · 처리 왕복 ${ms} · 외부 발송 없음`;
  status('초안 생성됨', 'done');
  say(Array.isArray(data.warnings) && data.warnings.length ? data.warnings.join(' ') : '원문 근거와 추가 확인 질문을 함께 검토해주세요.');
}
function runtimeHelp() {
  $('runtime-help').textContent = runtime.value === 'n8n'
    ? '입력이 연결된 n8n 데모 환경으로 전송됩니다. 규칙 기반으로 처리하며 Slack 메시지는 발송하지 않습니다.'
    : '입력은 이 브라우저에서 처리됩니다. AI 모델 호출 없이 정해진 규칙으로 정보와 확인 항목을 추출합니다.';
}
async function run(event) {
  event.preventDefault();
  if (busy) return;
  clearResult();
  const inquiry = text.value.trim();
  if (!inquiry) { showError('문의 원문을 입력해주세요. 샘플로 시작할 수도 있습니다.'); text.focus(); return; }
  if (inquiry.length > 3000) { showError('문의는 3,000자 이내로 입력해주세요.'); text.focus(); return; }
  const payload = { inquiry_text: inquiry, mode: $('processing-mode').value, detail: $('summary-detail').value };
  const selectedRuntime = runtime.value;
  lastInput = inquiry;
  setBusy(true); status('처리 중'); say('입력과 조건을 확인하고 있습니다.');
  const start = performance.now();
  try {
    let data;
    if (selectedRuntime === 'n8n') {
      if (!backendConnected || !backend) throw new Error('n8n 데모 연결을 확인할 수 없습니다. 브라우저 실행을 선택하거나 연결 후 다시 시도해주세요.');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(`${backend}/api/education-inquiry`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal, credentials: 'omit', redirect: 'error' });
        if (!response.ok) {
          let msg = ''; try { const body = await response.json(); msg = typeof body.error === 'string' ? body.error : body.error?.message || ''; } catch {}
          throw new Error(msg || `n8n 요청을 처리하지 못했습니다. (${response.status})`);
        }
        data = await response.json();
        if (data.engine !== 'n8n-rules') throw new Error('n8n에서 실행된 결과를 확인할 수 없습니다.');
      } finally { clearTimeout(timer); }
    } else {
      data = await processInquiry(payload, { engine: 'browser-rules' });
    }
    render(checkResponse(data, inquiry), performance.now() - start);
  } catch (error) {
    showError(error.name === 'AbortError' ? 'n8n 응답 시간이 초과됐습니다. 잠시 후 다시 실행해주세요.' : error.message || '처리 중 오류가 발생했습니다.');
  } finally { setBusy(false); }
}
async function discoverBackend() {
  const option = runtime.querySelector('option[value=n8n]');
  try {
    const cfg = await fetch(new URL('../demos/education-inquiry/config.json', import.meta.url), { cache: 'no-store' }).then(r => r.ok ? r.json() : {});
    const local = ['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname);
    if (cfg.backend_url) {
      const url = new URL(cfg.backend_url);
      if (url.protocol !== 'https:' && !(local && url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname))) throw new Error('unsupported endpoint');
      backend = url.origin;
    } else if (local) backend = 'http://127.0.0.1:8771';
    else { option.textContent = 'n8n 웹훅 · 로컬 환경에서 실행'; return; }
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 3500);
    try {
      const response = await fetch(`${backend}/api/health`, { signal: controller.signal, credentials: 'omit', redirect: 'error' });
      const body = response.ok ? await response.json() : null;
      if (!body || body.engine !== 'n8n-rules' || body.ok === false) throw new Error('unavailable');
      backendConnected = true; option.disabled = false; option.textContent = 'n8n 웹훅 · 연결됨';
    } finally { clearTimeout(timer); }
  } catch { option.textContent = 'n8n 웹훅 · 현재 연결되지 않음'; backendConnected = false; }
}
form.addEventListener('submit', run);
text.addEventListener('input', () => { document.querySelectorAll('[data-sample]').forEach(b => b.setAttribute('aria-pressed', 'false')); inputChanged(); });
document.querySelectorAll('[data-sample]').forEach(b => b.addEventListener('click', () => chooseSample(b.dataset.sample)));
$('processing-mode').addEventListener('change', clearResult);
$('summary-detail').addEventListener('change', clearResult);
runtime.addEventListener('change', () => { clearResult(); runtimeHelp(); });
$('copy-result').addEventListener('click', async () => {
  if (!result) return;
  const value = `${result.summary}\n\n확인할 내용\n${result.needs_confirmation.map(q => '- ' + q).join('\n')}\n\n다음 작업: ${result.next_action}\n\n${result.engine === 'n8n-rules' ? 'n8n 웹훅' : '브라우저'} 규칙 기반 처리 · 외부 발송 없음`;
  try { await navigator.clipboard.writeText(value); say('검토 내용을 복사했습니다.'); } catch { say('복사 권한을 확인하거나 JSON 다운로드를 이용해주세요.'); }
});
$('download-result').addEventListener('click', () => {
  if (!result) return;
  const blob = new Blob([JSON.stringify({ inquiry_text: lastInput, ...result }, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = 'education-inquiry-result.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  say('실행 결과를 JSON으로 다운로드했습니다.');
});
chooseSample('complete');
discoverBackend();
