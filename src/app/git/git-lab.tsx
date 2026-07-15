"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/icons";

type Mode = "before" | "rebase" | "merge" | "noff" | "squash" | "ff" | "revert";

type Node = {
  id: string;
  x: number;
  y: number;
  kind: "main" | "feature" | "new" | "merge" | "squash" | "revert";
  note: string;
};

const modes: Record<Mode, {
  tab: string;
  label: string;
  title: string;
  copy: string;
  command: string;
  good: string;
  watch: string;
  caption: string;
}> = {
  before: {
    tab: "현재",
    label: "현재 상태",
    title: "feature에 7개 커밋이 쌓였습니다",
    copy: "feature/login은 C2에서 갈라졌고 F1부터 F7까지 작업했습니다. 그 사이 main에는 D1, D2가 추가됐습니다.",
    command: `git log --oneline --graph --decorate --all\n\n# main: C0-C1-C2-D1-D2\n# feature/login: C0-C1-C2-F1-...-F7`,
    good: "반영 방법을 고르기 전 현재 그래프 모양을 확인할 때",
    watch: "main에 무엇을 남길지에 따라 되돌리는 방법이 달라집니다.",
    caption: "C2에서 feature가 갈라졌고 main은 D2까지 앞으로 갔습니다."
  },
  rebase: {
    tab: "rebase 후",
    label: "Rebase",
    title: "F1~F7을 최신 main 뒤에 다시 적용합니다",
    copy: "D2 뒤에 F1′~F7′이 새로 만들어집니다. 새 부모와 스냅샷을 가지므로 SHA도 바뀝니다.",
    command: `git switch feature/login\ngit fetch origin\ngit rebase origin/main`,
    good: "혼자 쓰는 feature를 최신 main 기준으로 정리할 때",
    watch: "공유 브랜치에서는 기존 히스토리를 다시 쓰게 됩니다.",
    caption: "회색 F1~F7은 이전 위치이며, feature/login은 새 F7′을 가리킵니다."
  },
  merge: {
    tab: "기본 merge",
    label: "Default merge",
    title: "기본 merge는 현재 그래프를 보고 방식을 정합니다",
    copy: "지금처럼 main과 feature가 모두 전진해 갈라졌다면 M1이 생깁니다. main이 feature의 조상이라면 새 커밋 없이 fast-forward합니다.",
    command: `git switch main\ngit merge feature/login\n\n# 실제 결과 확인\ngit log --oneline --graph --decorate -12`,
    good: "Git의 기본 동작을 따르되 병합 뒤 그래프를 직접 확인할 때",
    watch: "같은 명령도 분기 상태에 따라 merge commit 또는 fast-forward가 됩니다.",
    caption: "현재 예시는 두 브랜치가 갈라져 있어 기본 merge도 D2와 F7을 부모로 둔 M1을 만듭니다."
  },
  noff: {
    tab: "--no-ff merge",
    label: "Forced merge commit",
    title: "--no-ff는 기능 병합의 경계 M1을 남깁니다",
    copy: "F1~F7 기록은 보존되고 M1은 D2와 F7을 부모로 가집니다. 이 M1이 기능 전체를 되돌릴 기준이 됩니다.",
    command: `git switch main\ngit merge --no-ff feature/login \\\n  -m "merge: feature/login"\n\n# 테스트 실패 시\ngit revert -m 1 <merge_sha>`,
    good: "세부 커밋과 기능 병합 경계를 함께 남길 때",
    watch: "merge revert 후 같은 feature를 그대로 재병합하면 원래 변경은 돌아오지 않습니다.",
    caption: "M1은 D2와 F7을 부모로 갖고, main은 M1을 가리킵니다."
  },
  squash: {
    tab: "squash merge",
    label: "Squash",
    title: "7개 커밋의 변경을 S1 하나로 기록합니다",
    copy: "main에는 기능 단위 커밋 하나만 남습니다. merge 관계는 남지 않으며 S1을 일반 커밋처럼 revert합니다.",
    command: `git switch main\ngit merge --squash feature/login\ngit commit -m "feat: login flow"\n\n# 테스트 실패 시\ngit revert <squash_sha>`,
    good: "main을 기능 단위로 간결하게 유지할 때",
    watch: "F1~F7의 세부 기록은 main 히스토리에 직접 남지 않습니다.",
    caption: "F1~F7의 변경이 S1 하나로 기록되고 main은 S1을 가리킵니다."
  },
  ff: {
    tab: "rebase + ff",
    label: "Rebase + ff-only",
    title: "선형 그래프가 되지만 범위 revert가 필요합니다",
    copy: "main이 F7′까지 이동해 그래프는 깔끔합니다. 실패하면 되돌릴 커밋 범위를 직접 지정해야 합니다.",
    command: `git switch feature/login\ngit rebase main\ngit switch main\ngit merge --ff-only feature/login\n\n# 실패 시 F1′^..F7′ 범위를 확인`,
    good: "선형 히스토리와 정확한 범위 관리가 중요할 때",
    watch: "기능 단위 rollback이 우선이면 --no-ff나 squash가 더 단순합니다.",
    caption: "main과 feature/login이 F7′을 함께 가리킵니다."
  },
  revert: {
    tab: "merge revert",
    label: "Merge revert",
    title: "되돌리는 새 커밋 R1이 생깁니다",
    copy: "M1을 삭제하지 않고 선택한 mainline 부모와 M1 사이의 차이를 반대로 적용한 새 기록을 남깁니다.",
    command: `MERGE_SHA=abc1234\ngit show --pretty=raw "$MERGE_SHA"\ngit revert -m 1 "$MERGE_SHA"\n\n# 충돌 시 해결 후\ngit add path/to/resolved-file\ngit revert --continue`,
    good: "공유 히스토리를 다시 쓰지 않고 되돌릴 때",
    watch: "squash commit은 merge가 아니므로 -m 1 없이 일반 revert를 사용합니다.",
    caption: "M1과 ancestry는 남고, 변경을 반대로 적용한 R1이 추가됩니다."
  }
};

