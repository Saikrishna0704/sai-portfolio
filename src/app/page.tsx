import { IdentityIntro } from "@/components/overview/IdentityIntro";
import { SelectionPanel } from "@/components/overview/SelectionPanel";
import { portfolioData } from "@/data/portfolio-data";

import styles from "./page.module.css";

export default function ExplorePage() {
  const { person } = portfolioData;

  return (
    <section className={styles.overview}>
      {/*
        The name and domain navigation live in the header, and the star is the
        identity in the scene. The heading keeps document structure; the
        IdentityIntro is the visible answer to "who is this", holding the
        corner the SelectionPanel takes over once a domain is chosen.
      */}
      <h1 className="sr-only">
        {person.name}. {person.tagline}.
      </h1>

      <IdentityIntro />
      <SelectionPanel />
    </section>
  );
}
