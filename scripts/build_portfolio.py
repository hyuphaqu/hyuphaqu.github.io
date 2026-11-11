#!/usr/bin/env python3
"""Generate the public portfolio from content/profile.json and content/cases.json."""
from pathlib import Path
from html import escape
import json
ROOT=Path(__file__).resolve().parents[1]
def e(v): return escape(str(v),quote=True)
def load(n):return json.loads((ROOT/'content'/n).read_text())
def save(n,t):p=ROOT/n;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(t)
def paragraphs(xs):return ''.join(f'<p>{e(x)}</p>' for x in xs)
profile=load('profile.json');cases=load('cases.json')['cases'];by_id={x['id']:x for x in cases}
arrow='<span aria-hidden="true">↗</span>'
def page(title,body,depth=0):
 p='../'*depth
 return f'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{e(title)}</title><meta name="description" content="고객의 문제를 작동하는 제품으로. 오정협의 서비스 기획·AI 구현·교육 포트폴리오."><meta name="theme-color" content="#ffffff"><meta property="og:title" content="{e(title)}"><meta property="og:description" content="고객의 문제를 작동하는 제품으로. 직접 기획하고 구현한 프로젝트를 소개합니다."><link rel="icon" href="{p}assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="{p}assets/site.css"><script defer src="{p}assets/site.js"></script></head><body><a class="skip-link" href="#main">본문으로 건너뛰기</a><header class="site-header"><div class="container header-inner"><a class="brand" href="{p}index.html" aria-label="오정협 홈"><span class="brand-mark" aria-hidden="true">oh.</span><span class="wordmark">오정협</span></a><button class="menu-button" aria-controls="site-nav" aria-expanded="false" aria-label="메뉴 열기">메뉴 <span>+</span></button><nav id="site-nav" aria-label="주요 메뉴"><a class="nav-link" href="{p}index.html#work">Work</a><a class="nav-link" href="{p}index.html#about">About</a><a class="nav-link" href="{p}resume/">Resume</a><a class="nav-link" href="{p}index.html#contact">Contact {arrow}</a></nav></div></header>{body}<footer class="site-footer"><div class="container footer-inner"><a class="brand" href="{p}index.html"><span class="brand-mark" aria-hidden="true">oh.</span><span class="wordmark">오정협</span></a><p>© 2026 OH JEONGHYEOP</p><div class="footer-links"><a href="https://github.com/hyuphaqu" target="_blank" rel="noopener noreferrer">GitHub {arrow}</a><a href="mailto:hyuphaqu@gmail.com">Email {arrow}</a></div></div></footer><div class="toast" role="status" aria-live="polite"></div></body></html>'''

