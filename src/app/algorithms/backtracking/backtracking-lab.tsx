"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./backtracking.module.css";

const BOARD_SIZE = 4;

type Conflict = {
  kind: "column" | "diagonal";
  queenCol: number;
  queenRow: number;
};

type TraceKind = "start" | "consider" | "reject" | "place" | "backtrack" | "solution";

type TraceEvent = {
  action: string;
  backtracks: number;
  board: number[];
  col: number | null;
  conflict: Conflict | null;
  kind: TraceKind;
  nextAction: string;
  phase: string;
  pruned: number;
  row: number;
  solutions: number;
};

type DecisionStatus = "root" | "candidate" | "explored" | "selected" | "pruned" | "backtracked" | "solution";

type DecisionNode = {
  col: number | null;
  depth: number;
  key: string;
  parentKey: string | null;
  status: DecisionStatus;
};

type PositionedDecisionNode = DecisionNode & {
  x: number;
  y: number;
};

function findConflict(board: number[], row: number, col: number): Conflict | null {
  for (let previousRow = 0; previousRow < row; previousRow += 1) {
    const previousCol = board[previousRow];

    if (previousCol === col) {
      return { kind: "column", queenCol: previousCol, queenRow: previousRow };
    }

    if (Math.abs(previousRow - row) === Math.abs(previousCol - col)) {
      return { kind: "diagonal", queenCol: previousCol, queenRow: previousRow };
    }
  }

  return null;
}

function createTrace(): TraceEvent[] {
  const board = Array<number>(BOARD_SIZE).fill(-1);
  const trace: TraceEvent[] = [];
  let pruned = 0;
  let backtracks = 0;
  let solutions = 0;

  function record(event: Omit<TraceEvent, "backtracks" | "board" | "pruned" | "solutions">) {
    trace.push({
      ...event,
      backtracks,
      board: [...board],
      pruned,
      solutions
    });
  }

  record({
    action: "아직 퀸을 놓지 않았습니다. 1행부터 탐색을 시작합니다.",
    col: 0,
    conflict: null,
    kind: "start",
    nextAction: "1행 1열을 첫 후보로 삼고 제약을 검사합니다.",
    phase: "시작",
    row: 0
  });

  function search(row: number): boolean {
    if (row === BOARD_SIZE) {
      solutions += 1;
      record({
        action: "네 행에 퀸을 하나씩 놓았습니다. 모든 제약을 만족하는 첫 번째 해입니다.",
        col: null,
        conflict: null,
        kind: "solution",
        nextAction: "탐색이 끝났습니다. 처음부터를 눌러 같은 선택 순서를 다시 확인할 수 있습니다.",
        phase: "해 발견",
        row
      });
      return true;
    }

    for (let col = 0; col < BOARD_SIZE; col += 1) {
      record({
        action: `${row + 1}행 ${col + 1}열에 퀸을 놓아도 되는지 확인합니다.`,
        col,
        conflict: null,
        kind: "consider",
        nextAction: "이미 놓인 퀸과 같은 열 또는 대각선인지 검사합니다.",
        phase: "제약 검사",
        row
      });

      const conflict = findConflict(board, row, col);

      if (conflict) {
        pruned += 1;
        record({
          action: `${row + 1}행 ${col + 1}열은 ${conflict.queenRow + 1}행 ${conflict.queenCol + 1}열의 퀸과 ${conflict.kind === "column" ? "같은 열" : "같은 대각선"}입니다.`,
          col,
          conflict,
          kind: "reject",
          nextAction: col < BOARD_SIZE - 1
            ? `이 가지를 만들지 않고 ${row + 1}행 ${col + 2}열을 검사합니다.`
            : "이 행에 남은 후보가 없으므로 이전 행으로 되돌아갑니다.",
          phase: "가지치기",
          row
        });
        continue;
      }

      board[row] = col;
      record({
        action: `${row + 1}행 ${col + 1}열은 안전합니다. 이 선택을 경로에 추가합니다.`,
        col,
        conflict: null,
        kind: "place",
        nextAction: row < BOARD_SIZE - 1
          ? `${row + 2}행으로 내려가 1열부터 다시 검사합니다.`
          : "모든 행이 채워졌는지 확인합니다.",
        phase: "선택",
        row
      });

      if (search(row + 1)) return true;

      board[row] = -1;
      backtracks += 1;
      record({
        action: `${row + 1}행 ${col + 1}열 아래에서는 해를 만들 수 없었습니다. 방금 놓은 퀸을 뺍니다.`,
        col,
        conflict: null,
        kind: "backtrack",
        nextAction: col < BOARD_SIZE - 1
          ? `${row + 1}행의 다음 후보인 ${col + 2}열을 검사합니다.`
          : "이 행도 끝났으므로 한 행 더 위로 되돌아갑니다.",
        phase: "되돌림",
        row
      });
    }

    return false;
  }

  search(0);
  return trace;
}

