"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SocialLinks } from "@/components/contact/SocialLinks";
import { DomainBar } from "@/components/overview/DomainBar";
import { portfolioData } from "@/data/portfolio-data";

import styles from "./SiteHeader.module.css";

/**
 * The two top-level modes of the product (PROJECT.md §4, §7).
 *
 * "Dossier" replaced "Quick View", which promised a preview of something
 * fuller. PROJECT.md §7 is explicit that this view is first-class and not a
 * fallback, so a name meaning *the complete file on a person* is the honest
 * one. `gloss` is the plain-English word for anyone who does not know it.
 */
const VIEWS = [
  { href: "/", label: "Explore", gloss: null },
  { href: "/dossier", label: "Dossier", gloss: "Full profile" },
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
              <li key={view.href} className={styles.viewItem}>
                <Link
                  href={view.href}
                  className={styles.view}
                  aria-current={isCurrent ? "page" : undefined}
                  aria-describedby={
                    view.gloss ? `${view.href.slice(1)}-gloss` : undefined
                  }
                >
                  {view.label}
                </Link>
                {/* Shown on focus as well as hover: a title attribute alone
                    never reaches a keyboard user, and the point of the gloss
                    is to help anyone who does not know the word. */}
                {view.gloss && (
                  <span
                    id={`${view.href.slice(1)}-gloss`}
                    className={styles.gloss}
                  >
                    {view.gloss}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
