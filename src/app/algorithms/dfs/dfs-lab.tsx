"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./dfs.module.css";

type NodeId = "A" | "B" | "C" | "D" | "E" | "F" | "G";
type DfsMode = "recursive" | "explicit";
type NeighborOrder = "left" | "right";
type StepKind = "ready" | "visit" | "skip" | "return" | "complete";

type StackFrame = {
  node: NodeId;
  nextNeighbor: number;
};

type TraceState = {
  kind: StepKind;
  current: NodeId | null;
  returningFrom: NodeId | null;
  visited: NodeId[];
  stack: StackFrame[];
  edge: readonly [NodeId, NodeId] | null;
  message: string;
  nextAction: string;
};

const NODE_POSITIONS: Record<NodeId, { x: number; y: number }> = {
  A: { x: 350, y: 64 },
  B: { x: 150, y: 150 },
  C: { x: 550, y: 150 },
  D: { x: 48, y: 300 },
  E: { x: 215, y: 318 },
  F: { x: 485, y: 318 },
  G: { x: 652, y: 300 }
};

const EDGES: readonly (readonly [NodeId, NodeId])[] = [
  ["A", "B"],
  ["A", "C"],
  ["B", "D"],
  ["B", "E"],
  ["E", "F"],
  ["F", "C"],
  ["C", "G"]
];

const NEIGHBORS: Record<NeighborOrder, Record<NodeId, NodeId[]>> = {
  left: {
    A: ["B", "C"],
    B: ["D", "E", "A"],
    C: ["G", "A", "F"],
    D: ["B"],
    E: ["F", "B"],
    F: ["C", "E"],
    G: ["C"]
  },
  right: {
    A: ["C", "B"],
    B: ["E", "D", "A"],
    C: ["G", "F", "A"],
    D: ["B"],
    E: ["F", "B"],
    F: ["E", "C"],
    G: ["C"]
  }
};

const MODE_LABELS: Record<DfsMode, string> = {
  recursive: "재귀 호출",
  explicit: "직접 관리 프레임"
};

const CYCLE_EDGES = new Set(["A-B", "A-C", "B-E", "E-F", "C-F"]);

const KIND_LABELS: Record<StepKind, string> = {
  ready: "시작 전",
  visit: "더 깊게",
  skip: "이미 방문",
  return: "되돌아가기",
  complete: "탐색 완료"
};

function cloneStack(stack: StackFrame[]) {
  return stack.map((frame) => ({ ...frame }));
}

function describeNext(stack: StackFrame[], neighbors: Record<NodeId, NodeId[]>) {
  const top = stack.at(-1);

  if (!top) return "모든 프레임이 비었습니다. 탐색을 마칩니다.";

  const next = neighbors[top.node][top.nextNeighbor];
  if (next) return `${top.node}의 다음 이웃 ${next}를 확인합니다.`;
  return `${top.node}에 남은 이웃이 없습니다. 이 프레임을 제거하고 되돌아갑니다.`;
}

