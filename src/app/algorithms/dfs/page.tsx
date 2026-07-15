import type { Metadata } from "next";
import { AlgorithmCodeTabs, type AlgorithmCodeExample } from "@/components/algorithm-code-tabs";
import { GuideHero } from "@/components/guide-hero";
import { getGuide } from "@/content/guides";
import { DfsLab } from "./dfs-lab";
import styles from "./dfs.module.css";

const guide = getGuide("dfs");

export const metadata: Metadata = {
  title: "DFS, 한 갈래를 끝까지 탐색하기",
  description: "깊이 우선 탐색이 한 갈래를 끝까지 따라간 뒤 스택을 통해 되돌아오는 과정을 재귀 호출과 명시적 스택으로 비교합니다."
};

const codeExamples: AlgorithmCodeExample[] = [
  {
    language: "Node.js",
    fileName: "dfs.js",
    code: `const graph = {
  A: ["B", "C"],
  B: ["D", "E", "A"],
  C: ["G", "A", "F"],
  D: ["B"],
  E: ["F", "B"],
  F: ["C", "E"],
  G: ["C"],
};

function dfs(node, visited = new Set()) {
  visited.add(node);

  for (const neighbor of graph[node]) {
    if (!visited.has(neighbor)) {
      dfs(neighbor, visited);
    }
  }

  return visited;
}

console.log([...dfs("A")].join(" -> "));
// A -> B -> D -> E -> F -> C -> G`
  },
  {
    language: "Java",
    fileName: "Main.java",
    code: `import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class Main {
  static final Map<String, List<String>> GRAPH = Map.of(
      "A", List.of("B", "C"),
      "B", List.of("D", "E", "A"),
      "C", List.of("G", "A", "F"),
      "D", List.of("B"),
      "E", List.of("F", "B"),
      "F", List.of("C", "E"),
      "G", List.of("C")
  );

  static void dfs(String node, Set<String> visited) {
    visited.add(node);

    for (String neighbor : GRAPH.get(node)) {
      if (!visited.contains(neighbor)) {
        dfs(neighbor, visited);
      }
    }
  }

  public static void main(String[] args) {
    Set<String> visited = new LinkedHashSet<>();
    dfs("A", visited);
    System.out.println(String.join(" -> ", visited));
  }
}`
  },
  {
    language: "Python",
    fileName: "dfs.py",
    code: `graph = {
    "A": ["B", "C"],
    "B": ["D", "E", "A"],
    "C": ["G", "A", "F"],
    "D": ["B"],
    "E": ["F", "B"],
    "F": ["C", "E"],
    "G": ["C"],
}

def dfs(node, visited=None):
    if visited is None:
        visited = set()

    visited.add(node)
    print(node, end=" ")

    for neighbor in graph[node]:
        if neighbor not in visited:
            dfs(neighbor, visited)

    return visited

dfs("A")
# A B D E F C G`
  }
];

const VISUAL_NODES = [
  { id: "A", x: 350, y: 64, step: 1 },
  { id: "B", x: 150, y: 150, step: 2 },
  { id: "C", x: 550, y: 150, step: 6 },
  { id: "D", x: 48, y: 300, step: 3 },
  { id: "E", x: 215, y: 318, step: 4 },
  { id: "F", x: 485, y: 318, step: 5 },
  { id: "G", x: 652, y: 300, step: 7 }
] as const;

const VISUAL_EDGES = [
  ["A", "B"],
  ["A", "C"],
  ["B", "D"],
  ["B", "E"],
  ["E", "F"],
  ["F", "C"],
  ["C", "G"]
] as const;

const CYCLE_EDGES = new Set(["A-B", "A-C", "B-E", "E-F", "C-F"]);

function visualPosition(id: string) {
  return VISUAL_NODES.find((node) => node.id === id) ?? VISUAL_NODES[0];
}

function visualEdgeKey(first: string, second: string) {
  return [first, second].sort().join("-");
}

