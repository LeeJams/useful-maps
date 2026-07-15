# 쓸모지도 (Useful Maps)

복잡한 개발 개념과 실전 팁을 **왜 필요한지 → 어떻게 작동하는지 → 직접 비교하기 → 실전에 적용하기** 순서로 보여 주는 인터랙티브 시각 가이드 라이브러리입니다.

기존의 두 정적 사이트(`git/`, `worker/`)를 하나의 Next.js 앱으로 통합했습니다.

- `/` — 전체 가이드 라이브러리
- `/git/` — Git 그래프와 안전한 되돌리기
- `/service-worker/` — 실제 서비스 워커 요청 실험실
- `/service-worker/use-cases/` — 서비스 워커 실전 활용 사례

## 왜 통합했나

각 자료가 독립 HTML로 남아 있으면 내용이 늘수록 다음 문제가 커집니다.

1. 헤더, 색상, 타이포그래피, 반응형 규칙이 주제마다 달라집니다.
2. 새 자료를 어디에 연결해야 하는지 매번 다시 결정해야 합니다.
3. 메타데이터, 접근성, 배포 설정, 보안 업데이트가 중복됩니다.
4. 한 자료의 전역 기능(특히 서비스 워커)이 다른 자료를 의도치 않게 제어할 수 있습니다.

통합 앱에서는 공통 디자인 토큰과 가이드 메타데이터를 한곳에서 관리하고, 각 주제의 인터랙션만 작은 Client Component로 격리합니다. 나머지 설명 화면은 Server Component로 렌더링되어 기본 JavaScript가 작고 검색 가능한 HTML이 됩니다.

## 기술 기준

- Next.js `16.2.10` / App Router
- React `19.2.7`
- TypeScript strict mode
- CSS 디자인 토큰 + 반응형 레이아웃
- Vercel zero-config 배포
- 프로덕션 의존성 보안 감사 0건

Next.js와 React 버전은 작업 시점의 npm 최신 안정 버전으로 고정했습니다. `postcss`는 Next.js의 전이 의존성 보안 권고를 피하기 위해 호환 가능한 최신 버전으로 override합니다.

## 실행과 검증

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다. 서비스 워커는 보안 컨텍스트에서만 동작하므로 로컬에서는 반드시 `localhost`를 사용합니다.

```bash
npm run lint
npm run build
npm audit --omit=dev
```

`npm run build` 결과의 모든 현재 라우트는 정적 콘텐츠로 프리렌더링됩니다. 서비스 워커 실험만 브라우저 런타임에서 동작합니다.

## 폴더 구조

```text
src/
├── app/
│   ├── page.tsx                       # 라이브러리 홈
│   ├── git/
│   │   ├── page.tsx                   # Git 설명 콘텐츠
│   │   └── git-lab.tsx                # Git 그래프 인터랙션
│   ├── service-worker/
│   │   ├── page.tsx                   # 서비스 워커 설명 콘텐츠
│   │   ├── service-worker-lab.tsx     # 실제 워커/캐시 실험
│   │   └── use-cases/page.tsx         # 6개 활용 사례
│   └── globals.css                    # 공통 토큰과 전체 시각 시스템
├── components/                        # 공통 헤더, 로고, 가이드 hero
└── content/guides.ts                  # 홈/내비게이션의 가이드 목록

public/service-worker/
├── sw.js                              # /service-worker/ 전용 워커
├── offline.html                       # 독립 오프라인 fallback
├── version.json                       # 업데이트 실험용 버전 매니페스트
└── data/requests.json                 # 캐시 전략 비교 데이터
```

기존 `git/`, `worker/` 폴더는 마이그레이션 기준을 비교할 수 있도록 원본 레퍼런스로 보존되어 있으며 Next.js 빌드에는 포함되지 않습니다.

## 디자인 시스템

시각 논제는 “개발 개념을 문서가 아니라 작동하는 지도처럼 보여 주는 차분한 테크니컬 아틀라스”입니다.

- 종이색 바탕 + 짙은 잉크색을 기본으로 사용합니다.
- 공통 accent는 청록, 네트워크 계열 주제는 파랑을 보조로 사용합니다.
- 얇은 그리드, 연결선, 노드로 개념의 관계를 먼저 보여 줍니다.
- monospace는 코드, 시간, ID, 상태에만 사용합니다.
- 카드 모음보다 섹션, 구분선, 표, 전체 폭 시각 자료를 우선합니다.
- 모션은 진입, 상태 전환, 경로 이동처럼 의미가 있는 곳에만 사용합니다.

