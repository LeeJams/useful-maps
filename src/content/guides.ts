export type Guide = {
  slug: "git" | "service-worker" | "bfs" | "dfs" | "backtracking";
  href: string;
  navLabel: string;
  category: GuideCategory["id"];
  preview: "git" | "worker" | "bfs" | "dfs" | "backtracking";
  eyebrow: string;
  title: string;
  summary: string;
  why: string;
  format: string;
  readingTime: string;
  tags: string[];
  accent: "teal" | "blue";
  updatedAt: string;
};

export type GuideCategory = {
  id: "development" | "algorithms";
  label: string;
  description: string;
};

export const guideCategories: GuideCategory[] = [
  {
    id: "development",
    label: "개발 개념",
    description: "도구와 플랫폼이 실제로 남기는 구조를 봅니다."
  },
  {
    id: "algorithms",
    label: "알고리즘",
    description: "어려운 탐색 과정을 한 단계씩 직접 따라갑니다."
  }
];

export const guides: Guide[] = [
  {
    slug: "git",
    href: "/git",
    navLabel: "Git",
    category: "development",
    preview: "git",
    eyebrow: "01 · VERSION CONTROL",
    title: "Git 그래프와 안전한 되돌리기",
    summary:
      "같은 7개 커밋이 rebase, merge, squash, revert 선택에 따라 어떻게 달라지는지 직접 비교합니다.",
    why: "명령어를 외우기 전에 그래프의 모양과 되돌릴 경계를 이해하기 위해",
    format: "7개 상태를 바꾸는 인터랙티브 커밋 그래프",
    readingTime: "약 8분",
    tags: ["Git", "Rebase", "Rollback"],
    accent: "teal",
    updatedAt: "2026.07"
  },
  {
    slug: "service-worker",
    href: "/service-worker",
    navLabel: "Service Worker",
    category: "development",
    preview: "worker",
    eyebrow: "02 · WEB PLATFORM",
    title: "Service Worker 요청 경로",
    summary:
      "브라우저 요청이 네트워크와 캐시 사이에서 어떻게 라우팅되는지 실제 서비스 워커로 실험합니다.",
    why: "오프라인, 빠른 재방문, 안전한 업데이트가 같은 중간 계층에서 시작됨을 보기 위해",
    format: "실제 캐시와 응답 출처가 바뀌는 요청 실험실",
    readingTime: "약 10분",
    tags: ["PWA", "Cache", "Offline"],
    accent: "blue",
    updatedAt: "2026.07"
  },
  {
    slug: "bfs",
    href: "/algorithms/bfs",
    navLabel: "BFS",
    category: "algorithms",
    preview: "bfs",
    eyebrow: "03 · ALGORITHM",
    title: "BFS, 가까운 곳부터 넓게 탐색하기",
    summary:
      "큐가 발견 순서를 어떻게 보존해 최단 간선 수를 보장하는지 한 단계씩 확인합니다.",
    why: "가중치 없는 그래프에서 가장 가까운 답을 놓치지 않는 탐색 순서를 이해하기 위해",
    format: "큐와 거리표가 함께 움직이는 단계별 그래프 실험",
    readingTime: "약 8분",
    tags: ["Graph", "Queue", "Shortest Path"],
    accent: "teal",
    updatedAt: "2026.07"
  },
  {
    slug: "dfs",
    href: "/algorithms/dfs",
    navLabel: "DFS",
    category: "algorithms",
    preview: "dfs",
    eyebrow: "04 · ALGORITHM",
    title: "DFS, 한 갈래를 끝까지 탐색하기",
    summary:
      "스택과 재귀 호출이 같은 깊이 우선 순서를 만드는 과정을 직접 비교합니다.",
    why: "경로, 연결 요소, 사이클처럼 깊은 구조를 빠짐없이 확인하는 방식을 이해하기 위해",
    format: "호출 스택과 방문 경로가 함께 바뀌는 탐색 실험",
    readingTime: "약 8분",
    tags: ["Graph", "Stack", "Recursion"],
    accent: "teal",
    updatedAt: "2026.07"
  },
  {
    slug: "backtracking",
    href: "/algorithms/backtracking",
    navLabel: "백트래킹",
    category: "algorithms",
    preview: "backtracking",
    eyebrow: "05 · ALGORITHM",
    title: "백트래킹, 막힌 선택을 되돌리기",
    summary:
      "선택하고, 제약을 검사하고, 되돌리는 과정을 N-Queens 탐색 트리로 따라갑니다.",
    why: "모든 조합을 무작정 만들지 않고 불가능한 가지를 일찍 잘라 내는 판단을 이해하기 위해",
    format: "N-Queens 선택 트리와 보드가 연결된 가지치기 실험",
    readingTime: "약 10분",
    tags: ["Search", "Pruning", "N-Queens"],
    accent: "teal",
    updatedAt: "2026.07"
  }
];

export function getGuide(slug: Guide["slug"]) {
  return guides.find((guide) => guide.slug === slug)!;
}
