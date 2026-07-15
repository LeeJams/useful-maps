export type Guide = {
  slug: "git" | "service-worker";
  href: string;
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

export const guides: Guide[] = [
  {
    slug: "git",
    href: "/git",
    eyebrow: "01 · VERSION CONTROL",
    title: "Git 그래프와 안전한 되돌리기",
    summary:
      "같은 7개 커밋이 rebase, merge, squash, revert 선택에 따라 어떻게 달라지는지 직접 비교합니다.",
    why: "명령어를 외우기 전에 그래프의 모양과 되돌릴 경계를 이해하기 위해",
    format: "6개 상태를 바꾸는 인터랙티브 커밋 그래프",
    readingTime: "약 8분",
    tags: ["Git", "Rebase", "Rollback"],
    accent: "teal",
    updatedAt: "2026.07"
  },
  {
    slug: "service-worker",
    href: "/service-worker",
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
  }
];

export function getGuide(slug: Guide["slug"]) {
  return guides.find((guide) => guide.slug === slug)!;
}
