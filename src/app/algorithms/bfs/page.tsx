import type { Metadata } from "next";
import { AlgorithmCodeTabs, type AlgorithmCodeExample } from "@/components/algorithm-code-tabs";
import { GuideHero } from "@/components/guide-hero";
import { getGuide } from "@/content/guides";
import { BfsLab, type BfsGraphData } from "./bfs-lab";
import styles from "./bfs.module.css";

const guide = getGuide("bfs");

export const metadata: Metadata = {
  title: "BFS, 가까운 곳부터 넓게 탐색하기",
  description: "큐, 방문 처리 시점, 거리표가 함께 움직이는 과정을 보며 너비 우선 탐색과 무가중 그래프 최단 거리를 이해합니다."
};

const bfsGraph = {
  nodes: ["A", "B", "C", "D", "E", "F", "G"],
  edges: [
    ["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"],
    ["C", "F"], ["E", "G"], ["F", "G"]
  ],
  positions: {
    A: { x: 80, y: 184 },
    B: { x: 245, y: 105 },
    C: { x: 245, y: 270 },
    D: { x: 430, y: 54 },
    E: { x: 430, y: 166 },
    F: { x: 430, y: 300 },
    G: { x: 615, y: 230 }
  }
} as const satisfies BfsGraphData;

const distanceLayers = [
  { x: 80, label: "거리 0" },
  { x: 245, label: "거리 1" },
  { x: 430, label: "거리 2" },
  { x: 615, label: "거리 3" }
] as const;

function BfsGraphVisual({ hero = false }: { hero?: boolean }) {
  return (
    <svg
      className={hero ? styles.heroMap : styles.howGraph}
      viewBox={hero ? "0 0 700 510" : "0 0 700 350"}
      role="img"
      aria-labelledby={hero ? "bfs-hero-title bfs-hero-desc" : "bfs-how-graph-title bfs-how-graph-desc"}
    >
      <title id={hero ? "bfs-hero-title" : "bfs-how-graph-title"}>A에서 시작한 무방향 그래프 BFS의 네 거리층</title>
      <desc id={hero ? "bfs-hero-desc" : "bfs-how-graph-desc"}>
        A-B, A-C, B-D, B-E, C-F, E-G, F-G의 일곱 간선으로 연결된 무방향 그래프입니다. E와 F에서 온 두 경로가 G에서 다시 만납니다.
      </desc>
      <g className={styles.layerGuides}>
        {distanceLayers.map((layer) => (
          <g key={layer.label}>
            <line x1={layer.x} y1="36" x2={layer.x} y2="334" />
            <text x={layer.x} y="20">{layer.label}</text>
          </g>
        ))}
      </g>
      <g className={styles.staticEdges}>
        {bfsGraph.edges.map(([from, to]) => (
          <line
            key={`${from}-${to}`}
            x1={bfsGraph.positions[from].x}
            y1={bfsGraph.positions[from].y}
            x2={bfsGraph.positions[to].x}
            y2={bfsGraph.positions[to].y}
          />
        ))}
      </g>
      <g className={styles.staticNodes}>
        {bfsGraph.nodes.map((node) => (
          <g
            className={node === "A" ? styles.staticStart : node === "G" ? styles.staticMerge : undefined}
            key={node}
            transform={`translate(${bfsGraph.positions[node].x} ${bfsGraph.positions[node].y})`}
          >
            <circle r="27" />
            <text>{node}</text>
          </g>
        ))}
      </g>
      {hero ? (
        <g className={styles.heroQueue}>
          <text x="80" y="402">A 처리 뒤 · QUEUE</text>
          <path d="M80 468h535" />
          {[[130, "B"], [202, "C"]].map(([x, label], index) => (
            <g key={label} transform={`translate(${x} 448)`}>
              <rect x="-28" y="-22" width="56" height="44" rx="4" />
              <text>{label}</text>
              {index === 0 ? <text className={styles.queueFront} y="38">FRONT</text> : null}
            </g>
          ))}
        </g>
      ) : null}
    </svg>
  );
}