function DfsTopology({ compact = false }: { compact?: boolean }) {
  return (
    <svg
      aria-label="A-B-E-F-C-A 사이클에 D와 G가 연결된 DFS 예제 그래프"
      className={compact ? styles.howGraph : styles.heroMap}
      role="img"
      viewBox="0 0 700 410"
    >
      <title>트리가 아닌 사이클 그래프</title>
      <desc>A-B, A-C, B-D, B-E, E-F, F-C, C-G 간선으로 이루어진 무방향 그래프입니다. A-B-E-F-C-A가 하나의 사이클입니다.</desc>
      {!compact ? (
        <defs>
          <marker id="dfs-hero-return-arrow" markerHeight="7" markerWidth="7" orient="auto" refX="6" refY="3.5">
            <path className={styles.heroArrowHead} d="M0 0 7 3.5 0 7Z" />
          </marker>
        </defs>
      ) : null}
      {VISUAL_EDGES.map(([first, second]) => {
        const start = visualPosition(first);
        const end = visualPosition(second);
        const isCycle = CYCLE_EDGES.has(visualEdgeKey(first, second));
        return (
          <line
            className={isCycle ? styles.topologyCycleEdge : styles.topologyLeafEdge}
            key={`${first}-${second}`}
            x1={start.x}
            x2={end.x}
            y1={start.y}
            y2={end.y}
          />
        );
      })}
      <g className={styles.cycleStamp} transform="translate(350 210)">
        <rect height="42" rx="21" width="188" x="-94" y="-21" />
        <text y="-3">CYCLE</text>
        <text className={styles.cycleStampPath} y="12">A—B—E—F—C—A</text>
      </g>
      {VISUAL_NODES.map((node) => (
        <g className={styles.heroNode} key={node.id} transform={`translate(${node.x} ${node.y})`}>
          <circle r="25" />
          <text>{node.id}</text>
          {!compact ? <text className={styles.heroDepth} y="44">VISIT {node.step}</text> : null}
        </g>
      ))}
      {!compact ? (
        <>
          <g className={styles.heroReturn}>
            <path d="M68 278Q82 210 130 174" markerEnd="url(#dfs-hero-return-arrow)" />
            <text x="76" y="247">RETURN · D → B</text>
          </g>
          <text className={styles.heroCaption} x="350" y="392">GRAPH HAS A CYCLE · VISITED SET PREVENTS REPEAT</text>
        </>
      ) : null}
    </svg>
  );
}

function DfsHeroVisual() {
  return (
    <DfsTopology />
  );
}

