"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SocialLinks } from "@/components/contact/SocialLinks";
import { DomainBar } from "@/components/overview/DomainBar";
import { portfolioData } from "@/data/portfolio-data";

import styles from "./SiteHeader.module.css";

/** The two top-level modes of the product (PROJECT.md §4, §7). */
const VIEWS = [
  { href: "/", label: "Explore" },
  { href: "/quick-view", label: "Quick View" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const { person } = portfolioData;
  const isExplore = pathname === "/";

  return (
    <header className={styles.header}>
      <Link href="/" id="site-brand" className={styles.brand}>
        {person.name}
      </Link>

      {/* Ordered by CSS, not markup. Wide: one line, name to toggle. Narrow:
          name and toggle share a row, domains and contact take the next.
          `display: contents` dissolves this wrapper at the wider size so its
          children join the header's own flex row. */}
      <div className={styles.secondary}>
        {isExplore && (
          <nav aria-label="Work domains" className={styles.domains}>
            <DomainBar />
          </nav>
        )}
        <div className={styles.socials}>
          <SocialLinks links={person.links} />
        </div>
      </div>

      <nav aria-label="Views" className={styles.viewsNav}>
        <ul className={styles.views}>
          {VIEWS.map((view) => {
            const isCurrent = pathname === view.href;
            return (
              <li key={view.href}>
                <Link
                  href={view.href}
                  className={styles.view}
                  aria-current={isCurrent ? "page" : undefined}
                >
                  {view.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