const codeExamples: AlgorithmCodeExample[] = [
  {
    language: "Node.js",
    fileName: "bfs.js",
    code: `const graph = {
  A: ["B", "C"],
  B: ["A", "D", "E"],
  C: ["A", "F"],
  D: ["B"],
  E: ["B", "G"],
  F: ["C", "G"],
  G: ["E", "F"],
};

function bfs(graph, start) {
  const queue = [start];
  let front = 0;
  const distance = new Map([[start, 0]]); // 발견 즉시 방문 처리
  const order = [];

  while (front < queue.length) {
    const node = queue[front++];
    order.push(node);

    for (const next of graph[node]) {
      if (distance.has(next)) continue;
      distance.set(next, distance.get(node) + 1);
      queue.push(next);
    }
  }

  return { order, distance: Object.fromEntries(distance) };
}

console.log(bfs(graph, "A"));`
  },
  {
    language: "Java",
    fileName: "Bfs.java",
    code: `import java.util.*;

public class Bfs {
  static class Result {
    final List<String> order;
    final Map<String, Integer> distance;

    Result(List<String> order, Map<String, Integer> distance) {
      this.order = order;
      this.distance = distance;
    }
  }

  static Result bfs(Map<String, List<String>> graph, String start) {
    Queue<String> queue = new ArrayDeque<>();
    Map<String, Integer> distance = new LinkedHashMap<>();
    List<String> order = new ArrayList<>();

    queue.add(start);
    distance.put(start, 0); // 발견 즉시 방문 처리

    while (!queue.isEmpty()) {
      String node = queue.remove();
      order.add(node);

      for (String next : graph.get(node)) {
        if (distance.containsKey(next)) continue;
        distance.put(next, distance.get(node) + 1);
        queue.add(next);
      }
    }

    return new Result(order, distance);
  }

  public static void main(String[] args) {
    Map<String, List<String>> graph = new LinkedHashMap<>();
    graph.put("A", List.of("B", "C"));
    graph.put("B", List.of("A", "D", "E"));
    graph.put("C", List.of("A", "F"));
    graph.put("D", List.of("B"));
    graph.put("E", List.of("B", "G"));
    graph.put("F", List.of("C", "G"));
    graph.put("G", List.of("E", "F"));

    Result result = bfs(graph, "A");
    System.out.println(result.order);
    System.out.println(result.distance);
  }
}`
  },
  {
    language: "Python",
    fileName: "bfs.py",
    code: `from collections import deque

graph = {
    "A": ["B", "C"],
    "B": ["A", "D", "E"],
    "C": ["A", "F"],
    "D": ["B"],
    "E": ["B", "G"],
    "F": ["C", "G"],
    "G": ["E", "F"],
}

def bfs(graph, start):
    queue = deque([start])
    distance = {start: 0}  # 발견 즉시 방문 처리
    order = []

    while queue:
        node = queue.popleft()
        order.append(node)

        for neighbor in graph[node]:
            if neighbor in distance:
                continue
            distance[neighbor] = distance[node] + 1
            queue.append(neighbor)

    return order, distance

print(bfs(graph, "A"))`
  }
];