def cover(id,p=''):
 if id=='billders':
  return f'''<div class="project-media media-billders"><span class="media-label">BILLDERS / IDEA FINDER</span><div class="product-window"><div class="window-chrome"><i></i><i></i><i></i><span>나에게 맞는 사업아이템 찾기</span></div><div class="window-content"><img src="{p}assets/ideafinder.webp" alt="직접 만든 사업아이템 탐색 랜딩의 관심 분야 선택 화면" width="1600" height="838" loading="lazy"></div></div><div class="workflow-float"><span class="workflow-caption">WORKFLOW</span><div class="workflow-path"><span class="workflow-node">고객 입력</span><span class="workflow-line">→</span><span class="workflow-node dark">n8n</span><span class="workflow-line">→</span><span class="workflow-node">AI 아이템 탐색</span></div><small>Railway 배포 · 웹훅 연결</small></div></div>'''
 if id=='education-automation':
  return '''<div class="project-media media-automation"><span class="media-label">EDUCATION OPERATIONS / WORKFLOW</span><div class="automation-canvas"><div class="automation-canvas-top"><span class="automation-symbol" aria-hidden="true">↗</span><strong>반복되는 일을, 연결하다.</strong><span class="automation-dot" aria-hidden="true"></span></div><div class="automation-lane"><span class="lane-label">INQUIRY</span><div class="automation-path"><span>교육 문의</span><b aria-hidden="true">→</b><span class="node-n8n">n8n · Slack</span><b aria-hidden="true">→</b><span>문의 알림</span></div></div><div class="automation-lane"><span class="lane-label">DOCUMENT</span><div class="automation-path"><span>입력 자료</span><b aria-hidden="true">→</b><span class="node-n8n">n8n</span><b aria-hidden="true">→</b><span>문서 · 요약</span></div></div><div class="automation-canvas-bottom"><span>확인 · 전달 · 정리</span><span>WORKFLOW DESIGN</span></div></div><span class="media-caption">직접 구현했던 두 업무 흐름을 정리한 도식</span></div>'''
 if id=='vibe-builders':
  return '''<div class="project-media media-vibe"><span class="media-label">VIBE BUILDERS / CUSTOMER SOLUTIONS</span><div class="flow-canvas"><div class="flow-header"><span>FROM IDEA TO SERVICE</span><span aria-hidden="true">↗</span></div><div class="flow-stack"><div class="flow-row"><div class="flow-box muted">고객의 아이디어<small>업무 · 필요한 기능</small></div><span class="flow-connector" aria-hidden="true">↓</span></div><div class="flow-row"><div class="flow-box dark">화면 + 데이터<small>제작 검수 · Supabase 연동</small></div><span class="flow-connector" aria-hidden="true">↓</span></div><div class="flow-row"><div class="flow-box">실제 사용하는 서비스<small>배포 · 기능 수정 · 사용 안내</small></div></div></div><p class="flow-detail">ERDCloud <span>·</span> Supabase <span>·</span> Claude</p></div><span class="media-caption">본인 역할을 정리한 서비스 연결 구조</span></div>'''
 if id=='platform':
  return '''<div class="project-media media-platform"><span class="media-label">LEARNING PLATFORM / PRODUCT DEVELOPMENT</span><div class="platform-canvas"><div class="platform-top"><span class="platform-symbol" aria-hidden="true">▦</span><strong>운영을 한곳에서.</strong></div><div class="platform-tabs"><span>수강생 정보</span><span>챌린지</span><span>수강 상태</span></div><div class="platform-panel"><div class="platform-cell"><small>BEFORE</small><strong>개별 시트</strong><span>이메일 대조</span><i aria-hidden="true"></i><i aria-hidden="true"></i><i aria-hidden="true"></i></div><div class="platform-cell after"><small>AFTER</small><strong>대시보드</strong><span>인증 기능</span><b aria-hidden="true">↗</b></div></div><div class="platform-footer"><span>Supabase 연결</span><span>직접 개발 · 운영</span></div></div><span class="media-caption">개선 전후 구조 · 실제 서비스 화면이 아닌 도식</span></div>'''
 return '''<div class="education-visual"><div class="code-window"><div class="code-top"><span>lesson.py</span><span>PYTHON · 실제 교안 발췌</span></div><pre><code><span class="code-comment"># 가장 많이 팔린 상품은?</span>\nbest_seller = <span class="code-blue">max</span>(\n    products,\n    key=<span class="code-blue">lambda</span> x: x[3]\n)</code></pre></div><div class="learning-route"><span>이해</span><b aria-hidden="true">→</b><span>실습</span><b aria-hidden="true">→</b><span>피드백</span></div></div>'''

def info(c):
 return f'''<div class="project-info"><div class="project-topline"><span class="project-type">{e(c['type'])}</span><span class="project-year">{e(c['year'])}</span></div><div class="project-heading"><h3 class="project-title">{e(c['title'])}<span>{e(c['headline'])}</span></h3><span class="project-arrow" aria-hidden="true">↗</span></div><p class="project-summary">{e(c['shortSummary'])}</p></div>'''
