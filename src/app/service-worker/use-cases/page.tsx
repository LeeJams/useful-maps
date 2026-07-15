import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Service Worker 활용 사례",
  description: "PWA, 캐시 라우팅, 푸시, Background Sync, 요청 프록시와 안전한 업데이트를 왜 쓰고 어떻게 구현하는지 살펴봅니다."
};

type UseCase = {
  number: string;
  tag: string;
  title: string;
  lead: string;
  why: string;
  how: string;
  check: string;
  code: string;
  visual: "shell" | "cache" | "push" | "sync" | "proxy" | "update";
};

const cases: UseCase[] = [
  {
    number: "01",
    tag: "PWA / APP SHELL",
    title: "오프라인에서도 켜지는 앱",
    lead: "설치 단계에서 화면 뼈대를 먼저 저장하면 네트워크가 없어도 사용자가 빈 화면 대신 쓸 수 있는 시작점을 만납니다.",
    why: "현장 업무, 교통, 여행처럼 연결 품질이 일정하지 않은 환경에서 첫 화면과 핵심 동선을 보장하기 위해 필요합니다.",
    how: "install 이벤트에서 HTML·CSS·JS·오프라인 안내를 미리 캐시하고, 문서 탐색 실패 시 offline fallback을 반환합니다.",
    check: "앱 셸에 너무 많은 파일을 넣으면 첫 설치가 느려지고 파일 하나만 실패해도 install 전체가 실패할 수 있습니다.",
    code: `const APP_SHELL = [\n  "/", "/app.css", "/app.js", "/offline.html"\n];\n\nself.addEventListener("install", event => {\n  event.waitUntil(\n    caches.open(APP_CACHE).then(cache =>\n      cache.addAll(APP_SHELL)\n    )\n  );\n});`,
    visual: "shell"
  },
  {
    number: "02",
    tag: "CACHE ROUTING",
    title: "재방문을 순간 로딩으로",
    lead: "요청 성격에 맞는 전략을 고르면 속도와 최신성 사이의 균형을 URL 단위로 설계할 수 있습니다.",
    why: "모든 요청을 똑같이 다루면 정적 자원은 불필요하게 느리고, API는 지나치게 오래된 값이 될 수 있기 때문입니다.",
    how: "폰트·아이콘은 Cache First, 피드는 Stale While Revalidate, 결제는 Network Only처럼 request.destination과 경로로 전략을 나눕니다.",
    check: "캐시 이름에 버전을 넣고 activate에서 이전 버전을 지우지 않으면 저장 공간과 오래된 응답이 계속 쌓입니다.",
    code: `self.addEventListener("fetch", event => {\n  const { request } = event;\n\n  if (request.destination === "font") {\n    event.respondWith(cacheFirst(request));\n  } else if (new URL(request.url).pathname === "/feed") {\n    event.respondWith(staleWhileRevalidate(request));\n  }\n});`,
    visual: "cache"
  },
  {
    number: "03",
    tag: "PUSH NOTIFICATION",
    title: "탭이 닫혀 있어도 도착하는 알림",
    lead: "푸시 서비스가 서비스 워커를 깨우면 열려 있는 페이지가 없어도 알림을 표시하고 클릭 동작을 연결할 수 있습니다.",
    why: "메시지, 배송 상태, 예약 변경처럼 사용자가 앱을 보고 있지 않을 때도 전달 가치가 큰 이벤트가 있기 때문입니다.",
    how: "서버가 Push Service로 암호화된 payload를 보내고, push 이벤트에서 showNotification을 호출한 뒤 notificationclick에서 적절한 화면을 엽니다.",
    check: "알림 권한은 명확한 사용자 행동 뒤에 요청하고, 구독 해지와 빈도 제어를 제품 정책에 포함해야 합니다.",
    code: `self.addEventListener("push", event => {\n  const data = event.data?.json();\n  event.waitUntil(\n    self.registration.showNotification(data.title, {\n      body: data.body,\n      data: { url: data.url }\n    })\n  );\n});`,
    visual: "push"
  },
  {
    number: "04",
    tag: "BACKGROUND SYNC",
    title: "오프라인에 쓴 글을 연결되면 전송",
    lead: "실패한 쓰기 작업을 IndexedDB에 보관하고 연결이 복구됐을 때 서비스 워커가 다시 전송합니다.",
    why: "사용자가 제출 버튼을 눌렀는데 네트워크가 잠깐 끊겼다는 이유로 작성 내용을 잃지 않게 하기 위해 필요합니다.",
    how: "페이지는 요청 payload를 로컬 큐에 넣고 sync tag를 등록합니다. sync 이벤트는 큐를 읽어 서버 전송에 성공한 항목만 제거합니다.",
    check: "브라우저 지원 범위가 제한적이므로 온라인 이벤트 기반 재시도와 사용자가 확인할 수 있는 전송 상태를 함께 설계하세요.",
    code: `await registration.sync.register("send-outbox");\n\nself.addEventListener("sync", event => {\n  if (event.tag === "send-outbox") {\n    event.waitUntil(flushQueuedRequests());\n  }\n});`,
    visual: "sync"
  },
  {
    number: "05",
    tag: "REQUEST PROXY",
    title: "나가는 요청을 중간에서 가공",
    lead: "서비스 워커는 요청을 다른 URL로 보내거나 응답을 조합해 페이지에 가상 API처럼 제공할 수 있습니다.",
    why: "오프라인 mock, 버전 전환, 응답 정규화처럼 여러 화면이 반복해서 알아야 할 네트워크 규칙을 한곳에 모을 수 있습니다.",
    how: "fetch 이벤트에서 URL 패턴을 확인하고 새 Request를 만들거나, 여러 응답을 합친 새 Response를 반환합니다.",
    check: "인증과 권한 검사는 여전히 서버 책임입니다. 서비스 워커 코드는 사용자가 열람하고 우회할 수 있는 클라이언트 코드입니다.",
    code: `self.addEventListener("fetch", event => {\n  const url = new URL(event.request.url);\n  if (url.pathname === "/api/profile") {\n    event.respondWith(\n      fetch("/api/v2/me", event.request)\n    );\n  }\n});`,
    visual: "proxy"
  },
  {
    number: "06",
    tag: "SAFE UPDATE",
    title: "조용한 배포, 예고된 업데이트",
    lead: "새 워커는 기존 탭을 갑자기 바꾸지 않고 waiting 상태에서 안전한 교체 시점을 기다립니다.",
    why: "열려 있는 페이지는 이전 JS를, 새 서비스 워커는 새로운 캐시를 쓰는 버전 불일치를 통제하기 위해 필요합니다.",
    how: "updatefound와 waiting을 감지해 사용자에게 업데이트를 알리고, 동의 시 SKIP_WAITING 메시지를 보내 controllerchange 뒤 새로고침합니다.",
    check: "무조건 skipWaiting을 호출하면 작성 중인 상태를 잃을 수 있습니다. 긴 작업과 폼이 있는 제품은 사용자 선택을 우선하세요.",
    code: `// page\nregistration.waiting?.postMessage({\n  type: "SKIP_WAITING"\n});\n\n// service worker\nself.addEventListener("message", event => {\n  if (event.data?.type === "SKIP_WAITING") {\n    self.skipWaiting();\n  }\n});`,
    visual: "update"
  }
];

