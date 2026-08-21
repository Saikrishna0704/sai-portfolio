"use client";

import { portfolioData } from "@/data/portfolio-data";
import { useSelection } from "@/state/selection";

import styles from "./DomainBar.module.css";

/**
 * Domain navigation, living in the header rather than over the scene.
 *
 * PROJECT.md §4 asks the overview for conventional navigation alongside the
 * bodies. Putting it in the top bar keeps the canvas empty until someone
 * interacts, which is the point of the view.
 *
 * Hovering previews a domain in the scene without committing to it; clicking
 * commits. Focus previews too, so the keyboard path feels the same.
 */
export function DomainBar() {
  const { selection, select, setHover } = useSelection();

  return (
    <ul className={styles.list}>
      {portfolioData.domains.map((domain) => {
        const isSelected =
          selection.kind !== "overview" && selection.domainId === domain.id;

        return (
          <li key={domain.id}>
            <button
              type="button"
              className={styles.item}
              aria-pressed={isSelected}
              onClick={() => select({ kind: "domain", domainId: domain.id })}
              onPointerEnter={() => setHover({ domainId: domain.id })}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover({ domainId: domain.id })}
              onBlur={() => setHover(null)}
            >
              {domain.name}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