const baseNodes: Node[] = [
  { id: "C0", x: 70, y: 115, kind: "main", note: "처음 기준이 되는 커밋" },
  { id: "C1", x: 150, y: 115, kind: "main", note: "main의 이전 커밋" },
  { id: "C2", x: 230, y: 115, kind: "main", note: "feature가 갈라진 지점" },
  { id: "D1", x: 340, y: 115, kind: "main", note: "다른 작업이 main에 추가됨" },
  { id: "D2", x: 450, y: 115, kind: "main", note: "현재 main의 끝" }
];

const featureNodes: Node[] = Array.from({ length: 7 }, (_, index) => ({
  id: `F${index + 1}`,
  x: 320 + index * 72,
  y: 255,
  kind: "feature",
  note: `feature/login의 ${index + 1}번째 커밋`
}));

const rebasedNodes: Node[] = Array.from({ length: 7 }, (_, index) => ({
  id: `F${index + 1}′`,
  x: 520 + index * 54,
  y: 115,
  kind: "new",
  note: `rebase 후 새로 만든 ${index + 1}번째 커밋`
}));

function lineThrough(nodes: Array<{ x: number; y: number }>) {
  return nodes.map((node, index) => `${index === 0 ? "M" : "L"}${node.x} ${node.y}`).join(" ");
}

function CommitNode({ node, ghost, onSelect }: { node: Node; ghost?: boolean; onSelect: (node: Node) => void }) {
  return (
    <g
      className={`commit-node node-${node.kind}${ghost ? " node-ghost" : ""}`}
      role={ghost ? undefined : "button"}
      tabIndex={ghost ? undefined : 0}
      aria-label={ghost ? undefined : `${node.id}: ${node.note}`}
      onClick={ghost ? undefined : () => onSelect(node)}
      onKeyDown={ghost ? undefined : (event) => {
        if (event.key === "Enter" || event.key === " ") onSelect(node);
      }}
    >
      <circle cx={node.x} cy={node.y} r={node.kind === "main" ? 20 : 18} />
      <text x={node.x} y={node.y}>{node.id}</text>
    </g>
  );
}