핵심 토큰은 `src/app/globals.css`의 `:root`에 있습니다. 새 가이드에서 임의 색상과 radius를 만들기 전에 기존 토큰을 먼저 사용하세요.

## 새 가이드 추가 방법

### 1. 목록에 등록

`src/content/guides.ts`에 새 항목을 추가합니다.

```ts
{
  slug: "new-topic",
  href: "/new-topic",
  eyebrow: "03 · CATEGORY",
  title: "가이드 제목",
  summary: "한 문장 설명",
  why: "이 주제가 필요한 이유",
  format: "대표 인터랙션 형식",
  readingTime: "약 8분",
  tags: ["Tag A", "Tag B"],
  accent: "teal",
  updatedAt: "2026.07"
}
```

현재 `Guide.slug`가 literal union이므로 새 slug도 타입에 함께 추가합니다. 등록된 데이터는 홈 목록과 메타 정보의 단일 기준이 됩니다.

### 2. 라우트 작성

`src/app/<slug>/page.tsx`를 만들고 공통 `GuideHero`를 사용합니다. 콘텐츠 순서는 다음 문법을 유지합니다.

1. **WHY** — 이 개념을 모르면 어떤 판단이나 문제가 어려운가
2. **HOW** — 상태, 흐름, 데이터가 어떤 순서로 움직이는가
3. **TRY** — 사용자가 선택하거나 비교하면 무엇이 바뀌는가
4. **APPLY** — 실제 명령어, 구현 패턴, 주의점은 무엇인가

단순한 설명은 Server Component에 두고, 클릭·브라우저 API·상태가 필요한 부분만 별도 Client Component로 만듭니다.

### 3. 시각 자료 작성

- 한 섹션에는 하나의 dominant visual만 둡니다.
- 장식보다 관계를 보여 주는 선, 노드, 단계, 범례를 사용합니다.
- 작은 화면에서 축소하면 의미가 사라지는 도식은 내부 가로 스크롤을 사용하되 문서 전체 폭은 늘리지 않습니다.
- SVG 인터랙션에는 역할, 키보드 조작, 읽을 수 있는 `aria-label`을 제공합니다.
- `prefers-reduced-motion` 사용자는 애니메이션 없이도 같은 정보를 얻어야 합니다.

### 4. 검증

새 가이드는 최소한 다음을 확인합니다.

- 1440px 데스크톱 전체 페이지
- 390px 모바일 전체 페이지와 가로 overflow
- 키보드로 모든 선택/버튼 접근
- 인터랙션 전후의 설명과 시각 상태 동기화
- 콘솔 error 0건
- `npm run lint`, `npm run build`, `npm audit --omit=dev`

## 서비스 워커를 별도 범위에 둔 이유

서비스 워커는 scope 아래의 모든 네트워크 요청을 가로챕니다. 실험용 Cache First가 루트(`/`)를 제어하면 새 Vercel 배포 뒤에도 오래된 Next.js 문서나 자산이 보일 수 있습니다.

이 프로젝트는 다음 규칙으로 격리합니다.

- 스크립트: `/service-worker/sw.js`
- scope: `/service-worker/`
- 캐시 prefix: `knowledge-sw-lab-`
- 등록 해제/캐시 삭제: 이 scope와 prefix에 해당하는 항목만 대상
- Next.js: `trailingSlash: true`로 실제 페이지 URL도 scope에 포함

새 실험을 추가할 때도 전역 scope를 사용하지 말고 해당 실험 경로 아래에 워커를 둡니다.

`sw.js`의 `VERSION`과 `version.json`의 `version`은 배포할 때 함께 올립니다. `APP_SHELL`에 넣는 URL은 설치 시 모두 성공해야 하므로 꼭 필요한 최소 항목만 유지하세요.

## Vercel 배포

CLI가 로그인되어 있다면 프로젝트 루트에서 다음을 실행합니다.

```bash
# Preview
npx vercel deploy

# 검증이 끝난 동일 artifact를 production으로
npx vercel promote <preview-url>
```

직접 production 배포가 필요하면 다음을 사용합니다.

```bash
npx vercel deploy --prod
```

Git Integration을 연결하면 feature branch/PR마다 Preview가 생기고 main push가 Production 배포로 이어집니다. 팀 운영에서는 Preview에서 Git 인터랙션, 서비스 워커 최초 설치, 캐시 fallback, 모바일 overflow를 확인한 뒤 Production으로 승격하는 흐름을 권장합니다.

서비스 워커 파일은 `next.config.ts`에서 `no-cache` 헤더를 받습니다. 브라우저가 업데이트 확인 때 오래된 `sw.js` HTTP 캐시를 재사용하지 않게 하기 위한 설정입니다.
