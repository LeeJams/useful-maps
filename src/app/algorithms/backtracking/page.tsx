import type { Metadata } from "next";
import { AlgorithmCodeTabs, type AlgorithmCodeExample } from "@/components/algorithm-code-tabs";
import { GuideHero } from "@/components/guide-hero";
import { getGuide } from "@/content/guides";
import { BacktrackingLab } from "./backtracking-lab";
import styles from "./backtracking.module.css";

const guide = getGuide("backtracking");

export const metadata: Metadata = {
  title: "백트래킹, 막힌 선택을 되돌리기",
  description: "4×4 N-Queens의 실제 탐색을 한 단계씩 따라가며 선택, 제약 검사, 가지치기, 되돌림을 이해합니다."
};

function BacktrackingHeroVisual() {
  return (
    <svg
      className={styles.heroMap}
      viewBox="0 0 640 640"
      role="img"
      aria-labelledby="backtracking-hero-title backtracking-hero-description"
    >
      <title id="backtracking-hero-title">선택한 가지와 잘라 낸 가지가 표시된 N-Queens 탐색 지도</title>
      <desc id="backtracking-hero-description">첫 번째 행에서 열을 선택하고 다음 행으로 내려가며, 충돌하는 후보를 잘라 낸 뒤 이전 선택으로 되돌아오는 과정을 보여 줍니다.</desc>

      <text className={styles.heroLabel} x="58" y="74">SEARCH TREE / 4×4</text>
      <path className={styles.heroAxis} d="M58 94H582" />

      <g className={styles.heroTree}>
        <path d="M320 142 178 246M320 142l142 104M178 246l-76 116M178 246l82 116M462 246l-80 116M462 246l76 116" />
        <path className={styles.heroSelectedPath} d="M320 142 178 246l82 116 78 110" />
        <g transform="translate(320 142)"><circle r="18" /><text>R1</text></g>
        <g className={styles.heroSelectedNode} transform="translate(178 246)"><circle r="18" /><text>C2</text></g>
        <g className={styles.heroPrunedNode} transform="translate(102 362)"><circle r="18" /><text>×</text></g>
        <g className={styles.heroSelectedNode} transform="translate(260 362)"><circle r="18" /><text>C4</text></g>
        <g className={styles.heroMutedNode} transform="translate(462 246)"><circle r="18" /><text>C3</text></g>
        <g className={styles.heroPrunedNode} transform="translate(382 362)"><circle r="18" /><text>×</text></g>
        <g className={styles.heroMutedNode} transform="translate(538 362)"><circle r="18" /><text>…</text></g>
        <g className={styles.heroSolutionNode} transform="translate(338 472)"><circle r="22" /><text>✓</text></g>
      </g>

      <g className={styles.heroBoard} transform="translate(418 430)">
        <rect width="144" height="144" />
        {[36, 72, 108].map((position) => (
          <g key={position}>
            <path d={`M${position} 0v144`} />
            <path d={`M0 ${position}h144`} />
          </g>
        ))}
        {[[54, 18], [126, 54], [18, 90], [90, 126]].map(([x, y], index) => (
          <g className={styles.heroQueen} key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
            <circle r="12" />
            <text>{index + 1}</text>
          </g>
        ))}
      </g>
      <path className={styles.heroReturn} d="M331 499c-30 54-89 60-120 21" />
      <text className={styles.heroReturnLabel} x="150" y="530">BACKTRACK</text>
      <text className={styles.heroFootnote} x="58" y="594">CHOOSE → CHECK → DESCEND → UNDO</text>
    </svg>
  );
}

const processSteps = [
  {
    number: "01",
    label: "CHOOSE",
    title: "후보 하나를 선택합니다",
    description: "현재 행에서 아직 확인하지 않은 열 하나를 고릅니다. 선택 경로에는 각 행에서 고른 열만 남습니다."
  },
  {
    number: "02",
    label: "CHECK",
    title: "부분 답이 가능한지 검사합니다",
    description: "앞서 놓은 퀸과 같은 열 또는 대각선이면, 그 아래를 더 보지 않고 즉시 잘라 냅니다."
  },
  {
    number: "03",
    label: "DESCEND",
    title: "안전하면 다음 선택으로 갑니다",
    description: "이번 선택을 보드에 남기고 다음 행으로 내려갑니다. 같은 네 단계를 더 작은 문제에 반복합니다."
  },
  {
    number: "04",
    label: "UNDO",
    title: "막히면 마지막 선택을 되돌립니다",
    description: "아래에서 해를 만들 수 없다면 퀸을 빼고, 이전 행의 다음 열을 확인합니다. 이것이 백트래킹입니다."
  }
];

