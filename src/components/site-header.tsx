import Link from "next/link";
import { guideCategories, guides } from "@/content/guides";
import { SiteLogo } from "./site-logo";

export function SiteHeader() {
  return (
    <header className="site-header">
      <SiteLogo />
      <nav className="site-nav" aria-label="주요 가이드">
        <details className="guide-menu">
          <summary>
            가이드 <span>{String(guides.length).padStart(2, "0")}</span>
          </summary>
          <div className="guide-menu-panel">
            {guideCategories.map((category) => (
              <section key={category.id} aria-labelledby={`nav-${category.id}`}>
                <div className="guide-menu-heading">
                  <p id={`nav-${category.id}`}>{category.label}</p>
                  <span>{category.description}</span>
                </div>
                <ul>
                  {guides
                    .filter((guide) => guide.category === category.id)
                    .map((guide) => (
                      <li key={guide.slug}>
                        <Link href={guide.href}>
                          <span>{guide.navLabel}</span>
                          <small>{guide.title}</small>
                        </Link>
                      </li>
                    ))}
                </ul>
              </section>
            ))}
          </div>
        </details>
        <Link className="nav-index" href="/#guides">
          전체 보기 <span aria-hidden="true">↘</span>
        </Link>
      </nav>
    </header>
  );
}
