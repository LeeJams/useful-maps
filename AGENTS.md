# AGENTS.md

이 파일은 이 저장소 전체에 적용되는 유지보수 규칙이다. 작업자는 변경 전에 이 파일과 `README.md`를 읽고, 사용자 요청과 충돌하지 않는 범위에서 아래 규칙을 지킨다.

## 1. 프로젝트의 목적

`쓸모지도(Useful Maps)`는 개발 개념과 실전 팁을 정적인 글이 아니라 조작 가능한 시각 자료로 설명하는 Next.js 가이드 라이브러리다.

모든 변경은 다음 목표를 유지해야 한다.

- 여러 가이드를 하나의 디자인 시스템과 내비게이션으로 관리한다.
- 각 주제를 **WHY → HOW → TRY → APPLY** 순서로 이해시킨다.
- 설명과 인터랙션이 같은 상태를 가리키도록 한다.
- 새 가이드를 추가해도 기존 가이드의 UI, 성능, 접근성이 흔들리지 않게 한다.
- 모든 현재 라우트는 특별한 이유가 없으면 정적으로 프리렌더링한다.

## 2. 현재 기술 기준

- Next.js App Router: `16.2.10`
- React / React DOM: `19.2.7`
- TypeScript strict mode
- 패키지 관리자: npm
- 공통 CSS: `src/app/globals.css`
- 가이드 목록의 단일 기준: `src/content/guides.ts`
- 배포 대상: Vercel

관련 없는 작업에서 의존성 버전을 바꾸지 않는다. 버전 업그레이드가 요청된 경우에만 최신 안정 버전과 보안 공지를 확인하고 `package.json`과 `package-lock.json`을 함께 갱신한다. Next.js와 React는 호환되는 버전으로 함께 검증한다.

다른 패키지 관리자용 lockfile을 추가하지 않는다.

## 3. 소스의 역할과 경계

```text
src/app/                 라우트, 페이지, 전역 스타일
src/components/          여러 라우트에서 재사용하는 공통 UI
src/content/guides.ts    홈과 내비게이션이 읽는 가이드 메타데이터
public/service-worker/   서비스 워커 실험 전용 공개 파일
git/                     마이그레이션 전 Git 정적 사이트 원본
worker/                  마이그레이션 전 Service Worker 정적 사이트 원본
output/playwright/       브라우저 검증 산출물
```

- 실제 제품 코드는 `src/`와 `public/`에서 수정한다.
- `git/`과 `worker/`는 비교용 레거시 원본이다. 사용자가 명시하지 않으면 수정하거나 삭제하지 않는다.
- `.next/`, `node_modules/`, `.playwright-cli/`, `output/`의 생성 파일을 제품 코드처럼 편집하지 않는다.
- 공통 동작은 `src/components/`로 올리되, 한 페이지에서만 쓰는 코드를 성급하게 추상화하지 않는다.

## 4. Next.js와 React 규칙

- App Router를 유지한다. Pages Router를 추가하지 않는다.
- `page.tsx`와 레이아웃은 기본적으로 Server Component로 둔다.
- 상태, 이벤트, Clipboard, Cache Storage, Service Worker 같은 브라우저 API가 필요한 가장 작은 경계에만 `"use client"`를 붙인다.
- 브라우저 API는 모듈 최상위나 Server Component에서 접근하지 않는다. 이벤트 핸들러나 effect 안에서 사용한다.
- 새 가이드의 설명 본문과 메타데이터는 Server Component에 두고, 실험실만 별도 Client Component로 분리한다.
- 내부 import는 가능한 한 `@/` alias를 사용한다.
- 내부 이동은 `next/link`를 사용한다.
- `any`, 불필요한 type assertion, lint 비활성화 주석으로 문제를 숨기지 않는다.
- effect에서 등록한 이벤트, timer, animation frame은 cleanup한다.
- 배열 렌더링에는 안정적인 고유 key를 사용한다.
- 새 동적 서버 의존성, Route Handler, 인증, 데이터베이스를 요청 없이 추가하지 않는다.

`next.config.ts`의 다음 설정은 의도된 불변 조건이다.

- `trailingSlash: true`: `/service-worker/` 페이지가 워커 scope 안에 들어가기 위해 필요하다.
- `/service-worker/sw.js`의 `no-cache` 헤더: 새 워커 업데이트 확인을 막는 HTTP 캐시를 방지한다.
- `Service-Worker-Allowed: /service-worker/`: 실험 범위를 명시한다.

이 설정을 제거하거나 범위를 넓히려면 서비스 워커 회귀 검증과 명확한 이유가 필요하다.

## 5. 가이드 콘텐츠 규칙

모든 가이드는 아래 네 질문에 답해야 한다.

