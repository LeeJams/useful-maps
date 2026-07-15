"use client";

import { useEffect, useState } from "react";
import styles from "./bfs.module.css";

const NODES = ["A", "B", "C", "D", "E", "F", "G"] as const;
type NodeId = (typeof NODES)[number];

const GRAPH: Record<NodeId, readonly NodeId[]> = {
  A: ["B", "C"],
  B: ["A", "D", "E"],
  C: ["A", "F"],
  D: ["B"],
  E: ["B", "G"],
  F: ["C", "G"],
  G: ["E", "F"]
};

const EDGES: readonly [NodeId, NodeId][] = [
  ["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"],
  ["C", "F"], ["E", "G"], ["F", "G"]
];

const POSITIONS: Record<NodeId, { x: number; y: number }> = {
  A: { x: 350, y: 72 },
  B: { x: 205, y: 178 },
  C: { x: 495, y: 178 },
  D: { x: 90, y: 330 },
  E: { x: 275, y: 330 },
  F: { x: 430, y: 330 },
  G: { x: 610, y: 330 }
};

type BfsState = {
  current: NodeId | null;
  queue: NodeId[];
  discovered: NodeId[];
  distance: Partial<Record<NodeId, number>>;
  action: string;
  step: number;
};

function initialState(start: NodeId): BfsState {
  return {
    current: null,
    queue: [start],
    discovered: [start],
    distance: { [start]: 0 },
    action: `${start}를 발견 즉시 방문 처리하고 큐에 넣었습니다.`,
    step: 0
  };
}

function advance(state: BfsState): BfsState {
  const [current, ...remaining] = state.queue;
  if (!current) return state;

  const discovered = new Set(state.discovered);
  const nextDistance = { ...state.distance };
  const added: NodeId[] = [];
  const distance = state.distance[current] ?? 0;

  for (const neighbor of GRAPH[current]) {
    if (discovered.has(neighbor)) continue;
    discovered.add(neighbor);
    nextDistance[neighbor] = distance + 1;
    added.push(neighbor);
  }

  return {
    current,
    queue: [...remaining, ...added],
    discovered: [...state.discovered, ...added],
    distance: nextDistance,
    action: added.length > 0
      ? `${current}를 꺼내 ${added.join(", ")}를 발견했습니다. 거리 ${distance + 1}로 표시하고 큐 뒤에 넣었습니다.`
      : `${current}를 꺼냈습니다. 모든 이웃이 이미 발견되어 큐에 새로 넣은 노드가 없습니다.`,
    step: state.step + 1
  };
}

