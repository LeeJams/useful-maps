import Link from "next/link";

export function SiteLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="site-logo" href="/" aria-label="쓸모지도 홈">
      <span className="site-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="site-logo-copy">
        <strong>쓸모지도</strong>
        {!compact && <small>USEFUL MAPS</small>}
      </span>
    </Link>
  );
}
