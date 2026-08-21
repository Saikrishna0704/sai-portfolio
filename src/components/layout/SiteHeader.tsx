"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>
        {person.name}
      </Link>

      <nav aria-label="Views">
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
