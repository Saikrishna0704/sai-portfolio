"use client";

import { useMemo, useState } from "react";

import { portfolioData } from "@/data/portfolio-data";
import {
  experienceForProject,
  relationsForSkill,
  skillsForProject,
} from "@/data/relationships";

import styles from "./QuickViewContent.module.css";

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

/** "2025-03" to "Mar 2025". Parsed by hand rather than through Date, which
 *  would shift a bare year and month across timezones. */
function formatMonth(value: string): string {
  const [year, month] = value.split("-");
  const name = MONTHS[Number(month) - 1];
  return name && year ? `${name} ${year}` : value;
}

function classes(...values: (string | false | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

export function QuickViewContent() {
  const {
    person,
    domains,
    experience,
    education,
    skills,
    funProjects,
    archived,
  } = portfolioData;

  const [activeSkillId, setActiveSkillId] = useState<string | null>(null);

  const active = useMemo(() => {
    if (!activeSkillId) return null;
    const skill = skills.find((item) => item.id === activeSkillId);
    if (!skill) return null;
    return { skill, relations: relationsForSkill(activeSkillId) };
  }, [activeSkillId, skills]);

  /** Nothing is dimmed until a skill is chosen. */
  const isDomainMuted = (domainId: string) =>
    active !== null && !active.relations.domainIds.includes(domainId);

  const isProjectMuted = (projectId: string) =>
    active !== null && !active.relations.projectIds.includes(projectId);

  const isExperienceMuted = (relatedProjects: string[]) =>
    active !== null &&
    !relatedProjects.some((id) => active.relations.projectIds.includes(id));

  const toggleSkill = (skillId: string) =>
    setActiveSkillId((current) => (current === skillId ? null : skillId));

  return (
    <div className={styles.page}>
      {/* This page can be linked to directly, so it needs to stand on its own
          as a document rather than borrowing the shell header for a title. */}
      <header className={styles.masthead}>
        <h1 className={styles.name}>{person.name}</h1>
        <p className={styles.tagline}>{person.tagline}</p>
        {/* Contact lives in the header now, which is sticky and therefore on
            screen at every scroll position rather than only at the top. */}
      </header>

      <section className={styles.section} aria-labelledby="about">
        <h2 id="about" className={styles.heading}>
          About
        </h2>
        <p className={styles.bio}>{person.bio}</p>
      </section>

      {experience.length > 0 && (
        <section className={styles.section} aria-labelledby="experience">
          <h2 id="experience" className={styles.heading}>
            Experience
          </h2>
          <ul className={styles.entries}>
            {experience.map((entry) => (
              <li
                key={entry.id}
                className={classes(
                  styles.entry,
                  isExperienceMuted(entry.relatedProjects) && styles.muted,
                )}
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

      {/* The scene layer is aria-hidden, so this is where domain and project
          names exist for assistive technology and without WebGL. */}
      <section className={styles.section} aria-labelledby="work">
        <h2 id="work" className={styles.heading}>
          Work
        </h2>
        <div className={styles.domains}>
          {domains.map((domain) => (
            <article
              key={domain.id}
              className={classes(
                styles.domain,
                isDomainMuted(domain.id) && styles.muted,
              )}
            >
              <h3 className={styles.domainName}>{domain.name}</h3>
              <p className={styles.domainDescription}>{domain.description}</p>
              <ul className={styles.projects}>
                {domain.projects.map((project) => (
                  <li
                    key={project.id}
                    className={classes(
                      styles.project,
                      isProjectMuted(project.id) && styles.muted,
                    )}
                  >
                    <a
                      className={styles.projectTitle}
                      href={project.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {project.title}
                    </a>
                    <p className={styles.projectSummary}>{project.summary}</p>
                    <ProjectMeta projectId={project.id} />
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {skills.length > 0 && (
        <section className={styles.section} aria-labelledby="skills">
          <h2 id="skills" className={styles.heading}>
            Skills
          </h2>
          <p className={styles.hint}>
            Pick one to see where it shows up in the work above.
          </p>
          <ul className={styles.skills}>
            {skills.map((skill) => {
              const isActive = activeSkillId === skill.id;
              return (
                <li key={skill.id}>
                  <button
                    type="button"
                    className={styles.skill}
                    aria-pressed={isActive}
                    onClick={() => toggleSkill(skill.id)}
                  >
                    {skill.name}
                  </button>
                </li>
              );
            })}
          </ul>

          {active && (
            <p className={styles.match} role="status">
              <span className={styles.matchText}>
                {active.skill.name} appears in{" "}
                {countLabel(active.relations.domainIds.length, "area")} and{" "}
                {countLabel(active.relations.projectIds.length, "project")}.
              </span>
              <button
                type="button"
                className={styles.clear}
                onClick={() => setActiveSkillId(null)}
              >
                Clear
              </button>
            </p>
          )}
        </section>
      )}

      {funProjects.length > 0 && (
        <section className={styles.section} aria-labelledby="fun">
          <h2 id="fun" className={styles.heading}>
            Fun projects
          </h2>
          {/* Built for their own sake, so they sit apart from the domains
              rather than inside one. */}
          <ul className={styles.entries}>
            {funProjects.map((project) => (
              <li
                key={project.id}
                className={classes(
                  styles.project,
                  isProjectMuted(project.id) && styles.muted,
                )}
              >
                <a
                  className={styles.projectTitle}
                  href={project.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {project.title}
                </a>
                <p className={styles.projectSummary}>{project.summary}</p>
                <ProjectMeta projectId={project.id} />
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

function countLabel(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/**
 * The technologies a project used, and the role that produced it. Both are
 * read from the relationship index rather than written out per project.
 */
function ProjectMeta({ projectId }: { projectId: string }) {
  const technologies = skillsForProject(projectId);
  const roles = experienceForProject(projectId);

  if (technologies.length === 0 && roles.length === 0) return null;

  return (
    <p className={styles.meta}>
      {technologies.length > 0 && (
        <span className={styles.tags}>
          {technologies.map((skill) => (
            <span key={skill.id} className={styles.tag}>
              {skill.name}
            </span>
          ))}
        </span>
      )}
      {roles.map((role) => (
        <span key={role.id} className={styles.role}>
          From {role.role}, {role.institution}
        </span>
      ))}
    </p>
  );
}
