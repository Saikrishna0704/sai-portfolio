import type { Metadata } from "next";

import { SocialLinks } from "@/components/contact/SocialLinks";
import { portfolioData } from "@/data/portfolio-data";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: `Quick View · ${portfolioData.person.name}`,
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "2025-03" → "Mar 2025". Parsed by hand rather than through Date, which
 *  would shift a bare year-month across timezones. */
function formatMonth(value: string): string {
  const [year, month] = value.split("-");
  const name = MONTHS[Number(month) - 1];
  return name && year ? `${name} ${year}` : value;
}

export default function QuickViewPage() {
  const { person, domains, experience, education, skills, archived } =
    portfolioData;

  // Every section here renders content that actually exists. Resume is the one
  // deliberate omission: no URL has been supplied, and an empty link is worse
  // than no link.
  return (
    <div className={styles.page}>
      {/* This page can be linked to directly, so it needs to stand on its own
          as a document rather than borrowing the shell header for a title. */}
      <header className={styles.masthead}>
        <h1 className={styles.name}>{person.name}</h1>
        <p className={styles.tagline}>{person.tagline}</p>
        {/* Directly under the name: this page reads as a résumé, and contact
            details belong where someone looks for them, not after a full
            scroll. */}
        <SocialLinks links={person.links} />
      </header>

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

      {experience.length > 0 && (
        <section className={styles.section} aria-labelledby="experience">
          <h2 id="experience" className={styles.heading}>
            Experience
          </h2>
          <ul className={styles.entries}>
            {experience.map((entry) => (
              <li
                key={`${entry.institution}-${entry.start}`}
                className={styles.entry}
              >
                <div className={styles.entryHead}>
                  <h3 className={styles.entryTitle}>{entry.role}</h3>
                  <p className={styles.entryMeta}>
                    {formatMonth(entry.start)} to{" "}
                    {entry.end ? formatMonth(entry.end) : "Present"}
                  </p>
                </div>
                <p className={styles.entryInstitution}>{entry.institution}</p>
                <p className={styles.projectSummary}>{entry.summary}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {education.length > 0 && (
        <section className={styles.section} aria-labelledby="education">
          <h2 id="education" className={styles.heading}>
            Education
          </h2>
          <ul className={styles.entries}>
            {education.map((entry) => (
              <li
                key={`${entry.institution}-${entry.degree}`}
                className={styles.entry}
              >
                <h3 className={styles.entryTitle}>{entry.degree}</h3>
                <p className={styles.entryInstitution}>{entry.institution}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {skills.length > 0 && (
        <section className={styles.section} aria-labelledby="skills">
          <h2 id="skills" className={styles.heading}>
            Skills
          </h2>
          {/* Plain list for now. Connecting skills to the projects and domains
              that use them is Phase 7. */}
          <ul className={styles.skills}>
            {skills.map((skill) => (
              <li key={skill.id} className={styles.skill}>
                {skill.name}
              </li>
            ))}
          </ul>
        </section>
      )}

      {archived.length > 0 && (
        <section className={styles.section} aria-labelledby="earlier">
          <h2 id="earlier" className={styles.heading}>
            Earlier work
          </h2>
          {/* Present but recessive: real published work that should be findable,
              without competing with the current focus. */}
          <ul className={styles.entries}>
            {archived.map((item) => (
              <li key={item.id} className={styles.archived}>
                <a
                  className={styles.archivedTitle}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {item.title}
                </a>
                <p className={styles.archivedMeta}>{item.year}</p>
                <p className={styles.archivedSummary}>{item.summary}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

    </div>
  );
}
