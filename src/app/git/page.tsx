import type { Metadata } from "next";
import { GuideHero } from "@/components/guide-hero";
import { getGuide } from "@/content/guides";
import { GitLab } from "./git-lab";

const guide = getGuide("git");

export const metadata: Metadata = {
  title: "Git 그래프와 안전한 되돌리기",
  description: "Rebase, merge, squash, revert가 커밋 그래프와 rollback 방식에 주는 영향을 직접 비교합니다."
};

function GitHeroVisual() {
  return (
    <svg className="git-hero-map" viewBox="0 0 620 620" role="img" aria-label="갈라진 브랜치가 merge commit으로 합쳐지는 커밋 그래프">
      <text x="62" y="150">MAIN</text>
      <text x="62" y="436">FEATURE / LOGIN</text>
      <path className="git-hero-main" d="M68 210H466C520 210 526 320 558 320" />
      <path className="git-hero-feature" d="M214 210c46 0 36 110 96 110h248" />
      {[68, 140, 214, 340, 450].map((x, index) => (
        <g key={x} transform={`translate(${x} 210)`}>
          <circle r="18" />
          <text>{index < 3 ? `C${index}` : `D${index - 2}`}</text>
        </g>
      ))}
      {[310, 372, 434, 496].map((x, index) => (
        <g className="feature-commit" key={x} transform={`translate(${x} 320)`}>
          <circle r="18" />
          <text>{`F${index + 1}`}</text>
        </g>
      ))}
      <g className="merge-commit" transform="translate(558 320)">
        <circle r="23" />
        <text>M1</text>
      </g>
      <path className="git-hero-dash" d="M96 510h430" />
      <text x="96" y="540">A GRAPH IS A DECISION RECORD</text>
    </svg>
  );
}

const concepts = [
  ["Commit", "프로젝트의 스냅샷입니다. 각 커밋은 부모 커밋을 가리키기 때문에 선으로 이어집니다."],
  ["Branch", "커밋을 가리키는 이동 가능한 이름표입니다. 새 커밋이 생기면 현재 브랜치가 앞으로 움직입니다."],
  ["Merge", "두 갈래의 변경을 합칩니다. 기본 merge는 가능한 경우 fast-forward하고, --no-ff는 합친 순간을 커밋으로 남깁니다."],
  ["Rebase", "내 변경을 최신 기준 뒤에 새 커밋으로 다시 적용합니다. 부모가 달라지므로 SHA도 달라집니다."]
];

const strategies = [
  {
    name: "Default merge",
    shape: "분기했으면 M1, 아니면 fast-forward",
    rollback: "M1 여부를 확인한 뒤 방식 결정",
    best: "기본 동작을 사용하고 결과 그래프를 확인할 때",
    tone: "조건부"
  },
  {
    name: "--no-ff merge",
    shape: "F1~F7 기록 + M1",
    rollback: "git revert -m 1 <merge_sha>",
    best: "세부 기록과 기능 병합의 경계를 모두 남기고 싶을 때",
    tone: "추천"
  },
  {
    name: "Squash merge",
    shape: "변경 전체를 S1 하나로",
    rollback: "git revert <squash_sha>",
    best: "main을 기능 단위로 간결하게 읽고 싶을 때",
    tone: "간결"
  },
  {
    name: "Rebase + ff-only",
    shape: "F1′~F7′이 일렬로",
    rollback: "연속 범위를 확인해 한 번에 revert",
    best: "선형 기록과 정확한 범위 관리가 더 중요할 때",
    tone: "범위 확인"
  }
];