feature=f'<article class="work-feature"><a class="project-link" href="projects/billders.html">{cover("billders")}{info(by_id["billders"])}</a></article>'
grid=''.join(f'<article class="work-card"><a class="project-link" href="projects/{id}.html">{cover(id)}{info(by_id[id])}</a></article>' for id in ['vibe-builders','platform'])
c=by_id['education'];education=f'''<article class="education-feature"><a class="project-link" href="projects/education.html">{cover('education')}<div class="education-info"><div class="project-topline"><span class="project-type">{e(c['type'])}</span><span class="project-year">2026</span></div><h3>{e(c['headline'])}</h3><p class="project-summary">{e(c['shortSummary'])}</p><span class="text-link">교육과 멘토링 보기 {arrow}</span></div></a></article>'''
automation=''
if 'education-automation' in by_id:
 c=by_id['education-automation']
 automation=f'''<article class="automation-feature"><a class="project-link automation-feature-link" href="projects/education-automation.html">{cover(c['id'])}<div class="automation-info">{info(c)}<span class="text-link">업무 자동화 사례 보기 {arrow}</span></div></a><div class="automation-demo-strip"><span><i aria-hidden="true"></i>새로 만든 교육 문의 체험</span><a class="text-link" href="demos/education-inquiry/">직접 입력해보기 {arrow}</a></div></article>'''
experience=''.join(f'<div class="experience-row"><span class="experience-date">{e(x["period"])}</span><div class="experience-content"><h3>{e(x["title"])}</h3><p>{e(x["description"])}</p></div></div>' for x in profile['experience'])
capabilities=''.join(f'<article class="capability-item"><span class="capability-label">0{i}</span><h3>{e(x["title"])}</h3><p>{e(x["body"])}</p></article>' for i,x in enumerate(profile['capabilities'],1))
body=f'''<main id="main"><section class="hero container"><p class="hero-kicker"><span></span>{e(profile['eyebrow'])}</p><h1 class="hero-title">{e(profile['headline'][0])}<br><span class="accent">{e(profile['headline'][1])}</span></h1><div class="hero-bottom"><p class="hero-summary">{e(profile['intro'])}</p><div class="hero-actions"><a class="button button-dark" href="#work">프로젝트 보기 <span aria-hidden="true">↓</span></a><a class="text-link" href="resume/">이력서 {arrow}</a></div></div><div class="hero-note"><span>PRODUCT THINKING</span><span>AI BUILDING</span><span>EDUCATION</span></div></section><section class="work-section container" id="work"><div class="section-heading"><div><span class="section-index">01 / SELECTED WORK</span><h2>직접 만들고, 연결한 일.</h2></div><p class="section-caption">기획 · 구현 · 운영</p></div>{feature}<div class="work-grid">{grid}</div>{automation}{education}</section><section class="about-section container" id="about"><div class="section-heading"><div><span class="section-index">02 / ABOUT</span><h2>{e(profile['aboutTitle'])}</h2></div></div><div class="about-grid"><div class="about-copy"><p>{e(profile['about'])}</p><p>{e(profile['engineering'])}</p><div class="about-person"><img src="assets/profile.webp" alt="오정협의 AI 생성 프로필" width="72" height="72" loading="lazy"><div><strong>오정협</strong><span>제품 기획과 구현 · 고객 활용 지원</span></div></div></div><div class="experience-list">{experience}</div></div><div class="capability-list">{capabilities}</div></section><section class="contact-section container" id="contact"><div class="contact-top"><span class="section-index">03 / CONTACT</span><p>기획부터 구현까지,<br>함께 풀고 싶은 문제가 있다면.</p></div><h2 class="contact-title">Let’s build<br>something useful<span>.</span></h2><div class="contact-bottom"><a class="contact-email" href="mailto:{e(profile['email'])}">{e(profile['email'])} {arrow}</a><button class="copy-button" data-copy-email="{e(profile['email'])}">이메일 복사</button></div></section></main>'''
save('index.html',page('오정협 — AI Product Builder',body))