const codeExamples: AlgorithmCodeExample[] = [
  {
    language: "Node.js",
    fileName: "n-queens.js",
    code: `function solveNQueens(n) {
  const board = Array(n).fill(-1);
  const columns = new Set();
  const downDiagonals = new Set(); // row - col
  const upDiagonals = new Set();   // row + col
  const solutions = [];

  function search(row) {
    if (row === n) {
      solutions.push(board.map((queenCol) =>
        ".".repeat(queenCol) + "Q" + ".".repeat(n - queenCol - 1)
      ));
      return;
    }

    for (let col = 0; col < n; col += 1) {
      const down = row - col;
      const up = row + col;
      if (columns.has(col) || downDiagonals.has(down) || upDiagonals.has(up)) {
        continue; // 불가능한 가지를 여기서 자른다.
      }

      board[row] = col;
      columns.add(col);
      downDiagonals.add(down);
      upDiagonals.add(up);

      search(row + 1);

      board[row] = -1; // 다음 후보를 위해 선택을 되돌린다.
      columns.delete(col);
      downDiagonals.delete(down);
      upDiagonals.delete(up);
    }
  }

  search(0);
  return solutions;
}

const n = Number(process.argv[2] ?? 4);
const solutions = solveNQueens(n);
console.log("solutions: " + solutions.length);
console.log(solutions[0]?.join("\\n") ?? "no solution");`
  },
  {
    language: "Java",
    fileName: "NQueens.java",
    code: `import java.util.Arrays;

public class NQueens {
  private final int n;
  private final int[] board;
  private final boolean[] columns;
  private final boolean[] downDiagonals;
  private final boolean[] upDiagonals;
  private int solutionCount = 0;
  private int[] firstSolution;

  private NQueens(int n) {
    this.n = n;
    this.board = new int[n];
    Arrays.fill(board, -1);
    this.columns = new boolean[n];
    this.downDiagonals = new boolean[2 * n - 1];
    this.upDiagonals = new boolean[2 * n - 1];
  }

  private void search(int row) {
    if (row == n) {
      solutionCount++;
      if (firstSolution == null) firstSolution = board.clone();
      return;
    }

    for (int col = 0; col < n; col++) {
      int down = row - col + n - 1;
      int up = row + col;
      if (columns[col] || downDiagonals[down] || upDiagonals[up]) continue;

      board[row] = col;
      columns[col] = downDiagonals[down] = upDiagonals[up] = true;
      search(row + 1);
      board[row] = -1;
      columns[col] = downDiagonals[down] = upDiagonals[up] = false;
    }
  }

  public static void main(String[] args) {
    int n = args.length > 0 ? Integer.parseInt(args[0]) : 4;
    NQueens solver = new NQueens(n);
    solver.search(0);
    System.out.println("solutions: " + solver.solutionCount);

    if (solver.firstSolution != null) {
      for (int col : solver.firstSolution) {
        System.out.println(".".repeat(col) + "Q" + ".".repeat(n - col - 1));
      }
    }
  }
}`
  },
  {
    language: "Python",
    fileName: "n_queens.py",
    code: `import sys


def solve_n_queens(n):
    board = [-1] * n
    columns = set()
    down_diagonals = set()  # row - col
    up_diagonals = set()    # row + col
    solutions = []

    def search(row):
        if row == n:
            solutions.append([
                "." * col + "Q" + "." * (n - col - 1)
                for col in board
            ])
            return

        for col in range(n):
            down = row - col
            up = row + col
            if col in columns or down in down_diagonals or up in up_diagonals:
                continue  # 불가능한 가지를 여기서 자른다.

            board[row] = col
            columns.add(col)
            down_diagonals.add(down)
            up_diagonals.add(up)

            search(row + 1)

            board[row] = -1  # 다음 후보를 위해 선택을 되돌린다.
            columns.remove(col)
            down_diagonals.remove(down)
            up_diagonals.remove(up)

    search(0)
    return solutions


n = int(sys.argv[1]) if len(sys.argv) > 1 else 4
answers = solve_n_queens(n)
print(f"solutions: {len(answers)}")
print("\\n".join(answers[0]) if answers else "no solution")`
  }
];