function makeTrace(mode: DfsMode, order: NeighborOrder): TraceState[] {
  const neighbors = NEIGHBORS[order];
  const visited = new Set<NodeId>();
  const stack: StackFrame[] = [];
  const states: TraceState[] = [
    {
      kind: "ready",
      current: null,
      returningFrom: null,
      visited: [],
      stack: [],
      edge: null,
      message: "아직 아무 노드도 방문하지 않았습니다. 시작점은 A입니다.",
      nextAction: mode === "recursive" ? "dfs(A)를 호출합니다." : "A 프레임을 명시적 스택에 push합니다."
    }
  ];

  visited.add("A");
  stack.push({ node: "A", nextNeighbor: 0 });
  states.push({
    kind: "visit",
    current: "A",
    returningFrom: null,
    visited: [...visited],
    stack: cloneStack(stack),
    edge: null,
    message: mode === "recursive"
      ? "dfs(A)의 호출 프레임이 쌓이고 A를 방문 표시했습니다."
      : "코드가 A 프레임을 스택에 넣고 A를 방문 표시했습니다.",
    nextAction: describeNext(stack, neighbors)
  });

  while (stack.length > 0) {
    const frame = stack.at(-1);
    if (!frame) break;

    const neighbor = neighbors[frame.node][frame.nextNeighbor];

    if (neighbor) {
      frame.nextNeighbor += 1;

      if (visited.has(neighbor)) {
        states.push({
          kind: "skip",
          current: frame.node,
          returningFrom: null,
          visited: [...visited],
          stack: cloneStack(stack),
          edge: [frame.node, neighbor],
          message: `${frame.node}에서 ${neighbor}를 확인했지만 이미 방문한 노드라 건너뜁니다. 이 표시가 사이클을 막습니다.`,
          nextAction: describeNext(stack, neighbors)
        });
        continue;
      }

      visited.add(neighbor);
      stack.push({ node: neighbor, nextNeighbor: 0 });
      states.push({
        kind: "visit",
        current: neighbor,
        returningFrom: null,
        visited: [...visited],
        stack: cloneStack(stack),
        edge: [frame.node, neighbor],
        message: mode === "recursive"
          ? `${frame.node}에서 ${neighbor}를 골라 dfs(${neighbor})를 호출했습니다. 새 호출 프레임이 맨 위에 쌓입니다.`
          : `${frame.node} 프레임의 위치를 기억한 채 ${neighbor} 프레임을 배열 맨 뒤에 push했습니다.`,
        nextAction: describeNext(stack, neighbors)
      });
      continue;
    }

    const finished = stack.pop();
    if (!finished) break;

    const parent = stack.at(-1)?.node ?? null;
    if (parent) {
      states.push({
        kind: "return",
        current: parent,
        returningFrom: finished.node,
        visited: [...visited],
        stack: cloneStack(stack),
        edge: [finished.node, parent],
        message: mode === "recursive"
          ? `dfs(${finished.node})가 끝났습니다. 호출 프레임이 제거되고 dfs(${parent})로 반환합니다.`
          : `${finished.node} 프레임을 직접 pop했습니다. 이제 ${parent} 프레임이 맨 위로 돌아옵니다.`,
        nextAction: describeNext(stack, neighbors)
      });
    } else {
      states.push({
        kind: "complete",
        current: null,
        returningFrom: finished.node,
        visited: [...visited],
        stack: [],
        edge: null,
        message: `${finished.node}까지 모든 프레임이 비었습니다. 연결된 7개 노드를 모두 방문했습니다.`,
        nextAction: "이웃 순서를 바꾸면 방문 순서는 달라지지만 방문한 노드 집합은 같습니다."
      });
    }
  }

  return states;
}

function edgeKey(first: NodeId, second: NodeId) {
  return [first, second].sort().join("-");
}

function directedSegment(first: NodeId, second: NodeId) {
  const start = NODE_POSITIONS[first];
  const end = NODE_POSITIONS[second];
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const length = Math.hypot(deltaX, deltaY);
  const inset = 36;
  const unitX = deltaX / length;
  const unitY = deltaY / length;

  return {
    x1: start.x + unitX * inset,
    y1: start.y + unitY * inset,
    x2: end.x - unitX * inset,
    y2: end.y - unitY * inset
  };
}

