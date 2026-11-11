# 오정협 포트폴리오

고객의 문제를 서비스로 구현한 프로젝트와 개발·교육 경험을 소개합니다.

## 수정

- `content/profile.json`: 소개, 경력, 연락처
- `content/cases.json`: 프로젝트 내용, 역할, 결과와 자료
- `scripts/build_portfolio.py`: 페이지 구성
- `assets/site.css`: 디자인과 반응형 레이아웃
- `assets/site.js`: 메뉴, 이미지 확대, 원고·이메일 복사

내용 수정 후 저장소 루트에서 `python3 scripts/build_portfolio.py`를 실행합니다. Python 표준 라이브러리만 사용합니다. 생성된 HTML을 직접 수정하면 다음 빌드에서 덮어씁니다.

## 로컬 미리보기

`python3 -m http.server 8769 --bind 127.0.0.1`

브라우저에서 `http://127.0.0.1:8769/`를 엽니다. 미리보기는 원격 게시와 별개입니다.


## 교육 문의 데모

- `demos/education-inquiry/`: 공개 체험 페이지. GitHub Pages에서는 브라우저 안에서 규칙 기반으로 실행합니다.
- `scripts/templates/education-inquiry.html`: 체험 페이지의 본문. 공통 헤더·푸터는 빌드 스크립트가 적용합니다.
- `assets/inquiry-demo.js`, `assets/inquiry-demo.css`: 입력·결과·상태 처리와 데모 레이아웃.
- `integrations/education-inquiry/`: 공용 처리 엔진, n8n 워크플로, 로컬 서버와 테스트. 실행 방법은 해당 폴더 README를 참고하세요.

과거 교육팀 업무 경험과 새로 만든 데모를 구분해 소개합니다. 데모의 알림은 미리보기이며 실제 메시지를 발송하지 않습니다. 원문에서 정보를 추출하는 규칙 기반 처리이며 LLM 호출 결과로 표시하지 않습니다.
