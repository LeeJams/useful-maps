"use client";

import Link from "next/link";
import { useRef } from "react";
import { guideCategories, guides } from "@/content/guides";

export function GuideMenu() {
  const menuRef = useRef<HTMLDetailsElement>(null);

  function closeMenu() {
    menuRef.current?.removeAttribute("open");
  }

  return (
    <details className="guide-menu" ref={menuRef}>
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
                    <Link href={guide.href} onClick={closeMenu}>
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
  );
}