const TRACE = createTrace();
const TREE_WIDTH = 820;

function boardChoices(board: number[], rowLimit = BOARD_SIZE) {
  const choices: number[] = [];

  for (let row = 0; row < Math.min(rowLimit, BOARD_SIZE); row += 1) {
    if (board[row] < 0) break;
    choices.push(board[row]);
  }

  return choices;
}

function choiceKey(choices: number[]) {
  return choices.length === 0 ? "root" : choices.join("-");
}

function decisionStatus(event: TraceEvent): DecisionStatus {
  if (event.kind === "reject") return "pruned";
  if (event.kind === "backtrack") return "backtracked";
  if (event.kind === "place") return "explored";
  return "candidate";
}

function createDecisionTree(step: number, event: TraceEvent) {
  const nodes = new Map<string, DecisionNode>([
    ["root", { col: null, depth: 0, key: "root", parentKey: null, status: "root" }]
  ]);

  for (const traceEvent of TRACE.slice(0, step + 1)) {
    if (traceEvent.col === null || traceEvent.row >= BOARD_SIZE) continue;

    const parentChoices = boardChoices(traceEvent.board, traceEvent.row);
    const choices = [...parentChoices, traceEvent.col];
    const key = choiceKey(choices);

    nodes.set(key, {
      col: traceEvent.col,
      depth: choices.length,
      key,
      parentKey: choiceKey(parentChoices),
      status: decisionStatus(traceEvent)
    });
  }

  const activeChoices = boardChoices(event.board);

  for (let depth = 1; depth <= activeChoices.length; depth += 1) {
    const key = choiceKey(activeChoices.slice(0, depth));
    const node = nodes.get(key);
    if (node) nodes.set(key, { ...node, status: "selected" });
  }

  if (event.kind === "solution") {
    const solutionKey = choiceKey(activeChoices);
    const solutionNode = nodes.get(solutionKey);
    if (solutionNode) nodes.set(solutionKey, { ...solutionNode, status: "solution" });
  }

  const currentChoices = event.col === null
    ? activeChoices
    : [...boardChoices(event.board, event.row), event.col];
  const currentKey = choiceKey(currentChoices);
  const children = new Map<string, DecisionNode[]>();

  for (const node of nodes.values()) {
    if (node.parentKey === null) continue;
    const siblings = children.get(node.parentKey) ?? [];
    siblings.push(node);
    siblings.sort((left, right) => (left.col ?? -1) - (right.col ?? -1));
    children.set(node.parentKey, siblings);
  }

  const rawPositions = new Map<string, number>();
  let leafCount = 0;

  function positionNode(key: string): number {
    const childNodes = children.get(key) ?? [];

    if (childNodes.length === 0) {
      const position = leafCount;
      leafCount += 1;
      rawPositions.set(key, position);
      return position;
    }

    const childPositions = childNodes.map((child) => positionNode(child.key));
    const position = childPositions.reduce((total, childPosition) => total + childPosition, 0) / childPositions.length;
    rawPositions.set(key, position);
    return position;
  }

  positionNode("root");
  const left = 118;
  const right = 792;
  const positionedNodes: PositionedDecisionNode[] = [...nodes.values()].map((node) => {
    const rawPosition = rawPositions.get(node.key) ?? 0;
    const x = leafCount <= 1 ? (left + right) / 2 : left + (rawPosition / (leafCount - 1)) * (right - left);
    return { ...node, x, y: 28 + node.depth * 48 };
  });

  return {
    currentKey,
    currentX: positionedNodes.find((node) => node.key === currentKey)?.x ?? TREE_WIDTH / 2,
    nodes: positionedNodes
  };
}

function locationLabel(row: number, col: number | null) {
  return col === null ? "탐색 완료" : `${row + 1}행 ${col + 1}열`;
}