function BranchLabel({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return <text className="branch-label" x={x} y={y}>{children}</text>;
}

function CommitGraph({ mode, onSelect }: { mode: Mode; onSelect: (node: Node) => void }) {
  const showGhost = mode === "rebase" || mode === "ff";
  const mergeNode: Node = {
    id: "M1",
    x: 790,
    y: 115,
    kind: "merge",
    note: mode === "merge" ? "브랜치가 갈라져 기본 merge가 만든 커밋" : "기능 병합의 경계가 되는 merge commit"
  };
  const squashNode: Node = { id: "S1", x: 790, y: 115, kind: "squash", note: "F1~F7 변경을 합친 squash commit" };
  const revertNode: Node = { id: "R1", x: 860, y: 115, kind: "revert", note: "M1의 변경을 되돌리는 새 커밋" };

  return (
    <svg className="commit-graph" viewBox="0 0 920 355" role="group" aria-label="조작 가능한 Git 커밋 그래프">
      <BranchLabel x={48} y={70}>main</BranchLabel>
      <BranchLabel x={48} y={310}>{showGhost ? "rebase 전 위치" : "feature/login"}</BranchLabel>
      <path className="graph-line" d={lineThrough(baseNodes)} />
      <path className={`graph-line graph-feature${showGhost ? " graph-ghost" : ""}`} d={`M230 115 C255 115 278 255 320 255 H752`} />
      {baseNodes.map((node) => <CommitNode node={node} key={node.id} onSelect={onSelect} />)}
      {featureNodes.map((node) => <CommitNode ghost={showGhost} node={node} key={node.id} onSelect={onSelect} />)}

      {(mode === "rebase" || mode === "ff") && (
        <>
          <path className="graph-line graph-rebased" d={`M450 115 H844`} />
          {rebasedNodes.map((node) => <CommitNode node={node} key={node.id} onSelect={onSelect} />)}
          <BranchLabel x={mode === "ff" ? 738 : 752} y={72}>{mode === "ff" ? "main + feature" : "feature/login"}</BranchLabel>
        </>
      )}

      {(mode === "merge" || mode === "noff" || mode === "revert") && (
        <>
          <path className="graph-line" d="M450 115H790" />
          <path className="graph-line graph-feature" d="M752 255C790 240 810 165 790 115" />
          <CommitNode node={mergeNode} onSelect={onSelect} />
          <BranchLabel x={748} y={310}>feature/login</BranchLabel>
          {mode !== "revert" && <BranchLabel x={mode === "merge" ? 680 : 700} y={72}>{mode === "merge" ? "main · diverged" : "main · --no-ff"}</BranchLabel>}
        </>
      )}

      {mode === "squash" && (
        <>
          <path className="graph-line" d="M450 115H790" />
          <CommitNode node={squashNode} onSelect={onSelect} />
          <BranchLabel x={690} y={72}>main · F1~F7 → S1</BranchLabel>
        </>
      )}

      {mode === "revert" && (
        <>
          <path className="graph-line graph-revert" d="M790 115H860" />
          <CommitNode node={revertNode} onSelect={onSelect} />
          <BranchLabel x={750} y={72}>main</BranchLabel>
        </>
      )}

      {mode === "before" && (
        <>
          <BranchLabel x={423} y={72}>main</BranchLabel>
          <BranchLabel x={735} y={310}>feature/login</BranchLabel>
        </>
      )}
    </svg>
  );
}

export function GitLab() {
  const [mode, setMode] = useState<Mode>("before");
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [copied, setCopied] = useState(false);
  const data = modes[mode];

  async function copyCommand() {
    await navigator.clipboard.writeText(data.command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <section className="git-lab-shell" id="lab" aria-labelledby="git-lab-title">
      <div className="git-lab content-wrap">
        <header className="lab-header">
          <div>
            <p className="eyebrow">INTERACTIVE COMMIT MAP</p>
            <h2 id="git-lab-title">같은 7개 커밋, 일곱 가지 결과</h2>
            <p>결과를 선택하면 그래프와 해설, 되돌리는 기준이 함께 바뀝니다.</p>
          </div>
          <div className="mode-tabs" role="group" aria-label="그래프 단계 선택">
            {(Object.keys(modes) as Mode[]).map((key) => (
              <button
                className={mode === key ? "active" : ""}
                key={key}
                type="button"
                aria-pressed={mode === key}
                onClick={() => { setMode(key); setSelectedNode(null); }}
              >
                {modes[key].tab}
              </button>
            ))}
          </div>
        </header>

        <div className="lab-workspace">
          <div className="graph-panel">
            <div className="graph-scroll">
              <CommitGraph mode={mode} onSelect={setSelectedNode} />
            </div>
            <div className="graph-caption">
              <p>{data.caption}</p>
              <p aria-live="polite">{selectedNode ? `${selectedNode.id}: ${selectedNode.note}` : "커밋 노드를 누르면 설명이 바뀝니다."}</p>
            </div>
            <div className="graph-legend" aria-label="범례">
              <span><i className="legend-main" />main</span>
              <span><i className="legend-feature" />feature</span>
              <span><i className="legend-new" />rebase 후</span>
              <span><i className="legend-merge" />merge</span>
              <span><i className="legend-squash" />squash</span>
              <span><i className="legend-revert" />revert</span>
            </div>
          </div>

          <aside className="git-inspector">
            <p className="inspector-label">{data.label}</p>
            <h3>{data.title}</h3>
            <p>{data.copy}</p>
            <div className="code-block">
              <div><span>terminal</span><button type="button" onClick={copyCommand}>{copied ? <CheckIcon /> : <CopyIcon />}{copied ? "복사됨" : "복사"}</button></div>
              <pre><code>{data.command}</code></pre>
            </div>
            <dl className="decision-notes">
              <div><dt>좋은 상황</dt><dd>{data.good}</dd></div>
              <div><dt>확인할 점</dt><dd>{data.watch}</dd></div>
            </dl>
          </aside>
        </div>
      </div>
    </section>
  );
}
