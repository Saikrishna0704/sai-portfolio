import { SelectionPanel } from "@/components/overview/SelectionPanel";
import { portfolioData } from "@/data/portfolio-data";

import styles from "./page.module.css";

export default function ExplorePage() {
  const { person } = portfolioData;

  return (
    <section className={styles.overview}>
      {/*
        The name and domain navigation live in the header, and the star is the
        identity in the scene. Repeating either here is what made this corner
        cluttered, so the page keeps only a heading for document structure.
      */}
      <h1 className="sr-only">
        {person.name}. {person.tagline}.
      </h1>

      <SelectionPanel />
    </section>
  );
}
