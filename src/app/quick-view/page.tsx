import type { Metadata } from "next";

import { portfolioData } from "@/data/portfolio-data";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: `Quick View — ${portfolioData.person.name}`,
};

export default function QuickViewPage() {
  const { person, domains } = portfolioData;

  // Only sections whose content already exists are rendered (PROJECT.md §7).
  // Experience and Skills belong to later phases; Resume is deliberately
  // absent because no resume URL has been supplied.
  const contactLinks = [
    { label: "Email", href: `mailto:${person.links.email}` },
    { label: "GitHub", href: person.links.github },
    { label: "LinkedIn", href: person.links.linkedin },
    { label: "ORCID", href: person.links.orcid },
    { label: "X", href: person.links.x },
  ];

  return (
    <div className={styles.page}>
      <section className={styles.section} aria-labelledby="about">
        <h2 id="about" className={styles.heading}>
          About
        </h2>
        <p className={styles.bio}>{person.bio}</p>
      </section>

      {/* The scene layer is aria-hidden, so this is where domain and project
          names exist for assistive technology and without WebGL. */}
      <section className={styles.section} aria-labelledby="work">
        <h2 id="work" className={styles.heading}>
          Work
        </h2>
        <div className={styles.domains}>
          {domains.map((domain) => (
            <article key={domain.id} className={styles.domain}>
              <h3 className={styles.domainName}>{domain.name}</h3>
              <p className={styles.domainDescription}>{domain.description}</p>
              <ul className={styles.projects}>
                {domain.projects.map((project) => (
                  <li key={project.id} className={styles.project}>
                    <a
                      className={styles.projectTitle}
                      href={project.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {project.title}
                    </a>
                    <p className={styles.projectSummary}>{project.summary}</p>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="contact">
        <h2 id="contact" className={styles.heading}>
          Contact
        </h2>
        <ul className={styles.links}>
          {contactLinks.map((link) => (
            <li key={link.label}>
              <a
                className={styles.link}
                href={link.href}
                {...(link.href.startsWith("mailto:")
                  ? {}
                  : { target: "_blank", rel: "noreferrer" })}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