export default function BacktrackingGuidePage() {
  return (
    <main>
      <GuideHero
        guide={guide}
        title="좋은 선택만 남기고, 막힌 길은 되돌아옵니다"
        lead="백트래킹은 정답 후보를 하나씩 만들되, 부분 답이 이미 틀렸다면 그 아래 조합을 전부 건너뜁니다. 4×4 N-Queens에서 선택 → 검사 → 다음 선택 → 되돌리기를 한 단계씩 따라가세요."
      >
        <BacktrackingHeroVisual />
      </GuideHero>

      <section className={`content-wrap ${styles.why}`} aria-labelledby="backtracking-why-title">
        <div className={styles.sectionMarker}>
          <p className="eyebrow">WHY</p>
          <span>01 / 이유</span>
        </div>
        <div className={styles.whyLead}>
          <h2 id="backtracking-why-title">모든 완성본을 만든 뒤 검사하기에는, 틀린 선택이 너무 빨리 보입니다</h2>
          <p>N-Queens에서 같은 열에 퀸 두 개가 놓인 순간, 남은 행을 어떻게 채워도 그 조합은 정답이 아닙니다. 백트래킹은 이 사실을 이용해 만들 필요 없는 완성본을 건너뜁니다.</p>
        </div>
        <div className={styles.whyProof}>
          <article>
            <span>무작정 열거</span>
            <strong>끝까지 만든 뒤 실패를 압니다</strong>
            <p>부분 답이 이미 제약을 어겼어도 나머지 선택을 계속 붙입니다.</p>
          </article>
          <article>
            <span>백트래킹</span>
            <strong>실패가 확정된 순간 멈춥니다</strong>
            <p>같은 열이나 대각선 충돌을 발견하면 그 아래 가지 전체를 탐색하지 않습니다.</p>
          </article>
        </div>
      </section>

      <section className={`content-wrap ${styles.how}`} aria-labelledby="backtracking-how-title">
        <header className={styles.sectionHeading}>
          <p className="eyebrow">HOW</p>
          <div>
            <h2 id="backtracking-how-title">답을 만드는 네 동작은 항상 같은 순서입니다</h2>
            <p>재귀 호출은 “다음 선택으로 내려가기”를, 호출이 끝난 뒤 상태를 복구하는 코드는 “되돌아오기”를 담당합니다.</p>
          </div>
        </header>
        <ol className={styles.process}>
          {processSteps.map((step) => (
            <li key={step.number}>
              <span>{step.number} / {step.label}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
        <aside className={styles.howRule}>
          <span>핵심 질문</span>
          <p><strong>“이 부분 답에 무엇을 더 붙여도 정답이 될 수 없는가?”</strong>를 빠르게 판별할 수 있을 때 가지치기가 힘을 발휘합니다.</p>
        </aside>
      </section>

      <BacktrackingLab />

      <section className={`content-wrap ${styles.apply}`} id="apply" aria-labelledby="backtracking-apply-title">
        <header className={styles.sectionHeading}>
          <p className="eyebrow">APPLY</p>
          <div>
            <h2 id="backtracking-apply-title">선택, 검사, 복구를 코드에서도 같은 자리에 둡니다</h2>
            <p>세 예제는 모든 해를 찾습니다. 실행할 때 파일명 뒤의 <code>4</code>를 원하는 N으로 바꾸세요.</p>
          </div>
        </header>

        <div className={styles.fitGuide}>
          <article>
            <span>01 / 상태</span>
            <h3>부분 답을 작게 유지합니다</h3>
            <p>행마다 고른 열과 사용 중인 열·대각선만 저장하면 충돌을 즉시 확인할 수 있습니다.</p>
          </article>
          <article>
            <span>02 / 제약</span>
            <h3>내려가기 전에 검사합니다</h3>
            <p>스도쿠, 순열, 조합, 경로 찾기처럼 부분 답의 유효성을 일찍 판별할 수 있는 문제에 잘 맞습니다.</p>
          </article>
          <article>
            <span>03 / 복구</span>
            <h3>추가한 상태만 정확히 되돌립니다</h3>
            <p>재귀 호출 뒤에 보드, 열, 두 대각선을 모두 원래대로 돌려야 다음 후보가 깨끗한 조건에서 시작합니다.</p>
          </article>
        </div>

        <AlgorithmCodeTabs examples={codeExamples} label="N-Queens 백트래킹 언어별 실행 예제" />

        <div className={styles.runCommands} aria-label="언어별 실행 명령">
          <span>RUN</span>
          <code>node n-queens.js 4</code>
          <code>javac NQueens.java &amp;&amp; java NQueens 4</code>
          <code>python3 n_queens.py 4</code>
        </div>

        <div className={styles.complexity}>
          <div>
            <span>시간</span>
            <strong>단순화한 상한 O(N!)</strong>
            <p>행마다 이미 사용한 열을 제외하면 가능한 열 순서는 최대 N!개입니다. 대각선 가지치기로 실제 방문 수는 줄지만, 입력 크기와 후보 순서에 따라 달라지므로 O(N!)을 정확한 실행량처럼 보아서는 안 됩니다.</p>
          </div>
          <div>
            <span>공간</span>
            <strong>O(N)</strong>
            <p>현재 보드의 열 선택, 사용 중인 열·대각선, 재귀 깊이가 N에 비례합니다. 모든 해를 배열에 보관한다면 결과를 저장하는 공간은 별도로 더해집니다.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