export function BfsLab() {
  const [start, setStart] = useState<NodeId>("A");
  const [state, setState] = useState<BfsState>(() => initialState("A"));
  const [isRunning, setIsRunning] = useState(false);
  const isComplete = state.queue.length === 0;

  useEffect(() => {
    if (!isRunning) return;

    const timer = window.setTimeout(() => {
      if (state.queue.length === 0) {
        setIsRunning(false);
        return;
      }
      setState((currentState) => advance(currentState));
    }, state.queue.length === 0 ? 0 : 850);

    return () => window.clearTimeout(timer);
  }, [isRunning, state.queue.length, state.step]);

  function chooseStart(node: NodeId) {
    setIsRunning(false);
    setStart(node);
    setState(initialState(node));
  }

  function reset() {
    setIsRunning(false);
    setState(initialState(start));
  }

  function toggleAuto() {
    if (isRunning) {
      setIsRunning(false);
      return;
    }

    if (isComplete) setState(initialState(start));
    setIsRunning(true);
  }

  const nextAction = isComplete
    ? "큐가 비었습니다. 시작점과 연결된 모든 노드의 최소 간선 수를 찾았습니다."
    : `다음에는 큐 맨 앞 ${state.queue[0]}를 꺼내 미방문 이웃을 확인합니다.`;

  return (
    <section className={styles.lab} aria-labelledby="bfs-lab-title">
      <div className="content-wrap">
        <header className={styles.labHeader}>
          <div>
            <p className="eyebrow">TRY · INTERACTIVE LAB</p>
            <h2 id="bfs-lab-title">큐를 한 칸씩 움직여 보세요</h2>
            <p>시작점을 바꿔도 규칙은 같습니다. 발견한 순간 방문 처리되는 노드, 큐의 앞, 거리표를 함께 확인하세요.</p>
          </div>
          <div className={styles.controls} aria-label="BFS 실행 제어">
            <button type="button" onClick={() => setState((currentState) => advance(currentState))} disabled={isRunning || isComplete}>한 단계</button>
            <button type="button" className={styles.primaryControl} onClick={toggleAuto}>
              {isRunning ? "멈춤" : isComplete ? "다시 자동 실행" : "자동 실행"}
            </button>
            <button type="button" onClick={reset}>처음부터</button>
          </div>
        </header>

        <div className={styles.startPicker} role="group" aria-label="시작 노드 선택">
          <span>시작점</span>
          {NODES.map((node) => (
            <button
              type="button"
              aria-pressed={node === start}
              className={node === start ? styles.selectedStart : undefined}
              key={node}
              onClick={() => chooseStart(node)}
            >
              {node}
            </button>
          ))}
        </div>

        <div className={styles.workspace}>
          <div className={styles.graphPanel}>
            <div className={styles.graphScroller} tabIndex={0} aria-label="BFS 그래프 도식, 작은 화면에서는 가로로 스크롤할 수 있습니다">
              <svg className={styles.graph} viewBox="0 0 700 420" role="img" aria-labelledby="bfs-graph-title bfs-graph-desc">
                <title id="bfs-graph-title">현재 BFS 탐색 상태</title>
                <desc id="bfs-graph-desc">시작점 {start}, 현재 노드 {state.current ?? "없음"}, 방문 순서 {state.discovered.join(", ")}, 큐 {state.queue.join(", ") || "비어 있음"}</desc>
                <g className={styles.edges}>
                  {EDGES.map(([from, to]) => {
                    const active = state.discovered.includes(from) && state.discovered.includes(to);
                    return (
                      <line
                        className={active ? styles.activeEdge : undefined}
                        key={`${from}-${to}`}
                        x1={POSITIONS[from].x}
                        y1={POSITIONS[from].y}
                        x2={POSITIONS[to].x}
                        y2={POSITIONS[to].y}
                      />
                    );
                  })}
                </g>
                {NODES.map((node) => {
                  const status = state.current === node
                    ? styles.currentNode
                    : state.queue.includes(node)
                      ? styles.queuedNode
                      : state.discovered.includes(node)
                        ? styles.visitedNode
                        : styles.idleNode;
                  return (
                    <g className={`${styles.graphNode} ${status}`} key={node} transform={`translate(${POSITIONS[node].x} ${POSITIONS[node].y})`}>
                      <circle r="34" />
                      <text>{node}</text>
                      <text className={styles.nodeDistance} y="55">
                        {state.distance[node] === undefined ? "미발견" : `거리 ${state.distance[node]}`}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className={styles.legend} aria-label="그래프 범례">
              <span><i className={styles.legendCurrent} />현재</span>
              <span><i className={styles.legendQueue} />큐 대기</span>
              <span><i className={styles.legendVisited} />처리 완료</span>
              <span><i className={styles.legendIdle} />미발견</span>
            </div>
          </div>

          <aside className={styles.inspector} aria-label="BFS 상태 검사기">
            <div className={styles.currentStatus}>
              <span>STEP {String(state.step).padStart(2, "0")}</span>
              <p>현재 노드</p>
              <strong>{state.current ?? "—"}</strong>
              <small>{state.current ? "가장 최근 큐에서 꺼낸 노드" : "아직 큐에서 꺼내지 않았습니다"}</small>
            </div>

            <div className={styles.queueView}>
              <header><h3>Queue</h3><span>FIFO</span></header>
              {state.queue.length > 0 ? (
                <ol>
                  {state.queue.map((node, index) => (
                    <li key={node}>
                      {index === 0 ? <small>FRONT</small> : null}
                      <strong>{node}</strong>
                    </li>
                  ))}
                </ol>
              ) : <p>비어 있음</p>}
            </div>

            <div className={styles.orderView}>
              <h3>방문 순서 <small>발견 = enqueue</small></h3>
              <ol>
                {state.discovered.map((node, index) => <li key={node}><span>{index + 1}</span>{node}</li>)}
              </ol>
            </div>
          </aside>
        </div>

        <div className={styles.distancePanel}>
          <div>
            <p>거리표</p>
            <span>시작점부터 지나온 최소 간선 수</span>
          </div>
          <div className={styles.tableScroller}>
            <table>
              <thead><tr>{NODES.map((node) => <th key={node} scope="col">{node}</th>)}</tr></thead>
              <tbody><tr>{NODES.map((node) => <td key={node}>{state.distance[node] ?? "—"}</td>)}</tr></tbody>
            </table>
          </div>
        </div>

        <div className={styles.actionStatus} aria-live="polite" aria-atomic="true">
          <span>방금 한 일</span>
          <p>{state.action}</p>
          <strong>{nextAction}</strong>
        </div>
      </div>
    </section>
  );
}