function CaseVisual({ type }: { type: UseCase["visual"] }) {
  const labels: Record<UseCase["visual"], string[]> = {
    shell: ["INSTALL", "APP SHELL", "OFFLINE"],
    cache: ["REQUEST", "ROUTER", "CACHE"],
    push: ["SERVER", "PUSH", "DEVICE"],
    sync: ["OUTBOX", "ONLINE", "SERVER"],
    proxy: ["PAGE", "WORKER", "API V2"],
    update: ["ACTIVE", "WAITING", "NEXT"]
  };
  return (
    <svg className={`case-visual visual-${type}`} viewBox="0 0 620 210" role="img" aria-label={`${labels[type].join("에서 ")}로 이어지는 흐름`}>
      <path d="M90 105H530" />
      <path className="case-progress" d="M90 105H530" />
      {labels[type].map((label, index) => {
        const x = 90 + index * 220;
        return (
          <g key={label} transform={`translate(${x} 105)`}>
            <circle r={index === 1 ? 31 : 19} />
            <text y={index === 1 ? 58 : 47}>{label}</text>
          </g>
        );
      })}
      <circle className="case-packet" r="6">
        <animateMotion dur="2.6s" repeatCount="indefinite" path="M90 105H530" />
      </circle>
    </svg>
  );
}

export default function ServiceWorkerUseCasesPage() {
  return (
    <main className="use-cases-page">
      <section className="use-cases-hero">
        <div className="content-wrap">
          <Link className="back-link" href="/service-worker"><ArrowLeftIcon /> 요청 실험실</Link>
          <p className="eyebrow">SERVICE WORKER / FIELD GUIDE</p>
          <h1>화면에서 본 흐름은<br />실전에서 이렇게 쓰입니다</h1>
          <p>기능 이름만 외우지 말고, 어떤 문제를 해결하기 위해 어느 이벤트와 저장소가 연결되는지 확인하세요.</p>
          <nav aria-label="활용 사례 바로가기">
            {cases.map((item) => <a href={`#case-${item.number}`} key={item.number}>{item.number} {item.title}</a>)}
          </nav>
        </div>
      </section>

      <section className="case-list content-wrap" aria-label="서비스 워커 활용 사례">
        {cases.map((item) => (
          <article className="use-case" id={`case-${item.number}`} key={item.number}>
            <header>
              <span>{item.number}</span>
              <div><p className="eyebrow">{item.tag}</p><h2>{item.title}</h2><p>{item.lead}</p></div>
            </header>
            <CaseVisual type={item.visual} />
            <div className="case-details">
              <section><span>WHY</span><h3>왜 필요한가</h3><p>{item.why}</p></section>
              <section><span>HOW</span><h3>어떻게 작동하는가</h3><p>{item.how}</p></section>
              <aside><span>CHECK</span><h3>확인할 점</h3><p>{item.check}</p></aside>
              <pre><code>{item.code}</code></pre>
            </div>
          </article>
        ))}
      </section>

      <section className="capability-limit">
        <div className="content-wrap">
          <p className="eyebrow">BOUNDARIES</p>
          <h2>강력하지만, 서버를 대신하지는 않습니다.</h2>
          <div>
            <article><span>가능</span><p>요청 라우팅, 오프라인 응답, 캐시, 푸시, 제한적인 백그라운드 작업</p></article>
            <article><span>불가</span><p>DOM 직접 조작, 무기한 실행, 서버 권한이 필요한 인증·인가 판단</p></article>
            <article><span>원칙</span><p>클라이언트 복원력은 높이되 데이터 무결성과 보안은 서버에서 다시 검증</p></article>
          </div>
          <Link className="button" href="/service-worker">실험실에서 직접 확인하기 →</Link>
        </div>
      </section>
    </main>
  );
}