export function DfsLab() {
  const [mode, setMode] = useState<DfsMode>("recursive");
  const [order, setOrder] = useState<NeighborOrder>("left");
  const [stepIndex, setStepIndex] = useState(0);
  const [isAuto, setIsAuto] = useState(false);
  const trace = useMemo(() => makeTrace(mode, order), [mode, order]);
  const state = trace[stepIndex] ?? trace[0];
  const isComplete = stepIndex === trace.length - 1;
  const visibleStack = [...state.stack].reverse();

  useEffect(() => {
    if (!isAuto || isComplete) return;

    const timer = window.setTimeout(() => {
      setStepIndex((current) => Math.min(current + 1, trace.length - 1));
    }, 800);

    return () => window.clearTimeout(timer);
  }, [isAuto, isComplete, stepIndex, trace.length]);

  function restart() {
    setIsAuto(false);
    setStepIndex(0);
  }

  function chooseMode(nextMode: DfsMode) {
    setMode(nextMode);
    setIsAuto(false);
    setStepIndex(0);
  }

  function chooseOrder(nextOrder: NeighborOrder) {
    setOrder(nextOrder);
    setIsAuto(false);
    setStepIndex(0);
  }

  function advanceOneStep() {
    setIsAuto(false);
    setStepIndex((current) => Math.min(current + 1, trace.length - 1));
  }

  return (
    <section className={styles.lab} aria-labelledby="dfs-lab-title">
      <div className="content-wrap">
        <div className={styles.labHeading}>
          <div>
            <p className="eyebrow">TRY · 직접 비교하기</p>
            <h2 id="dfs-lab-title">사이클 속에서 깊이와 복귀를 따라가세요</h2>
            <p>같은 사이클 그래프와 시작점 A를 사용합니다. 화살표 방향, 현재 노드, 방문 집합, 프레임 스택이 한 단계마다 같은 사건을 가리키는지 확인하세요.</p>
          </div>
          <p className={styles.scopeNote}><strong>방문 범위는 항상 A~G, 7개</strong><span>왼쪽 우선과 오른쪽 우선은 “누가 먼저인가”만 바꿉니다.</span></p>
        </div>

        <div className={styles.labControls}>
          <fieldset>
            <legend>구현 방식</legend>
            <div className={styles.segmented}>
              {(["recursive", "explicit"] as const).map((item) => (
                <button
                  aria-pressed={mode === item}
                  className={mode === item ? styles.selected : undefined}
                  key={item}
                  onClick={() => chooseMode(item)}
                  type="button"
                >
                  {item === "recursive" ? "재귀 호출" : "명시적 스택 · 프레임"}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>이웃을 읽는 순서</legend>
            <div className={styles.segmented}>
              {(["left", "right"] as const).map((item) => (
                <button
                  aria-pressed={order === item}
                  className={order === item ? styles.selected : undefined}
                  key={item}
                  onClick={() => chooseOrder(item)}
                  type="button"
                >
                  {item === "left" ? "왼쪽 먼저" : "오른쪽 먼저"}
                </button>
              ))}
            </div>
          </fieldset>
          <div className={styles.playback} aria-label="탐색 재생 제어">
            <button disabled={isComplete} onClick={advanceOneStep} type="button">한 단계</button>
            <button
              className={styles.primaryControl}
              disabled={isComplete}
              onClick={() => setIsAuto((current) => !current)}
              type="button"
            >
              {isComplete ? "완료" : isAuto ? "멈춤" : "자동 실행"}
            </button>
            <button onClick={restart} type="button">처음부터</button>
          </div>
        </div>

        <p className={styles.modeNote}>
          {mode === "recursive"
            ? "런타임 호출 스택이 { node, nextNeighbor }에 해당하는 정보를 함수 프레임으로 기억합니다."
            : "이 모드는 노드 대기 목록이 아니라 { node, nextNeighbor } 프레임을 배열로 직접 관리해 재귀의 복귀를 그대로 재현합니다."}
        </p>

        <div className={styles.progressRow}>
          <span>STEP {String(stepIndex).padStart(2, "0")} / {String(trace.length - 1).padStart(2, "0")}</span>
          <progress aria-label="DFS 탐색 진행률" max={trace.length - 1} value={stepIndex} />
          <strong className={styles[`phase${state.kind[0].toUpperCase()}${state.kind.slice(1)}`]}>{KIND_LABELS[state.kind]}</strong>
        </div>

        <div className={styles.workspace}>
          <div className={styles.graphPanel}>
            <div className={styles.panelLabel}>
              <span>UNDIRECTED CYCLIC GRAPH</span>
              <p>선택: {order === "left" ? "왼쪽 이웃부터" : "오른쪽 이웃부터"}</p>
            </div>
            <svg
              aria-labelledby="dfs-graph-title dfs-graph-description"
              className={styles.graph}
              role="img"
              viewBox="0 0 700 390"
            >
              <title id="dfs-graph-title">DFS 고정 그래프의 현재 탐색 상태</title>
              <desc id="dfs-graph-description">
                A-B-E-F-C-A 사이클이 있는 그래프입니다. 현재 {state.current ?? "없음"}, 방문 순서 {state.visited.join(", ") || "없음"}, 단계 {KIND_LABELS[state.kind]}
                {state.edge ? `, 화살표 ${state.edge[0]}에서 ${state.edge[1]} 방향` : ""}
              </desc>
              <defs>
                <marker id="dfs-visit-arrow" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
                  <path className={styles.visitArrowHead} d="M0 0 8 4 0 8Z" />
                </marker>
                <marker id="dfs-return-arrow" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
                  <path className={styles.returnArrowHead} d="M0 0 8 4 0 8Z" />
                </marker>
                <marker id="dfs-skip-arrow" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
                  <path className={styles.skipArrowHead} d="M0 0 8 4 0 8Z" />
                </marker>
              </defs>
              {EDGES.map(([first, second]) => {
                const start = NODE_POSITIONS[first];
                const end = NODE_POSITIONS[second];
                const key = edgeKey(first, second);
                return (
                  <line
                    className={`${styles.graphEdge} ${CYCLE_EDGES.has(key) ? styles.cycleEdge : styles.leafEdge}`}
                    key={key}
                    x1={start.x}
                    x2={end.x}
                    y1={start.y}
                    y2={end.y}
                  />
                );
              })}
              <g className={styles.graphCycleStamp} transform="translate(350 216)">
                <rect height="42" rx="21" width="188" x="-94" y="-21" />
                <text y="-3">CYCLE</text>
                <text y="12">A—B—E—F—C—A</text>
              </g>
              {state.edge ? (() => {
                const segment = directedSegment(...state.edge);
                const edgeClass = state.kind === "return"
                  ? styles.returnEdge
                  : state.kind === "skip"
                    ? styles.skipEdge
                    : "";
                const marker = state.kind === "return"
                  ? "url(#dfs-return-arrow)"
                  : state.kind === "skip"
                    ? "url(#dfs-skip-arrow)"
                    : "url(#dfs-visit-arrow)";
                return (
                  <line
                    className={`${styles.activeEdge} ${edgeClass}`}
                    markerEnd={marker}
                    x1={segment.x1}
                    x2={segment.x2}
                    y1={segment.y1}
                    y2={segment.y2}
                  />
                );
              })() : null}
              {(Object.keys(NODE_POSITIONS) as NodeId[]).map((node) => {
                const position = NODE_POSITIONS[node];
                const isVisited = state.visited.includes(node);
                const isCurrent = state.current === node;
                const isReturning = state.returningFrom === node && state.kind === "return";
                const isChecked = state.kind === "skip" && state.edge?.[1] === node;
                return (
                  <g
                    className={`${styles.graphNode} ${isVisited ? styles.visitedNode : ""} ${isCurrent ? styles.currentNode : ""} ${isReturning ? styles.returningNode : ""} ${isChecked ? styles.checkedNode : ""}`}
                    key={node}
                    transform={`translate(${position.x} ${position.y})`}
                  >
                    <circle r="28" />
                    <text>{node}</text>
                    {isCurrent ? <text className={styles.nodeStatus} y="49">{state.kind === "return" ? "돌아온 곳" : "현재"}</text> : null}
                    {isReturning ? <text className={styles.nodeStatus} y="49">끝</text> : null}
                    {isChecked ? <text className={styles.nodeStatus} y="49">방문함</text> : null}
                  </g>
                );
              })}
            </svg>
            <div className={styles.legend} aria-label="그래프 범례">
              <span><i className={styles.legendCycle} />사이클</span>
              <span><i className={styles.legendCurrent} />현재 노드</span>
              <span><i className={styles.legendVisited} />방문 완료</span>
              {state.edge ? (
                <span>
                  <i className={state.kind === "return" ? styles.legendReturn : state.kind === "skip" ? styles.legendSkip : styles.legendForward} />
                  {state.edge[0]} → {state.edge[1]} · {KIND_LABELS[state.kind]}
                </span>
              ) : null}
            </div>
          </div>

          <aside className={styles.inspector} aria-label="DFS 단계 상태">
            <section className={styles.actionPanel} aria-live="polite" aria-atomic="true">
              <span>{KIND_LABELS[state.kind]} · {MODE_LABELS[mode]}</span>
              <h3>{state.message}</h3>
              <p><strong>다음 행동</strong>{state.nextAction}</p>
            </section>

            <section className={styles.visitPanel}>
              <div className={styles.panelLabel}>
                <span>VISIT ORDER</span>
                <p>{state.visited.length} / 7</p>
              </div>
              {state.visited.length > 0 ? (
                <ol className={styles.visitOrder} aria-label={`방문 순서: ${state.visited.join(", ")}`}>
                  {state.visited.map((node, index) => <li key={node}><span>{index + 1}</span>{node}</li>)}
                </ol>
              ) : <p className={styles.emptyState}>한 단계를 누르면 A부터 시작합니다.</p>}
            </section>

            <section className={styles.stackPanel}>
              <div className={styles.panelLabel}>
                <span>{mode === "recursive" ? "CALL STACK" : "MANUAL FRAME STACK"}</span>
                <p>맨 위부터 표시</p>
              </div>
              {visibleStack.length > 0 ? (
                <ol className={styles.stackFrames}>
                  {visibleStack.map((frame, index) => (
                    <li className={index === 0 ? styles.topFrame : undefined} key={frame.node}>
                      <span>{index === 0 ? "TOP" : String(index + 1).padStart(2, "0")}</span>
                      <strong>{mode === "recursive" ? `dfs(${frame.node})` : `{ ${frame.node} · next ${frame.nextNeighbor} }`}</strong>
                      <small>
                        확인 {frame.nextNeighbor} / {NEIGHBORS[order][frame.node].length}
                      </small>
                    </li>
                  ))}
                </ol>
              ) : <p className={styles.emptyState}>스택이 비어 있습니다.</p>}
            </section>
          </aside>
        </div>

        <div className={styles.orderResult}>
          <p><span>왼쪽 먼저</span><strong>A → B → D → E → F → C → G</strong></p>
          <p><span>오른쪽 먼저</span><strong>A → C → G → F → E → B → D</strong></p>
          <p>순서는 달라도 두 경우 모두 <strong>{"{A, B, C, D, E, F, G}"}</strong>를 방문합니다. DFS는 최단 경로를 보장하지 않으며, 이웃 배열의 순서가 먼저 발견하는 답을 바꿀 수 있습니다.</p>
        </div>
      </div>
    </section>
  );
}
