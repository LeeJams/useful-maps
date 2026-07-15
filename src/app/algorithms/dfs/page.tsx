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

function DfsHeroVisual() {
  const nodes = [
    { id: "A", x: 310, y: 80, depth: "0" },
    { id: "B", x: 190, y: 190, depth: "1" },
    { id: "C", x: 430, y: 190, depth: "5" },
    { id: "D", x: 100, y: 310, depth: "2" },
    { id: "E", x: 250, y: 310, depth: "3" },
    { id: "F", x: 370, y: 310, depth: "4" },
    { id: "G", x: 520, y: 310, depth: "6" }
  ];

  return (
    <svg
      aria-labelledby="dfs-hero-title dfs-hero-description"
      className={styles.heroMap}
      role="img"
      viewBox="0 0 620 460"
    >
      <title id="dfs-hero-title">A에서 한 갈래를 끝까지 따라가는 DFS 경로</title>
      <desc id="dfs-hero-description">A, B, D를 방문한 뒤 B로 되돌아와 E, F, C, G 순서로 깊이 탐색합니다.</desc>
      <path className={styles.heroEdge} d="M310 80 190 190 100 310M190 190 250 310 370 310 430 190 310 80M430 190 520 310" />
      <path className={styles.heroRoute} d="M310 80 190 190 100 310 190 190 250 310 370 310 430 190 520 310" />
      {nodes.map((node) => (
        <g className={styles.heroNode} key={node.id} transform={`translate(${node.x} ${node.y})`}>
          <circle r="25" />
          <text>{node.id}</text>
          <text className={styles.heroDepth} y="44">STEP {node.depth}</text>
        </g>
      ))}
      <g className={styles.heroReturn} transform="translate(145 252)">
        <path d="M25 8H0l8-8M0 8l8 8" />
        <text x="34" y="12">RETURN</text>
      </g>
      <text className={styles.heroCaption} x="72" y="404">GO DEEP · HIT A DEAD END · RETURN</text>
    </svg>
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
          <p>재귀 호출도 직접 만든 배열도 마지막에 들어간 항목을 먼저 꺼내는 LIFO 스택입니다. 저장 위치만 다르고 “깊게 들어간 뒤 되돌아오는” 규칙은 같습니다.</p>
        </div>

        <ol className={styles.howSteps}>
          <li>
            <span>01</span>
            <div><strong>방문 표시</strong><p>노드 A를 방문 집합에 넣습니다. 다시 만난 A는 건너뛰어 사이클을 무한히 돌지 않습니다.</p></div>
          </li>
          <li>
            <span>02</span>
            <div><strong>한 이웃으로 진입</strong><p>이웃 목록의 첫 노드 B를 고르고 새 프레임을 쌓습니다. B에서도 같은 일을 반복합니다.</p></div>
          </li>
          <li>
            <span>03</span>
            <div><strong>막다른 곳에서 복귀</strong><p>D에 새 이웃이 없으면 D 프레임을 제거합니다. 이제 스택 맨 위 B의 다음 이웃 E를 확인합니다.</p></div>
          </li>
        </ol>

        <div className={styles.stackComparison}>
          <article>
            <span>RECURSIVE</span>
            <h3>재귀 호출</h3>
            <p>함수를 호출할 때 런타임이 <code>dfs(A) → dfs(B) → dfs(D)</code> 프레임을 대신 쌓습니다. 코드는 짧지만 깊이가 너무 크면 호출 스택 한도를 넘을 수 있습니다.</p>
          </article>
          <article>
            <span>ITERATIVE</span>
            <h3>명시적 스택</h3>
            <p>코드가 직접 <code>[A, B, D]</code>와 다음 이웃 위치를 관리합니다. 일시 정지나 매우 깊은 탐색을 제어하기 쉽지만 프레임 관리 코드가 더 필요합니다.</p>
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
