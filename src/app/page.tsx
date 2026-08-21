import { portfolioData } from "@/data/portfolio-data";

import styles from "./page.module.css";

export default function ExplorePage() {
  const { person } = portfolioData;

  return (
    <section className={styles.overview}>
      <p className={styles.eyebrow}>{person.tagline}</p>
      <h1 className={styles.name}>{person.name}</h1>
    </section>
  );
}
