import type { Metadata } from "next";
import Link from "next/link";

import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "Page not found",
};

/**
 * The 404.
 *
 * Next's default is unstyled and, worse, a dead end: it states the failure and
 * offers nothing to do about it. This one sits on the same dimmed scrim the
 * Dossier uses, so the system stays visible behind it, and it always hands
 * back both routes rather than leaving the reader to edit the URL.
 *
 * The wording leans on the spatial metaphor because the scene behind it is
 * literally a set of coordinates — not as a joke, which would age badly on the
 * one screen a visitor reaches by accident.
 */
export default function NotFound() {
  return (
    <section className={styles.page}>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>Nothing at these coordinates</h1>
      <p className={styles.body}>
        This page does not exist. It may have moved, or the link that brought
        you here may be wrong.
      </p>

      <nav className={styles.actions} aria-label="Ways back">
        <Link className={styles.primary} href="/">
          Back to Explore
        </Link>
        <Link className={styles.secondary} href="/dossier">
          Open the Dossier
        </Link>
      </nav>
    </section>
  );
}
