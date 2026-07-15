# Service Worker Lab

서비스 워커의 상태와 요청 경로를 직접 선택해 비교하는 정적 시각화입니다. 전략을 바꾸거나 오프라인 모드를 켠 뒤 요청을 보내면 Browser → Service Worker → Network/Cache 경로, 응답 출처, 캐시 상태가 함께 바뀝니다.

## 실행

```bash
npm run dev
```

브라우저에서 `http://127.0.0.1:4173`을 엽니다. 서비스 워커는 `file://`에서는 동작하지 않으므로 반드시 로컬 서버로 열어야 합니다.

## 파일 구성

- `sw.js`: 서비스 워커 본체. install / activate / fetch / message 이벤트와 4가지 캐시 전략 (한국어 주석 포함)
- `main.v6.js`: 페이지 스크립트. 등록·업데이트, 요청 실험실, 흐름 애니메이션, 선택 해설
- `app.v6.css`: 화면 스타일

파일명의 `v6`는 asset versioning입니다. CSS/JS는 Cache First로 서빙되기 때문에, 내용만 바꾸면 이미 설치된 옛 서비스 워커가 캐시된 이전 파일을 계속 내보냅니다. 파일명을 바꾸면 캐시 키가 달라져 즉시 새 파일을 받습니다. 실서비스에서 번들러가 `app.3f9d2c.js`처럼 해시를 붙이는 것과 같은 이유입니다.
- `offline.html`: 문서 탐색 실패 시 보여주는 오프라인 fallback
- `use-cases.html`: 화면의 패턴이 실전(PWA, 푸시, Background Sync, 프록시, 배포)에서 어떻게 쓰이는지 연결한 페이지
- `version.json`: 서비스 워커가 앱 버전 변화를 감지하는 연습용 파일

## 화면에서 비교할 수 있는 흐름

- 등록 상태와 controller 여부
- Network First, Cache First, Stale While Revalidate, Network Only의 경로 차이
- 오프라인에서 캐시 fallback 또는 즉석 생성 응답으로 전환되는 장면
- `sw.js`의 `VERSION` 변경 후 waiting → activate로 이어지는 업데이트 상태

## 코드에서 확인할 포인트

- `APP_SHELL`: 첫 설치 때 미리 캐싱되는 앱 셸 목록
- `/data/*` 요청은 URL의 `strategy` 쿼리 값에 따라 다른 전략을 탄다
- `stableCacheKey()`: 실험용 쿼리를 캐시 키에서 제거해 같은 데이터로 비교
- `networkFirstPage()`: 문서 탐색 실패 시 `/offline.html` 반환
- `checkVersionFile()`: `version.json` 폴링으로 새 버전을 감지하는 패턴의 축약판

## 초기화

화면의 `Unregister`를 누르면 서비스 워커 등록과 캐시를 지웁니다.
