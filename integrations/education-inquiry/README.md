# Education inquiry demo

공개 가능한 가상 교육 문의에서 원문에 적힌 조건과 추가 확인할 항목을 정리합니다. 같은 순수 JavaScript 엔진을 브라우저와 n8n Code 노드에서 실행합니다.

- **브라우저 모드:** 서버 없이 입력을 처리합니다. 문의 텍스트를 외부로 보내지 않습니다.
- **n8n 모드:** 로컬 API → n8n Webhook → Code → Respond to Webhook을 실제로 실행합니다.
- 두 모드 모두 **규칙 기반**입니다. LLM을 호출하지 않으며 임의의 사실을 생성하지 않습니다.
- 알림은 **문안 미리보기**입니다. Slack·이메일을 발송하거나 교육 예약·견적을 확정하지 않습니다.
- 과거 회사의 원본 데이터나 워크플로를 공개한 것이 아닌, 새로 만든 재현 데모입니다.

## 파일

| 파일 | 역할 |
| --- | --- |
| `engine.mjs` | 입력 검증, 원문 조건 추출, 확인 질문, 알림 문안 |
| `build-workflow.mjs` | 동일 엔진을 n8n Code 노드에 포함한 JSON 생성 |
| `workflow.json` | n8n에 가져올 워크플로. 자격증명·실제 채널 없음 |
| `server.mjs` | 로컬 정적 서버 및 n8n 프록시. 입력 크기·요청 빈도 제한 |
| `engine.test.mjs` | 누락·상충·상대 날짜·무관 입력·명령문·설정 변경 검증 |
| `api.test.mjs` | 실제 로컬 n8n 연결 검증. 서버 실행 필요 |

## 브라우저 체험

저장소 루트에서 정적 서버를 실행하고 `/demos/education-inquiry/`를 엽니다. GitHub Pages에는 브라우저 모드가 동작합니다. GitHub Pages 자체에서는 Node 서버나 Docker를 실행할 수 없습니다.

## 로컬 n8n 체험

Node.js 22 이상과 Docker가 필요합니다. 기존 n8n과 별도 컨테이너를 사용합니다. 원래 운영 중인 서버의 데이터·자격증명을 연결하지 않습니다.

1. 이 폴더에서 `node build-workflow.mjs`를 실행합니다.
2. 새 n8n 인스턴스를 로컬 포트 5681로 실행합니다. 아래 예시는 n8n 2.21.4 기준입니다.

```bash
docker run -d --name portfolio-n8n-demo \
  --publish 127.0.0.1:5681:5678 \
  --mount type=bind,source="$PWD",target=/demo,readonly \
  --env N8N_DIAGNOSTICS_ENABLED=false \
  --env N8N_PERSONALIZATION_ENABLED=false \
  --env N8N_VERSION_NOTIFICATIONS_ENABLED=false \
  --env N8N_TEMPLATES_ENABLED=false \
  --env N8N_SECURE_COOKIE=false \
  --env EXECUTIONS_DATA_SAVE_ON_SUCCESS=none \
  --env EXECUTIONS_DATA_SAVE_ON_ERROR=none \
  --env EXECUTIONS_DATA_SAVE_MANUAL_EXECUTIONS=false \
  n8nio/n8n:2.21.4

docker exec portfolio-n8n-demo n8n import:workflow --input=/demo/workflow.json
docker exec portfolio-n8n-demo n8n publish:workflow --id=educationInquiryPortfolioDemo
docker restart portfolio-n8n-demo
node server.mjs
```

3. `http://127.0.0.1:8771/demos/education-inquiry/`에서 n8n 연결 모드를 선택합니다. API 상태는 `/api/health`에서 확인합니다.
4. `node --test engine.test.mjs api.test.mjs`로 테스트합니다.

`DEMO_PORT`로 로컬 UI 포트, `DEMO_N8N_URL`로 n8n 웹훅 주소를 바꿀 수 있습니다. 인증정보를 프론트엔드 파일이나 공개 저장소에 넣지 않습니다. 이 서버는 127.0.0.1에만 바인딩한 로컬 도구입니다. 인터넷 공개용 배포는 별도의 인증·사용량 제한·비용 정책 검토가 필요합니다.

## API

```json
{
  "inquiry_text": "기관 실무자 대상 AI 교육을 문의합니다. 12월 중 온라인 진행을 희망하며, 예산과 인원은 협의 중입니다.",
  "mode": "summary",
  "detail": "brief"
}
```

- `mode`: `summary` 또는 `notification`
- `detail`: `brief` 또는 `detailed` — 원문에서 선택하는 요약 문장의 수가 달라집니다.
- 응답: `request_id`, `engine`, `summary`, `facts`(항목·원문 값·근거 문장), `needs_confirmation`, `next_action`, `notification_preview`, `external_sent:false`, `duration_ms`.
- 빈 입력·3,000자 초과·교육과 무관한 입력은 400, 본문 크기 초과는 413, JSON이 아니면 415, 과도한 요청은 429, n8n 연결 실패는 503입니다.
- 처리 실패 시 브라우저 성공 결과로 몰래 대체하지 않습니다.

## 한계와 수정 방법

이 버전은 한국어의 모든 문맥을 이해하는 요약기가 아닙니다. 정해진 표현과 숫자를 추출하므로 표현이 복잡하면 추가 확인이 필요합니다. 사실 필드의 원문 근거를 항상 함께 보여주고, 여러 인원·예산 값과 상대 날짜는 사람이 확인하도록 남깁니다. 정량 업무 개선 효과를 측정한 도구가 아닙니다.

`engine.mjs`의 규칙을 바꾸면 테스트 → `build-workflow.mjs` → 워크플로 다시 가져오기·활성화 순서로 반영합니다. 향후 AI 모델을 연결할 때도 JSON 형태, 근거의 원문 포함 여부, 미확인 정보와 실제 발송 상태 검증을 유지해야 합니다.

## 공식 참고

- [n8n Webhook](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [n8n Respond to Webhook](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.respondtowebhook/)
- [n8n CLI](https://docs.n8n.io/hosting/cli-commands/)
