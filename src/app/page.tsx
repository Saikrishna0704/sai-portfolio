import { SocialLinks } from "@/components/contact/SocialLinks";
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
        {/* PROJECT.md §2.6: contact and important external links must be
            reachable without depending on the 3D scene — so they sit here as
            well as in the conventional view, not one click away. */}
        <SocialLinks links={person.links} />
      </div>

      <DomainNav />
    </section>
  );
}
