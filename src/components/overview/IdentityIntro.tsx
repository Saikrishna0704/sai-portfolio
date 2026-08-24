"use client";

import Link from "next/link";

import { useSceneArrived } from "@/components/scene/arrivalState";
import { portfolioData } from "@/data/portfolio-data";
import { useSelection } from "@/state/selection";

import styles from "./IdentityIntro.module.css";

/**
 * Who this is, in readable DOM, at the moment of arrival.
 *
 * The scene alone answers it only for someone willing to explore; PROJECT.md
 * §2 wants a visitor to understand who the person is within seconds. This
 * lockup holds the overview's corner with the tagline, the bio, and the one
 * hint the interface needs, then yields the same corner to the SelectionPanel
 * the moment a domain is chosen.
 *
 * It waits for the system to settle before surfacing, so the opening approach
 * plays out over an empty frame and the words arrive with the labels, as part
 * of the system rather than over it.
 */
export function IdentityIntro() {
  const { selection } = useSelection();
  const arrived = useSceneArrived();
  const { person } = portfolioData;

  const shown = arrived && selection.kind === "overview";

  return (
    <div
      className={`${styles.intro} ${shown ? styles.shown : ""}`}
      // Out of the way entirely while a selection holds the corner: the panel
      // replaces it rather than stacking on top of it.
      aria-hidden={!shown}
    >
      <p className={styles.tagline}>{person.tagline}</p>
      <p className={styles.bio}>{person.bio}</p>
      <p className={styles.hint}>
        Select a planet to explore the work, or read the{" "}
        <Link
          href="/dossier"
          className={styles.hintLink}
          tabIndex={shown ? undefined : -1}
        >
          Dossier
        </Link>
        .
      </p>
    </div>
  );
}
