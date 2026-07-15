import type { Metadata } from "next";
import { AlgorithmCodeTabs, type AlgorithmCodeExample } from "@/components/algorithm-code-tabs";
import { GuideHero } from "@/components/guide-hero";
import { getGuide } from "@/content/guides";
import { BfsLab } from "./bfs-lab";
import styles from "./bfs.module.css";

const guide = getGuide("bfs");

export const metadata: Metadata = {
  title: "BFS, 가까운 곳부터 넓게 탐색하기",
  description: "큐, 방문 처리 시점, 거리표가 함께 움직이는 과정을 보며 너비 우선 탐색과 무가중 그래프 최단 거리를 이해합니다."
};

function BfsHeroVisual() {
  return (
    <svg
      className={styles.heroMap}
      viewBox="0 0 640 620"
      role="img"
      aria-labelledby="bfs-hero-title bfs-hero-desc"
    >
      <title id="bfs-hero-title">A에서 시작한 BFS의 네 거리층</title>
      <desc id="bfs-hero-desc">시작점 A에서 거리 1인 B와 C, 거리 2인 D, E, F, 거리 3인 G까지 넓어지는 그래프입니다.</desc>
      <g className={styles.heroRings}>
        <circle cx="320" cy="270" r="120" />
        <circle cx="320" cy="270" r="195" />
        <circle cx="320" cy="270" r="240" />
      </g>
      <g className={styles.heroEdges}>
        <path d="M320 270 220 205M320 270l100-65M220 205l-45-65M220 205l40-120M420 205 380 85M260 85l60-55M380 85l-60-55" />
      </g>
      <g className={`${styles.heroNode} ${styles.heroStart}`} transform="translate(320 270)"><circle r="29" /><text>A</text></g>
      <g className={styles.heroNode} transform="translate(220 205)"><circle r="27" /><text>B</text></g>
      <g className={styles.heroNode} transform="translate(420 205)"><circle r="27" /><text>C</text></g>
      <g className={styles.heroNode} transform="translate(175 140)"><circle r="25" /><text>D</text></g>
      <g className={styles.heroNode} transform="translate(260 85)"><circle r="25" /><text>E</text></g>
      <g className={styles.heroNode} transform="translate(380 85)"><circle r="25" /><text>F</text></g>
      <g className={styles.heroNode} transform="translate(320 30)"><circle r="25" /><text>G</text></g>
      <g className={styles.heroLabels}>
        <text x="350" y="286">거리 0</text>
        <text x="438" y="178">거리 1</text>
        <text x="445" y="108">거리 2</text>
        <text x="350" y="29">거리 3</text>
      </g>
      <path className={styles.heroQueueLine} d="M110 520h420" />
      <g className={styles.heroQueue}>
        <text x="110" y="492">QUEUE / FRONT</text>
        {[
          [160, "C"],
          [236, "D"],
          [312, "E"]
        ].map(([x, label], index) => (
          <g key={label} transform={`translate(${x} 520)`}>
            <rect x="-30" y="-24" width="60" height="48" rx="4" />
            <text>{label}</text>
            {index === 0 ? <path d="M-12 37h24m-12 0v18" /> : null}
          </g>
        ))}
      </g>
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
        lead="BFS는 먼저 발견한 노드를 먼저 꺼내는 큐를 사용합니다. 그래서 가중치가 없는 그래프에서는 시작점에서 가장 적은 간선으로 도착하는 순서를 놓치지 않습니다."
      >
        <BfsHeroVisual />
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

          <div className={styles.layerDiagram} role="img" aria-label="BFS가 거리 0부터 거리 3까지 순서대로 노드를 큐에 넣는 도식">
            <div><span>거리 0</span><strong>A</strong><small>시작</small></div>
            <i aria-hidden="true" />
            <div><span>거리 1</span><strong>B · C</strong><small>먼저 처리</small></div>
            <i aria-hidden="true" />
            <div><span>거리 2</span><strong>D · E · F</strong><small>그다음 처리</small></div>
            <i aria-hidden="true" />
            <div><span>거리 3</span><strong>G</strong><small>마지막 처리</small></div>
          </div>
        </div>

        <aside className={styles.enqueueRule}>
          <span>핵심 규칙</span>
          <div>
            <strong><code>visited</code>는 큐에서 꺼낼 때가 아니라, 큐에 넣을 때 기록합니다.</strong>
            <p>두 노드가 같은 이웃을 발견하더라도 첫 번째 발견만 큐에 들어갑니다. 이 시점을 늦추면 같은 노드가 여러 번 쌓여 불필요한 탐색이 생깁니다.</p>
          </div>
        </aside>
      </section>

      <BfsLab />

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