const commandSets = [
  {
    number: "01",
    title: "최신 main 위에서 다시 테스트",
    note: "혼자 쓰는 feature 브랜치일 때 사용하세요.",
    code: `git switch feature/login\ngit fetch origin\ngit rebase origin/main\n\n# 충돌을 해결했다면\ngit add path/to/resolved-file\ngit rebase --continue`
  },
  {
    number: "02",
    title: "기본 merge 결과 확인",
    note: "분기했다면 merge commit, 아니라면 fast-forward가 됩니다.",
    code: `git switch main\ngit pull --ff-only\ngit merge feature/login\n\n# merge 방식과 부모 수 확인\ngit log --oneline --graph --decorate -12\ngit show --no-patch --pretty=raw HEAD`
  },
  {
    number: "03",
    title: "기능 경계를 남겨 합치기",
    note: "테스트 실패 시 하나의 merge commit을 기준으로 되돌립니다.",
    code: `git switch main\ngit pull --ff-only\ngit merge --no-ff feature/login \\\n  -m "merge: feature/login"\nMERGE_SHA=$(git rev-parse HEAD)\n\n# 부모 순서를 확인한 다음\ngit show --pretty=raw "$MERGE_SHA"\ngit revert -m 1 "$MERGE_SHA"`
  },
  {
    number: "04",
    title: "연속된 범위를 한 revert로 묶기",
    note: "first와 last는 실제 SHA로 바꾸고 범위를 먼저 확인하세요.",
    code: `git log --reverse --oneline \\\n  "\${FIRST_SHA}^..\${LAST_SHA}"\ngit revert --no-commit \\\n  "\${FIRST_SHA}^..\${LAST_SHA}"\ngit diff --cached\ngit commit -m "revert: feature/login"`
  }
];

