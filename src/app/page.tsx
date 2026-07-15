import Link from "next/link";
import { ArrowUpRightIcon, GitBranchIcon, LayersIcon } from "@/components/icons";
import { guides } from "@/content/guides";

function MiniGitMap() {
  return (
    <svg className="mini-map" viewBox="0 0 380 170" role="img" aria-label="갈라지고 다시 합쳐지는 Git 커밋 그래프">
      <path d="M30 60H232C272 60 272 115 318 115h30" />
      <path className="accent-line" d="M122 60c26 0 26 55 58 55h168" />
      {[30, 76, 122, 180, 232].map((x) => <circle key={x} cx={x} cy="60" r="8" />)}
      {[180, 226, 272, 318, 348].map((x) => <circle className="accent-node" key={x} cx={x} cy="115" r="8" />)}
    </svg>
  );
}

function MiniWorkerMap() {
  return (
    <svg className="mini-map" viewBox="0 0 380 170" role="img" aria-label="브라우저, 서비스 워커, 네트워크와 캐시의 요청 경로">
      <path d="M44 86H144" />
      <path d="M194 78 298 42M194 94l104 34" />
      <rect x="20" y="66" width="46" height="40" rx="8" />
      <rect className="accent-node" x="142" y="58" width="54" height="56" rx="13" />
      <circle cx="318" cy="38" r="22" />
      <path d="M298 124h40v24h-40zM298 124c0 7 40 7 40 0" />
      <circle className="moving-dot" cx="94" cy="86" r="5" />
    </svg>
  );
}

export default function Home() {
  return (
    <main>
      <section className="home-hero page-wrap">
        <div className="home-kicker">
          <span>VISUAL KNOWLEDGE LIBRARY</span>
          <span>VOL. 01 — 2026</span>
        </div>
        <div className="home-title-lockup">
          <h1>쓸모<br />지도</h1>
          <div className="home-intro">
            <p>복잡한 개념은<br />작동하는 지도로 보면<br />훨씬 빨리 이해됩니다.</p>
            <a href="#guides">가이드 살펴보기 <span aria-hidden="true">↓</span></a>
          </div>
        </div>
        <div className="hero-atlas" aria-hidden="true">
          <div className="atlas-orbit orbit-one" />
          <div className="atlas-orbit orbit-two" />
          <div className="atlas-axis axis-x" />
          <div className="atlas-axis axis-y" />
          <span className="atlas-dot dot-a" />
          <span className="atlas-dot dot-b" />
          <span className="atlas-dot dot-c" />
          <span className="atlas-label label-a">WHY</span>
          <span className="atlas-label label-b">HOW</span>
          <span className="atlas-label label-c">TRY</span>
        </div>
      </section>

      <section className="library-intro page-wrap" id="guides">
        <p className="section-index">INDEX / 02 GUIDES</p>
        <div>
          <h2>외우기 전에,<br />구조부터 보세요.</h2>
          <p>
            모든 가이드는 <strong>왜 필요한지</strong>를 먼저 설명하고, 실제 상태를
            바꿔 보며 <strong>어떻게 작동하는지</strong> 확인하도록 설계합니다.
          </p>
        </div>
      </section>

      <section className="guide-index page-wrap" aria-label="가이드 목록">
        {guides.map((guide, index) => (
          <Link className={`guide-row guide-row-${guide.accent}`} href={guide.href} key={guide.slug}>
            <div className="guide-number">0{index + 1}</div>
            <div className="guide-row-copy">
              <p>{guide.eyebrow.split(" · ")[1]}</p>
              <h3>{guide.title}</h3>
              <span>{guide.summary}</span>
              <ul aria-label="주제 태그">
                {guide.tags.map((tag) => <li key={tag}>{tag}</li>)}
              </ul>
            </div>
            <div className="guide-preview">
              {guide.slug === "git" ? <MiniGitMap /> : <MiniWorkerMap />}
            </div>
            <ArrowUpRightIcon className="guide-arrow" />
          </Link>
        ))}
      </section>

      <section className="system-note page-wrap">
        <div className="system-note-icon"><LayersIcon /></div>
        <div>
          <p className="eyebrow">ONE SYSTEM, MANY TOPICS</p>
          <h2>다음 꿀팁도 같은 문법으로 쌓입니다.</h2>
        </div>
        <ol>
          <li><span>01</span>왜 필요한가</li>
          <li><span>02</span>어떻게 작동하는가</li>
          <li><span>03</span>직접 비교하기</li>
          <li><span>04</span>실전에 적용하기</li>
        </ol>
      </section>

      <footer className="site-footer page-wrap">
        <p><GitBranchIcon /> 구조를 이해하면 도구를 바꿔도 길을 잃지 않습니다.</p>
        <span>USEFUL MAPS · SEOUL</span>
      </footer>
    </main>
  );
}