for idx,c in enumerate(cases):
 sections=''
 for s in c['sections']:
  content=paragraphs(s['body'])
  if s.get('comparison'):
   content+='<div class="case-comparison">'+''.join(f'<div class="comparison-item"><small>{label}</small><p>{e(s["comparison"][key])}</p></div>' for label,key in [('BEFORE','before'),('AFTER','after')])+'</div>'
  if s.get('steps'):
   content+='<div class="case-steps">'+''.join(f'<div class="case-step"><b>0{i}</b><h3>{e(x["title"])}</h3><p>{e(x["body"])}</p></div>' for i,x in enumerate(s['steps'],1))+'</div>'
  if s.get('image'):
   im=s['image'];content+=f'<figure class="evidence"><a href="../assets/{e(im["src"])}" data-lightbox aria-label="{e(im["caption"])} 확대"><img src="../assets/{e(im["src"])}" alt="{e(im["caption"])}" loading="lazy"></a><figcaption>{e(im["caption"])}</figcaption></figure>'
  sections+=f'<section class="case-section" id="{e(s["id"])}"><span class="section-label">{e(s["label"])}</span><h2>{e(s["title"])}</h2>{content}</section>'
 if c.get('related'):
  related=''.join(f'<article class="related-experience"><h3>{e(x["title"])}</h3><p>{e(x["body"])}</p></article>' for x in c['related'])
  code=c.get('teachingExample',{});extra=''
  if code:extra=f'<details class="code-example" id="day6-example"><summary>{e(code["title"])} <span aria-hidden="true">+</span></summary><p>{e(code["caption"])}</p><pre><code>{e(code["code"])}</code></pre></details>'
  links=''.join(f'<a class="text-link" href="{e(x["url"])}" target="_blank" rel="noopener noreferrer">{e(x["title"])} {arrow}</a>' for x in c.get('teachingLinks',[]))
  sections+=f'<section class="case-section" id="more"><span class="section-label">함께 해온 일</span><h2>직접 만들고, 배울 수 있게 구성했습니다.</h2>{related}{extra}<div class="resource-links">{links}</div></section>'
 toc=''.join(f'<a href="#{e(s["id"])}"><span>0{i}</span>{e(s["label"])}</a>' for i,s in enumerate(c['sections'],1))
 if c.get('related'):toc+='<a href="#more"><span>05</span>교안·강의 제작</a>'
 demo_cta=''
 if c.get('demo'):
  demo_cta=f'<div class="case-demo-cta"><a class="button button-dark" href="{e(c["demo"]["url"])}">{e(c["demo"]["label"])} {arrow}</a><span>가상 문의로 새로 만든 인터랙티브 데모</span></div>'
 nextc=cases[(idx+1)%len(cases)]
 body=f'''<main id="main" class="container"><a class="case-back" href="../index.html#work">← Selected work</a><header class="case-header"><p class="hero-kicker">{e(c['type'])} / {e(c['year'])}</p><h1>{e(c['headline'])}</h1><p class="case-lead">{e(c['lead'])}</p>{demo_cta}<dl class="case-meta"><div><dt>PROJECT</dt><dd>{e(c['title'])}</dd></div><div><dt>PERIOD</dt><dd>{e(c['period'])}</dd></div><div><dt>ROLE</dt><dd>{e(c['role'])}</dd></div><div><dt>TOOLS &amp; METHODS</dt><dd>{e(' · '.join(c['tools']))}</dd></div></dl></header><div class="case-cover">{cover(c['id'],'../')}</div><div class="case-layout"><nav class="case-nav" aria-label="사례 목차">{toc}</nav><div class="case-content"><p class="case-scope">{e(c['scopeNote'])}</p>{sections}<div class="case-result"><span class="section-label">OUTCOME</span><p>{e(c['result'])}</p></div></div></div><a class="next-case" href="{e(nextc['id'])}.html"><span>다음 프로젝트</span><strong>{e(nextc['title'])}</strong><b aria-hidden="true">↗</b></a></main>'''
 save(f'projects/{c["id"]}.html',page(c['title']+' — 오정협',body,1))

# Matching public resume, without planning metadata.
text=[profile['name'],'제품 기획과 구현',profile['email'],profile['github'],'',profile['intro'],'','경력']
career=''
for x in profile['experience']:
 career+=f'<article class="resume-item"><div class="resume-item-top"><h3>{e(x["title"])}</h3><time>{e(x["period"])}</time></div><p>{e(x["description"])}</p></article>'
 text.extend([x['title'],x['period'],x['description'],''])