export function BacktrackingLab() {
  const [step, setStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const treeViewportRef = useRef<HTMLDivElement>(null);
  const event = TRACE[step];
  const isComplete = step === TRACE.length - 1;
  const decisionTree = useMemo(() => createDecisionTree(step, event), [event, step]);

  useEffect(() => {
    if (!isRunning || isComplete) return;

    const timer = window.setTimeout(() => {
      const nextStep = Math.min(step + 1, TRACE.length - 1);
      setStep(nextStep);
      if (nextStep === TRACE.length - 1) setIsRunning(false);
    }, 720);

    return () => window.clearTimeout(timer);
  }, [isComplete, isRunning, step]);

  useEffect(() => {
    const viewportElement = treeViewportRef.current;
    if (!viewportElement) return;

    const centerCurrentNode = () => {
      if (viewportElement.scrollWidth <= viewportElement.clientWidth) return;
      const scaledX = decisionTree.currentX * (viewportElement.scrollWidth / TREE_WIDTH);
      viewportElement.scrollTo({ left: Math.max(0, scaledX - viewportElement.clientWidth / 2), behavior: "auto" });
    };

    centerCurrentNode();
    window.addEventListener("resize", centerCurrentNode);
    return () => window.removeEventListener("resize", centerCurrentNode);
  }, [decisionTree.currentX]);

  const boardDescription = useMemo(() => {
    const queens = event.board
      .map((col, row) => col >= 0 ? `${row + 1}행 ${col + 1}열` : null)
      .filter((location): location is string => location !== null);
    const queenCopy = queens.length > 0 ? `퀸은 ${queens.join(", ")}에 있습니다.` : "놓인 퀸이 없습니다.";
    const candidateCopy = event.col === null ? "탐색을 완료했습니다." : `현재 후보는 ${locationLabel(event.row, event.col)}입니다.`;
    return `${queenCopy} ${candidateCopy}`;
  }, [event]);

  const path = event.board
    .map((col, row) => col >= 0 ? `R${row + 1}→C${col + 1}` : null)
    .filter((choice): choice is string => choice !== null);

  function advance() {
    setIsRunning(false);
    setStep((current) => Math.min(current + 1, TRACE.length - 1));
  }

  function reset() {
    setIsRunning(false);
    setStep(0);
  }

  return (
    <section className={styles.lab} id="try" aria-labelledby="backtracking-lab-title">
      <div className={styles.labInner}>
        <header className={styles.labHeader}>
          <div>
            <p className="eyebrow">TRY · 4×4 N-QUEENS</p>
            <h2 id="backtracking-lab-title">막힌 가지가 사라지는 순간을 따라가세요</h2>
            <p>왼쪽 위부터 후보를 검사하는 실제 깊이 우선 탐색입니다. 한 단계씩 움직이면 선택과 되돌림이 같은 보드 위에서 이어집니다.</p>
          </div>
          <div className={styles.controls} aria-label="탐색 재생 제어">
            <button type="button" onClick={advance} disabled={isComplete}>한 단계</button>
            <button
              className={styles.primaryControl}
              type="button"
              onClick={() => setIsRunning((running) => !running)}
              disabled={isComplete}
              aria-pressed={isRunning}
            >
              {isRunning ? "멈춤" : "자동 실행"}
            </button>
            <button type="button" onClick={reset}>처음부터</button>
          </div>
        </header>

        <div className={styles.progress} aria-label={`전체 ${TRACE.length - 1}단계 중 ${step}단계`}>
          <span style={{ width: `${(step / (TRACE.length - 1)) * 100}%` }} />
        </div>

        <div className={styles.workspace}>
          <div className={styles.treePanel}>
            <div className={styles.treeTopline}>
              <span>EXPLORED DECISION TREE</span>
              <strong>{path.length > 0 ? path.join("  /  ") : "ROOT · 아직 선택 없음"}</strong>
            </div>
            <div className={styles.treeViewport} ref={treeViewportRef}>
              <svg
                className={styles.decisionTree}
                viewBox={`0 0 ${TREE_WIDTH} 252`}
                role="img"
                aria-label={`현재까지 실제로 검사한 결정 트리입니다. ${path.length > 0 ? `현재 선택 경로는 ${path.join(", ")}입니다.` : "아직 선택한 열이 없습니다."} 현재 단계는 ${event.phase}입니다.`}
              >
                <g className={styles.treeLevels} aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((depth) => (
                    <g key={depth}>
                      <path d={`M100 ${28 + depth * 48}H808`} />
                      <text x="10" y={31 + depth * 48}>{depth === 0 ? "ROOT" : `ROW ${depth}`}</text>
                    </g>
                  ))}
                </g>
                <g className={styles.treeEdges} aria-hidden="true">
                  {decisionTree.nodes.map((node) => {
                    if (node.parentKey === null) return null;
                    const parent = decisionTree.nodes.find((candidate) => candidate.key === node.parentKey);
                    if (!parent) return null;
                    return <path className={styles[`treeEdge_${node.status}`]} d={`M${parent.x} ${parent.y}L${node.x} ${node.y}`} key={`${node.key}-edge`} />;
                  })}
                </g>
                <g className={styles.treeNodes}>
                  {decisionTree.nodes.map((node) => (
                    <g
                      className={styles[`treeNode_${node.status}`]}
                      data-current={node.key === decisionTree.currentKey ? "true" : undefined}
                      key={node.key}
                      transform={`translate(${node.x} ${node.y})`}
                    >
                      <circle r={node.status === "root" ? 13 : 11} />
                      <text>{node.status === "root" ? "∅" : `C${(node.col ?? 0) + 1}`}</text>
                      {node.status === "pruned" && <text className={styles.treeNodeState} x="10" y="-10">×</text>}
                      {node.status === "backtracked" && <text className={styles.treeNodeState} x="11" y="-9">↶</text>}
                      {node.status === "solution" && <text className={styles.treeNodeState} x="11" y="-9">✓</text>}
                    </g>
                  ))}
                </g>
              </svg>
            </div>
            <div className={styles.treeLegend} aria-label="결정 트리 범례">
              <span><i className={styles.legendCandidate} />검사 중</span>
              <span><i className={styles.legendQueen} />현재 경로</span>
              <span><i className={styles.legendRejected} />잘린 후보</span>
              <span><i className={styles.legendReturned} />되돌린 선택</span>
            </div>
          </div>

          <div className={styles.boardPanel}>
            <div className={styles.boardTopline}>
              <span>BOARD / STATE {String(step).padStart(2, "0")}</span>
              <strong>{event.phase}</strong>
            </div>

            <div className={styles.boardFrame}>
              <span aria-hidden="true" />
              <div className={styles.columnLabels} aria-hidden="true">
                {Array.from({ length: BOARD_SIZE }, (_, col) => <span key={col}>C{col + 1}</span>)}
              </div>
              <div className={styles.rowLabels} aria-hidden="true">
                {Array.from({ length: BOARD_SIZE }, (_, row) => <span key={row}>R{row + 1}</span>)}
              </div>
              <div className={styles.board} role="img" aria-label={boardDescription}>
                {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => {
                  const row = Math.floor(index / BOARD_SIZE);
                  const col = index % BOARD_SIZE;
                  const isQueen = event.board[row] === col;
                  const isCandidate = event.row === row && event.col === col;
                  const isConflictSource = event.conflict?.queenRow === row && event.conflict.queenCol === col;
                  const cellClasses = [
                    styles.cell,
                    isQueen ? styles.queen : "",
                    isCandidate ? styles.candidate : "",
                    event.kind === "reject" && isCandidate ? styles.rejected : "",
                    event.kind === "backtrack" && isCandidate ? styles.returned : "",
                    isConflictSource ? styles.conflictSource : ""
                  ].filter(Boolean).join(" ");

                  let symbol = "";
                  if (isQueen) symbol = "♛";
                  else if (isCandidate && event.kind === "reject") symbol = "×";
                  else if (isCandidate && event.kind === "backtrack") symbol = "↶";
                  else if (isCandidate) symbol = "?";

                  return <span className={cellClasses} key={`${row}-${col}`} aria-hidden="true">{symbol}</span>;
                })}
              </div>
            </div>

            <div className={styles.legend} aria-label="보드 범례">
              <span><i className={styles.legendQueen} />선택한 퀸</span>
              <span><i className={styles.legendCandidate} />검사 후보</span>
              <span><i className={styles.legendRejected} />충돌 · 가지치기</span>
              <span><i className={styles.legendReturned} />되돌림</span>
            </div>
          </div>

          <aside className={styles.inspector} aria-label="현재 탐색 상태">
            <div className={styles.currentAction} aria-live="polite" aria-atomic="true">
              <span>현재 · {locationLabel(event.row, event.col)}</span>
              <h3>{event.action}</h3>
              <p><strong>다음 행동</strong>{event.nextAction}</p>
            </div>

            <dl className={styles.metrics}>
              <div><dt>가지치기</dt><dd>{event.pruned}</dd></div>
              <div><dt>되돌림</dt><dd>{event.backtracks}</dd></div>
              <div><dt>찾은 해</dt><dd>{event.solutions}</dd></div>
            </dl>

            <div className={styles.constraint}>
              <span>CONSTRAINT CHECK</span>
              {event.conflict ? (
                <p className={styles.conflictText}>
                  <strong>{event.conflict.kind === "column" ? "같은 열" : "같은 대각선"}</strong>
                  R{event.conflict.queenRow + 1} C{event.conflict.queenCol + 1}의 퀸과 충돌합니다.
                </p>
              ) : (
                <p>
                  <strong>{event.kind === "consider" ? "검사 중" : event.kind === "place" || event.kind === "solution" ? "통과" : "충돌 없음"}</strong>
                  {event.kind === "consider" ? "열과 두 대각선을 차례로 확인합니다." : "현재 단계에서 잘린 가지가 없습니다."}
                </p>
              )}
            </div>

          </aside>
        </div>
      </div>
    </section>
  );
}
