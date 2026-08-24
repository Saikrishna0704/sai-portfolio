"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SocialLinks } from "@/components/contact/SocialLinks";
import { DomainBar } from "@/components/overview/DomainBar";
import { portfolioData } from "@/data/portfolio-data";

import styles from "./SiteHeader.module.css";

/**
 * The top-level destinations (PROJECT.md §4, §7).
 *
 * "Dossier" replaced "Quick View", which promised a preview of something
 * fuller. PROJECT.md §7 is explicit that this view is first-class and not a
 * fallback, so a name meaning *the complete file on a person* is the honest
 * one. `gloss` is the plain-English word for anyone who does not know it.
 *
 * Blog is deliberately `external`: the writing lives on its own Hugo site, so
 * this leaves rather than routes. It is marked as leaving instead of pretending
 * to be another view of this app — a reader should never be surprised by which
 * site they are on.
 */
const VIEWS = [
  { id: "explore", href: "/", label: "Explore", gloss: null, external: false },
  {
    id: "dossier",
    href: "/dossier",
    label: "Dossier",
    gloss: "Full profile",
    external: false,
  },
  {
    id: "blog",
    href: portfolioData.person.links.blog,
    label: "Blog",
    gloss: null,
    external: true,
  },
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
            const isCurrent = !view.external && pathname === view.href;
            const glossId = view.gloss ? `${view.id}-gloss` : undefined;

            return (
              <li key={view.id} className={styles.viewItem}>
                {view.external ? (
                  <a
                    href={view.href}
                    className={styles.view}
                    target="_blank"
                    rel="noreferrer"
                    aria-describedby={glossId}
                  >
                    {view.label}
                    {/* Decorative: the sr-only note below carries the same
                        meaning for anyone who cannot see the mark. */}
                    <span className={styles.externalMark} aria-hidden="true">
                      ↗
                    </span>
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                ) : (
                  <Link
                    href={view.href}
                    className={styles.view}
                    aria-current={isCurrent ? "page" : undefined}
                    aria-describedby={glossId}
                  >
                    {view.label}
                  </Link>
                )}
                {/* Shown on focus as well as hover: a title attribute alone
                    never reaches a keyboard user, and the point of the gloss
                    is to help anyone who does not know the word. */}
                {view.gloss && glossId && (
                  <span id={glossId} className={styles.gloss}>
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
