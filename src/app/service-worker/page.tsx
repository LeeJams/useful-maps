import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRightIcon } from "@/components/icons";
import { GuideHero } from "@/components/guide-hero";
import { getGuide } from "@/content/guides";
import { ServiceWorkerLab } from "./service-worker-lab";

const guide = getGuide("service-worker");

export const metadata: Metadata = {
  title: "Service Worker 요청 경로",
  description: "실제 서비스 워커를 사용해 Network First, Cache First, Stale While Revalidate와 오프라인 fallback을 비교합니다."
};

function WorkerHeroVisual() {
  return (
    <svg className="worker-hero-map" viewBox="0 0 640 640" role="img" aria-label="브라우저 요청을 네트워크 또는 캐시로 보내는 서비스 워커">
      <path className="hero-route route-a" d="M94 320H270" />
      <path className="hero-route route-b" d="M366 292C430 252 464 214 522 172" />
      <path className="hero-route route-c" d="M366 348C436 388 472 426 530 468" />
      <g transform="translate(44 268)">
        <rect width="100" height="104" rx="17" />
        <path d="M0 30h100M20 17h1M34 17h1M48 17h1" />
        <text x="50" y="132">BROWSER</text>
      </g>
      <g className="hero-worker-node" transform="translate(270 264)">
        <rect width="100" height="112" rx="27" />
        <path d="m50 22 26 15v31L50 84 24 68V37l26-15Z" />
        <path d="m50 36 14 8v17l-14 8-14-8V44l14-8Z" />
        <text x="50" y="140">WORKER</text>
      </g>
      <g transform="translate(486 116)">
        <circle cx="50" cy="50" r="48" />
        <path d="M2 50h96M50 2c24 25 24 71 0 96M50 2C26 27 26 73 50 98" />
        <text x="50" y="128">NETWORK</text>
      </g>
      <g transform="translate(488 420)">
        <ellipse cx="50" cy="18" rx="46" ry="17" />
        <path d="M4 18v66c0 22 92 22 92 0V18M4 51c0 22 92 22 92 0" />
        <text x="50" y="128">CACHE</text>
      </g>
      <circle className="hero-packet" r="7">
        <animateMotion dur="2.6s" repeatCount="indefinite" path="M94 320H318C410 320 434 214 522 172" />
      </circle>
    </svg>
  );
}

const lifecycle = [
  ["01", "Register", "페이지가 sw.js의 위치와 제어 범위(scope)를 브라우저에 등록합니다."],
  ["02", "Install", "앱 셸처럼 미리 필요한 응답을 Cache Storage에 저장합니다."],
  ["03", "Activate", "이전 버전 캐시를 정리하고 열린 탭의 제어권을 가져옵니다."],
  ["04", "Fetch", "각 요청을 네트워크, 캐시 또는 직접 만든 응답으로 라우팅합니다."]
];

export default function ServiceWorkerPage() {
  return (
    <main>
      <GuideHero
        guide={guide}
        title="페이지와 네트워크 사이의 중간 관리자"
        lead="서비스 워커는 브라우저 요청을 먼저 받아 네트워크로 보낼지, 캐시에서 꺼낼지, 직접 응답을 만들지 결정합니다. 전략을 바꾸며 같은 요청의 속도와 출처가 어떻게 달라지는지 확인하세요."
      >
        <WorkerHeroVisual />
      </GuideHero>

      <section className="why-strip content-wrap" aria-labelledby="worker-why">
        <div>
          <p className="eyebrow">WHY IT MATTERS</p>
          <h2 id="worker-why">왜 중간 계층이 필요할까요?</h2>
        </div>
        <article>
          <span>01 / 복원력</span>
          <h3>네트워크 실패를 UX 실패로 만들지 않습니다</h3>
          <p>연결이 끊겨도 캐시된 화면과 데이터를 돌려주거나, 상황을 설명하는 오프라인 응답을 직접 만들 수 있습니다.</p>
        </article>
        <article>
          <span>02 / 속도</span>
          <h3>매번 서버를 기다리지 않아도 됩니다</h3>
          <p>변화가 적은 리소스는 캐시에서 즉시 제공하고, 최신 값은 뒤에서 갱신해 체감 속도와 최신성을 함께 챙길 수 있습니다.</p>
        </article>
      </section>

      <ServiceWorkerLab />

      <section className="worker-lifecycle content-wrap" id="lifecycle">
        <div className="section-heading">
          <p className="eyebrow">HOW IT WORKS</p>
          <h2>설치부터 요청 개입까지 네 단계</h2>
          <p>서비스 워커는 페이지와 별도 스레드에서 살며 DOM에 직접 접근하지 않습니다. 대신 이벤트와 postMessage로 대화합니다.</p>
        </div>
        <ol>
          {lifecycle.map(([number, title, copy]) => (
            <li key={number}>
              <span>{number}</span>
              <div className="lifecycle-node" aria-hidden="true"><i /></div>
              <div><h3>{title}</h3><p>{copy}</p></div>
            </li>
          ))}
        </ol>
        <aside className="worker-constraints">
          <div><span>별도 스레드</span><strong>DOM 접근 불가</strong><p>페이지와는 postMessage로 상태와 로그를 주고받습니다.</p></div>
          <div><span>설치형</span><strong>탭 이후에도 유지</strong><p>다음 방문부터는 등록된 scope 안의 요청에 즉시 개입합니다.</p></div>
          <div><span>보안 컨텍스트</span><strong>HTTPS 또는 localhost</strong><p>요청을 가로채는 강한 권한이므로 안전한 출처에서만 동작합니다.</p></div>
        </aside>
      </section>

      <section className="use-case-bridge">
        <div className="content-wrap">
          <p className="eyebrow">FROM LAB TO PRODUCT</p>
          <h2>화면에서 본 흐름은<br />실전에서 어디에 쓰일까요?</h2>
          <p>PWA 오프라인 셸, 빠른 재방문, 푸시 알림, Background Sync, 안전한 업데이트까지 같은 생명주기에서 이어집니다.</p>
          <Link className="button" href="/service-worker/use-cases">6가지 활용 사례 보기 <ArrowUpRightIcon /></Link>
        </div>
      </section>
    </main>
  );
}