entries=''
for c in cases:
 bullets=[c['shortSummary'],c['result']]
 entries+=f'<article class="resume-item"><div class="resume-item-top"><h3>{e(c["title"])}</h3><time>{e(c["period"])}</time></div><p class="resume-role">{e(c["role"])}</p><ul>'+''.join(f'<li>{e(x)}</li>' for x in bullets)+f'</ul><a class="text-link" href="../projects/{c["id"]}.html">프로젝트 상세 {arrow}</a></article>'
 text.extend([c['title'],c['period'],c['role'],*bullets,''])
extra=''.join(f'<article class="resume-item"><h3>{e(x["title"])}</h3><p>{e(x["body"])}</p></article>' for x in by_id['education']['related'])
for x in by_id['education']['related']:text.extend([x['title'],x['body'],''])
text.extend(['프론트엔드 개발',profile['engineering'],'','기술·도구','React · TypeScript · ERDCloud · Supabase · n8n · Railway · Docker · Git · GitHub Actions'])
resume='\n'.join(text)+'\n';save('downloads/resume.txt',resume)
body=f'''<main id="main" class="container resume-shell"><div class="resume-toolbar"><a class="case-back" href="../index.html">← Portfolio</a><div class="resume-actions"><button class="copy-button" data-copy-resume>원고 복사</button><a class="copy-button" href="../downloads/resume.txt" download>TXT 다운로드</a><button class="button button-dark" data-print>인쇄 / PDF</button></div></div><article class="resume-document"><p class="hero-kicker">RESUME</p><h1>{e(profile['name'])}</h1><p class="resume-role">제품 기획과 구현 · AI 활용과 고객 실행 지원</p><div class="resume-contact"><a href="mailto:{profile['email']}">{profile['email']}</a><a href="{profile['github']}">GitHub ↗</a></div><p class="resume-intro">{e(profile['intro'])}</p><section class="resume-section"><h2>경력</h2>{career}</section><section class="resume-section"><h2>주요 프로젝트</h2>{entries}</section><section class="resume-section"><h2>개발·교육 경험</h2><article class="resume-item"><h3>외주 프론트엔드 개발</h3><p>{e(profile['engineering'])}</p></article>{extra}</section><section class="resume-section"><h2>기술·도구</h2><p class="resume-skills">React · TypeScript · ERDCloud · Supabase · n8n · Railway · Docker · Git · GitHub Actions</p></section></article><textarea id="resume-copy-source" hidden>{e(resume)}</textarea></main>'''
save('resume/index.html',page('오정협 — 이력서',body,1))
save('404.html',page('페이지를 찾을 수 없습니다 — 오정협','<main id="main" class="container"><section class="hero"><p class="hero-kicker">404 / PAGE NOT FOUND</p><h1 class="hero-title">페이지를<br>찾을 수 없습니다.</h1><div class="hero-actions"><a class="button button-dark" href="/">포트폴리오로 돌아가기 ↗</a></div></section></main>'))
# Preserve the old project URL as a lightweight navigation alias.
save('projects/gpt-guide.html','<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=../index.html#about"><title>오정협 포트폴리오</title></head><body><a href="../index.html#about">포트폴리오로 이동</a></body></html>')
# Interactive education inquiry demo shares the existing site shell.
demo_body=(ROOT/'scripts/templates/education-inquiry.html').read_text()
demo_page=page('교육 문의 워크플로 데모 — 오정협',demo_body,2)
demo_page=demo_page.replace('</head>','<link rel="stylesheet" href="../../assets/inquiry-demo.css"><script type="module" src="../../assets/inquiry-demo.js"></script></head>')
save('demos/education-inquiry/index.html',demo_page)
urls=['','resume/','demos/education-inquiry/']+[f'projects/{c["id"]}.html' for c in cases]
save('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join(f'<url><loc>https://hyuphaqu.github.io/{u}</loc></url>' for u in urls)+'</urlset>\n')
print(f'Generated public home, {len(cases)} case studies, resume and inquiry demo.')