export default function GitGuidePage() {
  return (
    <main>
      <GuideHero
        guide={guide}
        title="Git은 커밋 그래프를 만들고 이어 가는 도구입니다"
        lead="브랜치, rebase, merge, revert는 모두 그래프의 모양을 바꾸는 선택입니다. 같은 7개 커밋을 일곱 가지 결과로 바꿔 보며, 나중에 무엇을 기준으로 되돌릴지 확인하세요."
      >
        <GitHeroVisual />
      </GuideHero>

      <section className="why-strip content-wrap" aria-labelledby="git-why">
        <div>
          <p className="eyebrow">WHY IT MATTERS</p>
          <h2 id="git-why">왜 그래프로 봐야 할까요?</h2>
        </div>
        <article>
          <span>01 / 판단</span>
          <h3>같은 코드도 남는 기록이 다릅니다</h3>
          <p>merge와 squash는 최종 파일이 같아도 ancestry와 되돌릴 단위가 다릅니다. 명령어보다 먼저 “main에 어떤 모양을 남길지” 정해야 합니다.</p>
        </article>
        <article>
          <span>02 / 복구</span>
          <h3>되돌리기는 삭제가 아니라 새 기록입니다</h3>
          <p>공유된 main에서는 과거를 지우는 reset보다 반대 변경을 새 커밋으로 남기는 revert가 안전합니다. 그래프는 그 복구 기록까지 보여 줍니다.</p>
        </article>
      </section>

      <GitLab />

      <section className="git-concepts content-wrap" id="basics">
        <div className="section-heading">
          <p className="eyebrow">FOUNDATION</p>
          <h2>기본 개념은 네 가지입니다</h2>
          <p>Git이 어렵게 느껴질 때는 명령어보다 그래프에서 무엇이 움직이는지 먼저 보세요.</p>
        </div>
        <div className="concept-list">
          {concepts.map(([title, copy], index) => (
            <article key={title}>
              <span>0{index + 1}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rebase-story content-wrap" id="rebase">
        <div className="section-heading">
          <p className="eyebrow">HOW REBASE WORKS</p>
          <h2>내 변경을 최신 main 위에 다시 적용합니다</h2>
          <p>그래프는 깔끔해지지만 커밋 ID가 바뀝니다. 그래서 혼자 쓰는 feature 브랜치에서 가장 안전합니다.</p>
        </div>
        <ol className="story-steps">
          <li><span>01</span><div><h3>main이 먼저 앞으로 갑니다</h3><p>D1, D2가 main에 추가되고 내 feature는 C2에서 갈라져 있습니다.</p></div></li>
          <li><span>02</span><div><h3>내 커밋의 변경을 잠시 떼어 둡니다</h3><p>Git은 F1부터 F7까지 각 커밋의 diff를 순서대로 다시 적용할 준비를 합니다.</p></div></li>
          <li><span>03</span><div><h3>D2 뒤에 새 커밋으로 붙입니다</h3><p>F1′부터 F7′이 만들어집니다. 부모와 스냅샷이 달라져 SHA도 바뀝니다.</p></div></li>
          <li><span>04</span><div><h3>충돌은 멈춘 지점에서 해결합니다</h3><p><code>git status</code>로 확인한 뒤 <code>git add</code>, <code>git rebase --continue</code> 순서로 진행합니다.</p></div></li>
        </ol>
        <aside className="rebase-rule">
          <p className="eyebrow">SAFE DEFAULT</p>
          <strong>이미 팀원이 가져간 브랜치라면 rebase보다 merge를 먼저 고려하세요.</strong>
          <p>혼자 쓰는 원격 feature를 rebase한 경우에도 팀 정책을 확인하고, 필요하다면 일반 <code>--force</code> 대신 <code>--force-with-lease</code>를 사용합니다.</p>
        </aside>
      </section>

      <section className="strategy-section content-wrap" id="safe-merge">
        <div className="section-heading">
          <p className="eyebrow">CHOOSE A BOUNDARY</p>
          <h2>7개 커밋을 되돌리기 쉽게 합치는 방법</h2>
          <p>테스트 실패에 대비한다면 “main에 어떤 경계를 남길지”가 가장 중요합니다.</p>
        </div>
        <div className="strategy-table" role="table" aria-label="Git 병합 전략 비교">
          <div className="strategy-head" role="row">
            <span role="columnheader">전략</span><span role="columnheader">main에 남는 모양</span><span role="columnheader">실패 시</span><span role="columnheader">추천 상황</span>
          </div>
          {strategies.map((strategy, index) => (
            <article role="row" key={strategy.name}>
              <div role="cell"><small>0{index + 1}</small><strong>{strategy.name}</strong><em>{strategy.tone}</em></div>
              <p role="cell">{strategy.shape}</p>
              <p role="cell"><code>{strategy.rollback}</code></p>
              <p role="cell">{strategy.best}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="command-section content-wrap" id="commands">
        <div className="section-heading">
          <p className="eyebrow">COPY, THEN VERIFY</p>
          <h2>실전 명령어</h2>
          <p>실행 전 <code>git status</code>와 그래프를 확인하고, 예시 SHA와 브랜치 이름은 실제 값으로 바꾸세요.</p>
        </div>
        <div className="command-list">
          {commandSets.map((command) => (
            <article key={command.number}>
              <header><span>{command.number}</span><div><h3>{command.title}</h3><p>{command.note}</p></div></header>
              <pre><code>{command.code}</code></pre>
            </article>
          ))}
        </div>
      </section>

      <section className="tip-section content-wrap" id="tips">
        <div className="section-heading">
          <p className="eyebrow">KEEP THESE FOUR</p>
          <h2>길을 잃었을 때 기억할 것</h2>
        </div>
        <div className="tip-grid">
          <article><span>01</span><h3>먼저 그래프를 보세요</h3><p><code>git log --oneline --graph --decorate --all</code>은 가장 빠른 지도입니다.</p></article>
          <article><span>02</span><h3>공유 브랜치 rebase는 조심하세요</h3><p>이미 다른 사람이 가져갔다면 rebase보다 merge가 보통 안전합니다.</p></article>
          <article><span>03</span><h3>공유된 main은 revert로 복구하세요</h3><p>reset과 force-push보다 협업 기록을 보존하기 쉽습니다.</p></article>
          <article><span>04</span><h3>PR 버튼도 전략입니다</h3><p>“Create a merge commit”과 “Squash and merge”는 서로 다른 기록을 남깁니다.</p></article>
        </div>
      </section>
    </main>
  );
}
