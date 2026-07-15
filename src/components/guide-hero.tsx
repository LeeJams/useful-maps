import Link from "next/link";
import type { Guide } from "@/content/guides";
import { ArrowLeftIcon } from "./icons";

export function GuideHero({
  guide,
  title,
  lead,
  children
}: {
  guide: Guide;
  title: string;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`guide-hero guide-hero-${guide.accent}`}>
      <div className="guide-hero-copy page-wrap">
        <Link className="back-link" href="/">
          <ArrowLeftIcon /> 라이브러리
        </Link>
        <p className="eyebrow">{guide.eyebrow}</p>
        <h1>{title}</h1>
        <p className="guide-lead">{lead}</p>
        <dl className="guide-meta">
          <div>
            <dt>읽는 시간</dt>
            <dd>{guide.readingTime}</dd>
          </div>
          <div>
            <dt>형식</dt>
            <dd>{guide.format}</dd>
          </div>
          <div>
            <dt>업데이트</dt>
            <dd>{guide.updatedAt}</dd>
          </div>
        </dl>
      </div>
      <div className="guide-hero-visual" aria-hidden="true">
        {children}
      </div>
    </section>
  );
}