1. **WHY** — 이 개념이 왜 필요한가? 모르면 어떤 판단이 어려운가?
2. **HOW** — 상태나 데이터가 어떤 순서와 관계로 움직이는가?
3. **TRY** — 사용자가 직접 바꾸거나 비교할 수 있는 것은 무엇인가?
4. **APPLY** — 실제 명령어, 코드, 선택 기준과 주의점은 무엇인가?

- 기능 이름만 나열하지 말고 원인, 결과, 선택 기준을 설명한다.
- 같은 결과처럼 보이는 선택지는 동일한 초기 조건에서 차이를 비교한다.
- 화면에 표시하는 숫자, 상태 수, 명령어, 제목은 실제 인터랙션과 일치해야 한다.
- 인터랙션 모드가 늘거나 줄면 `src/content/guides.ts`, hero 문구, 섹션 제목, 비교표, 범례도 함께 확인한다.
- 예제 명령은 복사 전에 사용자가 바꿔야 할 브랜치명, SHA, 경로를 설명한다.
- 삭제 또는 force push보다 공유 기록을 보존하는 안전한 기본값을 먼저 설명한다.

## 6. 새 가이드 추가 절차

1. `src/content/guides.ts`의 `Guide["slug"]` union과 `guides` 배열에 항목을 추가한다.
2. `src/app/<slug>/page.tsx`를 만들고 공통 `GuideHero`를 사용한다.
3. 클릭이나 브라우저 API가 필요한 부분만 `<topic>-lab.tsx` 같은 Client Component로 분리한다.
4. `SiteHeader`의 라벨 생성이 새 slug에도 맞는지 확인한다. 현재 조건문이 새 주제를 잘못 `Service Worker`로 표시하지 않게 수정한다.
5. 페이지 metadata와 홈의 제목, 요약, 태그, 읽는 시간, 업데이트 날짜를 동기화한다.
6. WHY, HOW, TRY, APPLY 네 구간과 모바일 검증을 완료한다.

홈과 헤더에서 별도 하드코딩 목록을 만들지 않는다. 가이드 목록은 `src/content/guides.ts`를 기준으로 한다.

## 7. 디자인 시스템 규칙

시각 방향은 “차분한 테크니컬 아틀라스”다.

- 종이색 배경, 짙은 잉크색, 청록 accent를 기본으로 한다.
- Service Worker처럼 네트워크가 핵심인 주제만 파랑을 보조 accent로 사용한다.
- 색상, 간격, 선, radius는 `src/app/globals.css`의 기존 token과 패턴을 먼저 재사용한다.
- 임의의 디자인 시스템, Tailwind, UI 라이브러리를 요청 없이 추가하지 않는다.
- 카드 모음보다 섹션, 구분선, 표, 노드, 연결선, 전체 폭 시각 자료를 우선한다.
- monospace는 코드, 명령어, ID, SHA, 시간, 상태에만 사용한다.
- 한 섹션에는 하나의 주된 시각 아이디어와 하나의 핵심 메시지만 둔다.
- 장식용 아이콘과 의미 없는 애니메이션을 추가하지 않는다.
- 모바일에서 도식 자체는 내부 가로 스크롤을 사용할 수 있지만 문서 전체의 가로 overflow는 허용하지 않는다.

`globals.css`를 수정할 때는 기존 주제별 구역과 media query 구조를 유지한다. 한 라우트 전용 스타일이 다른 가이드에 새지 않도록 구체적인 class 이름을 사용한다.

## 8. 인터랙션, SVG, 모션 규칙

- 버튼과 선택지는 native `button`, `input`, `a`를 우선 사용한다.
- SVG 노드가 클릭 가능하면 키보드 Enter/Space 조작과 읽을 수 있는 `aria-label`을 제공한다.
- 범례, 선택 상태, 설명 문구는 시각 상태와 동시에 바뀌어야 한다.
- 요청이나 전략을 다시 실행할 때 애니메이션도 처음부터 다시 시작해야 한다.
- 동적으로 삽입하는 SVG `animateMotion`은 문서 타임라인 0초를 암묵적으로 사용하지 않는다. `begin="indefinite"`와 `beginElement()` 또는 동등하게 재시작이 보장되는 방법을 사용한다.
- SVG의 `transform` 속성이 있는 요소에 CSS `transform` 애니메이션을 직접 겹치지 않는다. 위치 transform과 scale/opacity 애니메이션은 중첩한 `<g>`로 분리한다.
- 경로 애니메이션은 실제 처리 순서와 맞아야 한다. 실패 표시는 실패 지점에 도착하기 전에 나타나면 안 된다.
- `prefers-reduced-motion` 사용자는 움직임 없이도 같은 결과와 설명을 확인할 수 있어야 한다.
- 인터랙션을 바꾸면 첫 실행뿐 아니라 같은 동작의 반복 실행도 검증한다.

## 9. Service Worker 안전 규칙

서비스 워커 실험은 사이트 전체와 반드시 격리한다.

