import { DomainNav } from "@/components/overview/DomainNav";
import { portfolioData } from "@/data/portfolio-data";

import styles from "./page.module.css";

export default function ExplorePage() {
  const { person } = portfolioData;

  return (
    <section className={styles.overview}>
      <div className={styles.identity}>
        <p className={styles.eyebrow}>{person.tagline}</p>
        <h1 className={styles.name}>{person.name}</h1>
      </div>

      <DomainNav />
    </section>
  );
}