export default function BfsGuidePage() {
  return (
    <main className={styles.page}>
      <GuideHero
        guide={guide}
        title="가까운 곳부터, 한 층씩 넓혀 갑니다"
        lead="BFS는 먼저 발견한 노드를 먼저 꺼내는 큐를 사용합니다. 아래는 트리가 아니라, 두 경로가 G에서 다시 만나는 무방향 그래프입니다. BFS는 이 그래프를 시작점에서 가까운 거리층부터 탐색합니다."
      >
        <BfsGraphVisual hero />
      </GuideHero>

      <section className={`${styles.why} content-wrap`} aria-labelledby="bfs-why">
        <div className={styles.sectionLabel}>
          <p className="eyebrow">WHY</p>
          <h2 id="bfs-why">왜 BFS가 필요할까요?</h2>
        </div>
        <article>
          <span>01 / 가까운 답</span>
          <h3>몇 번 만에 도착하는지 바로 셉니다</h3>
          <p>미로의 최소 이동 횟수, 친구 관계의 최소 단계처럼 모든 이동 비용이 같을 때 BFS의 층이 곧 거리입니다.</p>
        </article>
        <article>
          <span>02 / 빠짐없는 탐색</span>
          <h3>같은 노드를 다시 줄 세우지 않습니다</h3>
          <p>노드를 큐에 넣는 순간 방문 표시를 하면 여러 경로가 만나는 그래프에서도 중복 삽입을 막을 수 있습니다.</p>
        </article>
      </section>

      <section className={`${styles.how} content-wrap`} aria-labelledby="bfs-how">
        <div className="section-heading">
          <p className="eyebrow">HOW</p>
          <h2 id="bfs-how">큐가 탐색의 층을 지킵니다</h2>
          <p>앞에서 하나를 꺼내고, 처음 본 이웃은 뒤에 넣습니다. 먼저 들어온 노드가 항상 먼저 처리되므로 거리 1을 끝낸 뒤 거리 2로 넘어갑니다.</p>
        </div>

        <div className={styles.mechanism}>
          <ol className={styles.howSteps}>
            <li><span>01</span><div><strong>DEQUEUE</strong><p>큐 맨 앞 노드를 꺼냅니다.</p></div></li>
            <li><span>02</span><div><strong>DISCOVER</strong><p>아직 발견하지 않은 이웃만 고릅니다.</p></div></li>
            <li><span>03</span><div><strong>MARK + DISTANCE</strong><p>넣기 전에 방문 표시하고 거리를 +1 합니다.</p></div></li>
            <li><span>04</span><div><strong>ENQUEUE</strong><p>새 이웃을 큐 맨 뒤에 차례로 넣습니다.</p></div></li>
          </ol>

          <figure className={styles.graphExplanation}>
            <span className={styles.mobileGraphHint}>거리 0 → 거리 3 · 옆으로 밀어 전체 그래프 보기</span>
            <BfsGraphVisual />
            <figcaption>
              <strong>무방향 그래프 · 정점 7개 · 간선 7개</strong>
              <span>A-B · A-C · B-D · B-E · C-F · E-G · F-G</span>
              <p>E-G와 F-G가 모두 있으므로 트리가 아닙니다. G는 E와 F 양쪽에서 갈 수 있지만, 먼저 발견한 한 번만 큐에 들어갑니다.</p>
            </figcaption>
          </figure>
        </div>

        <aside className={styles.enqueueRule}>
          <span>핵심 규칙</span>
          <div>
            <strong><code>visited</code>는 큐에서 꺼낼 때가 아니라, 큐에 넣을 때 기록합니다.</strong>
            <p>두 노드가 같은 이웃을 발견하더라도 첫 번째 발견만 큐에 들어갑니다. 이 시점을 늦추면 같은 노드가 여러 번 쌓여 불필요한 탐색이 생깁니다.</p>
          </div>
        </aside>
      </section>

      <BfsLab graph={bfsGraph} />

      <section className={`${styles.apply} content-wrap`} aria-labelledby="bfs-apply">
        <div className="section-heading">
          <p className="eyebrow">APPLY</p>
          <h2 id="bfs-apply">같은 BFS를 세 언어로 실행해 보세요</h2>
          <p>예제는 위 실험과 같은 무방향 그래프를 사용합니다. 시작점을 바꾸려면 마지막 호출의 <code>A</code>를 실제 시작 노드로 바꾸세요.</p>
        </div>

        <AlgorithmCodeTabs examples={codeExamples} label="Node.js, Java, Python BFS 구현" />

        <div className={styles.applyNotes}>
          <article>
            <span>TIME</span>
            <strong>O(V + E)</strong>
            <p>각 정점을 한 번 방문하고, 인접 리스트의 각 간선을 한 번씩 확인합니다.</p>
          </article>
          <article>
            <span>SPACE</span>
            <strong>O(V)</strong>
            <p>큐, 방문 정보, 거리표에 정점 수만큼 공간이 필요합니다.</p>
          </article>
          <article>
            <span>USE WHEN</span>
            <strong>모든 간선 비용이 같을 때</strong>
            <p>무가중 그래프에서 BFS의 거리는 시작점부터 지나온 최소 간선 수입니다.</p>
          </article>
        </div>

        <aside className={styles.caution}>
          <p className="eyebrow">WEIGHTED GRAPH</p>
          <div>
            <h3>간선마다 비용이 다르면 BFS 거리가 최저 비용은 아닙니다</h3>
            <p>간선 수가 적어도 비용 합은 더 클 수 있습니다. 가중치가 음수가 없으면 다익스트라, 가중치가 0 또는 1뿐이면 0-1 BFS 같은 방법을 검토하세요.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
