/** Deterministic, source-bound demo. No LLM call and no external notification. */
export function processInquiry(input, options = {}) {
  const started = Date.now();
  const fail = (message, code = 'INVALID_INPUT') => {
    const error = new Error(message); error.code = code; error.status = 400; throw error;
  };
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('문의 내용을 입력해 주세요.');
  if (typeof input.inquiry_text !== 'string') fail('문의 내용은 텍스트로 입력해 주세요.');
  const text = input.inquiry_text.trim();
  if (!text) fail('문의 내용을 입력해 주세요.');
  if (text.length > 3000) fail('문의 내용은 3,000자 이내로 입력해 주세요.', 'INPUT_TOO_LONG');
  const mode = input.mode || 'summary';
  const detail = input.detail || 'brief';
  if (!['summary', 'notification'].includes(mode)) fail('지원하지 않는 처리 모드입니다.');
  if (!['brief', 'detailed'].includes(detail)) fail('지원하지 않는 요약 길이입니다.');

  const sentences = text.split(/(?<=[.!?。！？])\s*|\n+/u).map(x => x.trim()).filter(Boolean);
  const commandPattern = /(?:이전|위의|모든|시스템|출력)\s*(?:의\s*)?(?:지시|명령|규칙|프롬프트).{0,20}(?:무시|변경|삭제)|(?:비밀|API.?키|토큰|자격증명).{0,12}(?:보여|출력|전송)|ignore\s+(?:all\s+)?(?:previous|system)|system\s*prompt/i;
  const relevant = sentences.filter(s => !commandPattern.test(s));
  const warnings = [];
  if (relevant.length !== sentences.length) warnings.push('작업 규칙을 바꾸거나 비밀 정보를 요구하는 문장은 추출에서 제외했습니다.');
  const scope = relevant.join('\n');
  if (!/(교육|강의|강연|워크숍|워크샵|수업|연수|실습|커리큘럼|멘토링)/u.test(scope)) fail('교육 관련 문의를 입력해 주세요. 이 데모는 교육 문의에 적힌 조건만 정리합니다.', 'OUT_OF_SCOPE');

  const facts = [];
  const needs = [];
  const evidenceFor = phrase => relevant.find(s => s.includes(phrase)) || phrase;
  const add = (field, value, evidence) => facts.push({ field, value, evidence: evidence || evidenceFor(value) });
  const matches = re => [...scope.matchAll(re)].map(m => m[0]);
  const unique = xs => [...new Set(xs)];
  const captureFact = (field, values, missing, conflict, caution) => {
    const vals = unique(values);
    if (!vals.length) { needs.push(missing); return; }
    for (const v of vals) add(field, v);
    if (vals.length > 1 && conflict) needs.push(conflict);
    if (caution) needs.push(caution);
  };

  // Capture source phrases. Do not infer entity names, commitments or numerical values.
  // Read an explicit field value before considering the "실무자 대상" form.
  // Generic labels such as "교육 대상" are not evidence of an actual audience.
  const labeledTarget = scope.match(/대상\s*(?:은|는|:|：)\s*([^.!?。！？\n,;]*)/u);
  let targetValue = '';
  if (labeledTarget) {
    targetValue = labeledTarget[1].trim()
      .replace(/\s*(?:약|총|최대|최소)?\s*\d[\d,]*(?:\s*[~〜-]\s*\d[\d,]*)?\s*명.*$/u, '')
      .replace(/(?:입니다|이에요|예요|이며|이고).*$/u, '').trim();
  } else {
    const beforeTarget = scope.match(/(?:[가-힣A-Za-z0-9·/&-]+\s+){0,4}[가-힣A-Za-z0-9·/&-]+\s*대상/u);
    if (beforeTarget) targetValue = beforeTarget[0].replace(/\s*대상$/u, '').trim();
  }
  if (/^(?:(?:이번|해당|본|교육|수강|참여|강의|훈련|연수|우리|저희|이번에는)\s*)+$/u.test(targetValue)
      || /미정|미확정|아직|추후|협의|확인\s*필요|정해지지/u.test(targetValue)) targetValue = '';
  if (targetValue) add('대상', targetValue); else needs.push('수강 대상과 담당 직무를 확인해 주세요.');
  const goals = matches(/(?:보고서\s*작성|회의록\s*(?:작성|정리)|문서\s*(?:작성|요약|분석)|데이터\s*분석|반복\s*업무\s*자동화|업무\s*자동화|고객\s*(?:응대|상담)|프롬프트\s*(?:작성|활용)|AI\s*기초)/giu);
  captureFact('교육 목표', goals, '교육 후 실제로 수행할 업무와 기대 결과를 확인해 주세요.');
  const counts = matches(/\d[\d,]*(?:\s*[~〜-]\s*\d[\d,]*)?\s*명/gu);
  captureFact('인원', counts, '참여 인원을 확인해 주세요.', '인원 값이 여러 개입니다. 최종 인원과 각 값의 의미를 확인해 주세요.');
  const budgetSentences = relevant.filter(s => /예산|금액|비용/u.test(s));
  const amounts = unique(budgetSentences.flatMap(s => [...s.matchAll(/\d[\d,]*(?:\.\d+)?\s*(?:천|만|백만|천만|억)?\s*원/gu)].map(m => m[0])));
  if (amounts.length) {
    amounts.forEach(v => add('예산', v, budgetSentences.find(s => s.includes(v))));
    if (amounts.length > 1) needs.push('예산 값이 여러 개입니다. 최종 예산을 확인해 주세요.');
    if (budgetSentences.some(s => /희망|예상|협의|미정|검토/u.test(s))) needs.push('예산은 희망·예상·협의 조건입니다. 확정 금액과 포함 범위를 확인해 주세요.');
  } else needs.push('예산과 비용 포함 범위를 확인해 주세요.');
  const dates = matches(/(?:\d{4}\s*년\s*)?\d{1,2}\s*월(?:\s*\d{1,2}\s*일)?(?:\s*(?:초|중|말))?|(?:다음\s*달|이번\s*달|다음\s*주|이번\s*주|내년|올해|내일|모레)/gu);
  captureFact('희망 일정', dates, '희망 날짜와 가능한 시간을 확인해 주세요.', '일정 표현이 여러 개입니다. 최종 후보 날짜를 확인해 주세요.', dates.length ? '일정은 문의 원문의 표현입니다. 기준 연도·정확한 날짜와 진행 가능 여부를 별도로 확인해 주세요.' : null);
  const methods = matches(/온라인|오프라인|대면|비대면|하이브리드/gu);
  // "비대면" must not generate a separate "대면" match (regex matching is non-overlapping).
  captureFact('진행 방식', methods, '온라인·오프라인 등 희망 진행 방식을 확인해 주세요.', '진행 방식이 여러 개입니다. 선택안인지 혼합 진행인지 확인해 주세요.');
  if (/(인원|예산).{0,18}(?:협의|미정|추후|미확정)/u.test(scope)) warnings.push('협의 중이거나 정해지지 않은 항목은 확정 값으로 바꾸지 않았습니다.');
  const checks = unique(needs);
  const maxSentences = detail === 'detailed' ? 4 : 2;
  const summarySource = relevant.slice(0, maxSentences).join(' ');
  const maxLength = detail === 'detailed' ? 600 : 260;
  const summary = summarySource.length > maxLength ? summarySource.slice(0, maxLength) + '…' : summarySource;
  const requestId = options.requestId || ('local-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9));
  const nextAction = checks.length ? '원문 근거를 검토한 뒤, 미확인 항목을 고객에게 확인할 질문으로 정리해 주세요.' : '원문 근거와 요청 조건을 검토한 뒤 담당자가 다음 진행 여부를 결정해 주세요.';
  return {
    request_id: requestId, engine: options.engine || 'browser-rules', mode, detail,
    status: 'review_draft', summary, facts,
    needs_confirmation: checks, next_action: nextAction,
    notification_preview: '[교육 문의 · 검토용]\n' + summary + '\n\n확인할 항목: ' + (checks.length ? checks.join(' / ') : '원문 조건과 진행 가능 여부 검토'),
    external_sent: false, duration_ms: Date.now() - started,
    warnings,
    engine_note: '정규식과 원문 문장 선택으로 처리한 규칙 기반 데모입니다. AI 모델을 호출하지 않습니다.',
    source_note: '공개 체험용 재현 기능입니다. 과거 회사의 원본 데이터·실행 로그가 아닙니다.'
  };
}
