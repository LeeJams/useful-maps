import Link from "next/link";
import { GuideMenu } from "./guide-menu";
import { SiteLogo } from "./site-logo";

export function SiteHeader() {
  return (
    <header className="site-header">
      <SiteLogo />
      <nav className="site-nav" aria-label="주요 가이드">
        <GuideMenu />
        <Link className="nav-index" href="/#guides">
          전체 보기 <span aria-hidden="true">↘</span>
        </Link>
      </nav>
    </header>
  );
}