export default function DfsGuidePage() {
  return (
    <main className={styles.page}>
      <GuideHero
        guide={guide}
        title="한 갈래를 끝까지 간 뒤, 돌아와 다음 길을 찾습니다"
        lead="DFS는 갈림길에서 한 이웃을 고르고 더 이상 갈 곳이 없을 때까지 깊게 들어갑니다. 막다른 곳에서는 스택의 이전 지점으로 돌아와, 아직 확인하지 않은 다음 갈래를 이어서 탐색합니다."
      >
        <DfsHeroVisual />
      </GuideHero>

      <section className={`${styles.why} why-strip content-wrap`} aria-labelledby="dfs-why">
        <div>
          <p className="eyebrow">WHY · 왜 필요한가요?</p>
          <h2 id="dfs-why">답이 깊은 곳에 있을 때, 한 경로에 집중합니다</h2>
        </div>
        <article>
          <span>01 / 경로</span>
          <h3>지금 걷는 길을 그대로 기억합니다</h3>
          <p>미로의 출구, 파일 폴더의 하위 구조, 게임의 다음 수처럼 “현재 선택의 뒤”를 계속 확인할 때 DFS의 경로가 자연스럽습니다.</p>
        </article>
        <article>
          <span>02 / 복귀</span>
          <h3>막히면 직전 갈림길로 돌아갑니다</h3>
          <p>스택은 아직 확인할 이웃이 남은 지점을 기억합니다. 그래서 한 갈래가 끝나도 처음부터 다시 찾지 않고 바로 이전 선택으로 복귀합니다.</p>
        </article>
      </section>

      <section className={`${styles.how} content-wrap`} aria-labelledby="dfs-how">
        <div className="section-heading">
          <p className="eyebrow">HOW · 어떻게 작동하나요?</p>
          <h2 id="dfs-how">들어간 순서의 반대로 되돌아옵니다</h2>
          <p>이 예제는 트리가 아니라 <code>A—B—E—F—C—A</code> 사이클이 있는 그래프입니다. 재귀 호출과 직접 관리 프레임 모두 방문 집합으로 재방문을 막고, 같은 프레임 규칙으로 깊이와 복귀를 보여 줍니다.</p>
        </div>

        <div className={styles.howBoard}>
          <figure className={styles.howTopology}>
            <div>
              <span>ONE FIXED GRAPH</span>
              <strong>7개 노드 · 7개 간선 · 사이클 1개</strong>
            </div>
            <DfsTopology compact />
            <figcaption>가는 선은 그래프의 관계입니다. DFS가 실제로 새 노드를 발견한 간선만 탐색 트리가 되며, 원래 그래프 자체가 트리로 바뀌는 것은 아닙니다.</figcaption>
          </figure>

          <ol className={styles.howSteps}>
            <li>
              <span>01</span>
              <div><strong>방문 표시</strong><p>A를 방문 집합에 넣습니다. 사이클을 돌아 A를 다시 만나도 방문 집합 덕분에 즉시 건너뜁니다.</p></div>
            </li>
            <li>
              <span>02</span>
              <div><strong>한 이웃으로 진입</strong><p>왼쪽 우선이면 A → B → D로 새 프레임을 쌓습니다. 이때 방문 순서는 A, B, D입니다.</p></div>
            </li>
            <li>
              <span>03</span>
              <div><strong>D에서 B로 복귀</strong><p>D의 유일한 이웃 B는 이미 방문했습니다. D 프레임을 제거하고 B로 돌아와 다음 이웃 E를 봅니다.</p></div>
            </li>
          </ol>
        </div>

        <div className={styles.stackComparison}>
          <article>
            <span>RECURSIVE</span>
            <h3>재귀 호출</h3>
            <p>런타임 호출 스택이 <code>dfs(A) → dfs(B) → dfs(D)</code> 프레임과 각 함수의 다음 이웃 위치를 기억합니다. 코드는 짧지만 깊이가 너무 크면 호출 스택 한도를 넘을 수 있습니다.</p>
          </article>
          <article>
            <span>MANUAL FRAMES</span>
            <h3>직접 관리 스택</h3>
            <p>실험실은 배열에 <code>{`{ node, nextNeighbor }`}</code> 프레임을 저장해 재귀와 같은 복귀를 재현합니다. 노드만 미리 쌓는 흔한 반복 DFS와는 상태 구조와 방문 시점이 다릅니다.</p>
          </article>
        </div>
      </section>

      <DfsLab />

      <section className={`${styles.apply} content-wrap`} aria-labelledby="dfs-apply">
        <div className="section-heading">
          <p className="eyebrow">APPLY · 실전에 적용하기</p>
          <h2 id="dfs-apply">방문 집합과 이웃 순서를 코드에 드러내세요</h2>
          <p>아래 예시는 실험실의 왼쪽 우선 순서와 같은 그래프를 탐색합니다. 각 파일을 그대로 실행하면 <code>A → B → D → E → F → C → G</code>가 출력됩니다.</p>
        </div>

        <div className={styles.complexity} aria-label="DFS 복잡도">
          <div><span>시간</span><strong>O(V + E)</strong><p>각 정점과 간선을 한 번씩 확인합니다.</p></div>
          <div><span>공간</span><strong>O(V)</strong><p>방문 집합과 최악의 경우 V개 프레임을 저장합니다.</p></div>
          <div><span>주의</span><strong>깊이 한도</strong><p>긴 사슬 그래프는 재귀 한도를 넘을 수 있어 명시적 스택이 안전합니다.</p></div>
        </div>

        <AlgorithmCodeTabs examples={codeExamples} label="Node.js, Java, Python DFS 재귀 구현" />

        <aside className={styles.applyNote}>
          <p className="eyebrow">CHOOSING DFS</p>
          <h3>“가장 가까운 답”보다 “한 경로의 끝”이 중요할 때</h3>
          <p>연결 요소, 사이클 탐지, 위상 정렬, 백트래킹의 탐색 뼈대에는 DFS가 잘 맞습니다. 반대로 가중치 없는 그래프의 최단 간선 수가 목적이면 가까운 층부터 보는 BFS가 더 직접적입니다.</p>
        </aside>
      </section>
    </main>
  );
}