- 스크립트 경로: `/service-worker/sw.js`
- scope: `/service-worker/`
- 캐시 prefix: `knowledge-sw-lab-`
- 실험용 offline header: `x-sw-lab-offline`

금지 사항:

- root scope(`/`) 등록
- 다른 가이드나 Next.js 전체 asset을 포괄하는 cache rule
- prefix 확인 없이 모든 Cache Storage 삭제
- scope 확인 없이 모든 service worker 등록 해제
- 사용자별 정보, 인증 응답, 결제 응답의 무조건 캐싱

`public/service-worker/sw.js`의 동작이나 app shell을 바꿀 때는 다음을 함께 확인한다.

1. `sw.js`의 `VERSION`과 `version.json`의 `version`을 같은 새 값으로 올린다.
2. `APP_SHELL`과 `version.json.assets`의 모든 URL이 실제로 200 응답하는지 확인한다.
3. 설치 실패를 막기 위해 app shell은 꼭 필요한 최소 파일만 포함한다.
4. activate 단계가 현재 버전 이외의 `knowledge-sw-lab-` 캐시만 정리하는지 확인한다.
5. 최초 설치, controller 획득, 업데이트 waiting/activate, 캐시 fallback을 다시 검증한다.

개발 중 이전 워커나 캐시가 결과에 영향을 줄 수 있다. 버그로 단정하기 전에 scope, controller, 현재 VERSION, Cache Storage를 확인한다. 테스트를 위해 제거하더라도 이 실험의 scope와 prefix만 대상으로 한다.

## 10. 접근성과 반응형 규칙

- 의미에 맞는 landmark와 heading 순서를 유지한다.
- 모든 이미지와 의미 있는 SVG에는 대체 설명을 제공한다. 순수 장식은 `aria-hidden="true"`로 제외한다.
- 색상만으로 상태를 구분하지 않는다. 라벨, 텍스트, 모양을 함께 사용한다.
- focus 표시를 제거하지 않는다.
- 터치 대상과 버튼은 모바일에서도 누를 수 있는 크기를 유지한다.
- 390px 화면에서 `document.documentElement.scrollWidth === window.innerWidth`인지 확인한다.
- 내부 스크롤 영역 때문에 핵심 탭이나 현재 선택이 발견 불가능해지지 않게 한다.

## 11. 검증 기준

작업 범위에 맞게 아래 검증을 수행한다.

```bash
npm run lint
npm run build
npm audit --omit=dev
```

UI 또는 인터랙션 변경 시 실제 브라우저에서 최소한 다음을 확인한다.

- 1440px 데스크톱
- 390px 모바일
- 문서 전체 가로 overflow 없음
- 키보드 조작 가능
- 정상 흐름의 console error 0건
- 설명, 범례, 응답 출처, 시각 상태의 동기화

Git 가이드 변경 시:

- 모든 모드 탭 전환
- 기본 merge와 `--no-ff merge`의 조건 차이
- M1 같은 커밋 노드의 클릭과 키보드 선택
- 복사 버튼과 명령어 내용

Service Worker 변경 시:

- `/service-worker/`가 실제 controller를 갖는지 확인
- 온라인 Network First의 `network` 응답
- 캐시를 만든 뒤 오프라인 Network First의 `cache-fallback`
- 오프라인 Network Only의 의도된 실패 표현
- 같은 요청을 두 번 보냈을 때 패킷이 매번 시작점부터 이동
- 전략 변경 시 이전 경로와 응답이 초기화
- Cache Storage가 실험 prefix 밖을 건드리지 않음

Service Worker는 개발 서버의 HMR 상태만으로 완료 처리하지 않는다. 최종적으로 `npm run build` 후 `npm start`에서도 trailing slash, scope, controller, 캐시 전략을 확인한다.

## 12. 변경 완료 조건

완료라고 보고하기 전에 다음을 확인한다.

- 요청한 범위만 수정했는가?
- 기존 공통 UI를 재사용했는가?
- 콘텐츠 숫자와 인터랙션 상태가 일치하는가?
- 새 Client Component가 꼭 필요한가?
- 모바일과 reduced motion에서도 정보가 보존되는가?
- lint와 production build가 통과하는가?
- 구조나 사용법이 바뀌었다면 `README.md`도 갱신했는가?
- 서비스 워커 변경이라면 VERSION과 manifest가 동기화됐는가?

검증하지 못한 항목은 통과한 것처럼 말하지 말고 이유를 명시한다.

## 13. 배포 경계

배포는 사용자가 직접 수행한다.

- 사용자가 이번 요청에서 명시적으로 배포를 지시하지 않으면 Vercel 로그인, 프로젝트 연결, preview 생성, production 배포를 실행하지 않는다.
- 요청 없이 `.vercel/` 상태를 만들거나 외부 프로젝트 설정을 변경하지 않는다.
- 배포 전 단계에서는 로컬 build와 브라우저 검증까지만 수행하고, 필요한 명령을 안내한다.

