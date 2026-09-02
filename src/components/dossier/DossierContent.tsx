"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";

import { LocationView } from "@/components/globe/LocationView";
import { portfolioData, type Location } from "@/data/portfolio-data";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import {
  experienceForProject,
  relationsForSkill,
  skillsForProject,
} from "@/data/relationships";

import styles from "./DossierContent.module.css";

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
 *  would shift a bare year and month across timezones. A bare "2018" is passed
 *  through unchanged: some entries only have the year, and padding one on
 *  would state more than is known. */
function formatMonth(value: string): string {
  const [year, month] = value.split("-");
  if (!month) return value;
  const name = MONTHS[Number(month) - 1];
  return name && year ? `${name} ${year}` : value;
}

/**
 * ", Buffalo" after an institution, unless the name already says it.
 *
 * "University at Buffalo, Buffalo" reads as a mistake rather than as extra
 * information, and several institutions carry their city in their name.
 */
function placeSuffix(institution: string, location?: Location): string {
  if (!location) return "";
  const named = institution.toLowerCase().includes(location.city.toLowerCase());
  return named ? "" : `, ${location.city}`;
}

function classes(...values: (string | false | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

function countLabel(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/** Capability, not state: nothing ever changes, so there is nothing to watch. */
function subscribeNothing(): () => void {
  return () => {};
}

/** Stagger index for a deck item, read by CSS to fan the stack open. */
function stackIndex(index: number): CSSProperties {
  return { "--i": index } as CSSProperties;
}

/**
 * Whether a node has been reached yet.
 *
 * Reveal is one-way on purpose. The brief asked for content to wrap and
 * unwrap as you travel between sections, and it does going down the page, but
 * re-wrapping what you have already read would mean text moving under a
 * reader who scrolls back up, and would put content behind a state again.
 */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [reached, setReached] = useState(false);
  // Read as a store rather than set from an effect: a browser without the
  // observer must never be left looking at content stuck at zero opacity, and
  // deciding that during render is what keeps it out of a state update.
  const observable = useSyncExternalStore(
    subscribeNothing,
    () => "IntersectionObserver" in window,
    () => true,
  );

  useEffect(() => {
    const node = ref.current;
    if (!node || !observable) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setReached(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [observable]);

  return { ref, open: reached || !observable };
}

/** Which node the reader is standing on, for the rail. */
function useActiveSection(ids: string[]): string | null {
  const key = ids.join(",");
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const sectionIds = key.split(",").filter(Boolean);
    const nodes = sectionIds
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => node !== null);

    if (nodes.length === 0 || !("IntersectionObserver" in window)) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        // Document order, so the topmost section in the band wins rather than
        // whichever one happened to fire last.
        const first = sectionIds.find((id) => visible.has(id));
        if (first) setActive(first);
      },
      { rootMargin: "-15% 0px -60% 0px" },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [key]);

  return active;
}

interface SectionMeta {
  id: string;
  label: string;
}

interface PanelProps {
  id: string;
  label: string;
  index: number;
  total: number;
  /** A skill is selected and this section is one of the places it appears. */
  lit: boolean;
  /** No incoming connector: nothing precedes the first node. */
  first?: boolean;
  note?: string;
  children: ReactNode;
}

/**
 * One node on the constellation.
 *
 * Panels are chained by a visible connector running down the left gutter, so
 * the page reads as a figure of linked nodes rather than a stack of blocks.
 * The connector is not decoration: when a skill is selected, the nodes it
 * touches and the segments between them light up, which is the relationship
 * index drawn on the one surface where the whole of it fits at once.
 */
function Panel({
  id,
  label,
  index,
  total,
  lit,
  first,
  note,
  children,
}: PanelProps) {
  const { ref, open } = useReveal<HTMLElement>();

  return (
    <section
      id={id}
      ref={ref}
      aria-labelledby={`${id}-heading`}
      className={classes(
        styles.panel,
        first && styles.panelFirst,
        open && styles.panelOpen,
        lit && styles.panelLit,
      )}
    >
      <div className={styles.panelHead}>
        <h2 id={`${id}-heading`} className={styles.heading}>
          {label}
        </h2>
        {/* A dossier is a numbered file. The sequence is real: it is this
            section's place in the record, and it tells you how much is left. */}
        <span className={styles.index}>
          {String(index + 1).padStart(2, "0")}
          <span className={styles.indexTotal}>
            {" / "}
            {String(total).padStart(2, "0")}
          </span>
        </span>
      </div>
      {note && <p className={styles.note}>{note}</p>}
      <div className={styles.panelBody}>{children}</div>
    </section>
  );
}

export function DossierContent() {
  const {
    person,
    domains,
    experience,
    education,
    skills,
    funProjects,
    archived,
    certifications,
  } = portfolioData;

  const [activeSkillId, setActiveSkillId] = useState<string | null>(null);
  // One at a time: each open globe is its own WebGL context, and there is no
  // reason to hold several places on screen at once.
  const [openPlaceId, setOpenPlaceId] = useState<string | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  const togglePlace = (id: string) =>
    setOpenPlaceId((current) => (current === id ? null : id));

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

  // Only sections that actually have content become nodes, so the rail and the
  // chain can never disagree with what is on the page.
  const sections = useMemo<SectionMeta[]>(() => {
    const all: (SectionMeta | null)[] = [
      { id: "about", label: "About" },
      experience.length > 0 ? { id: "experience", label: "Experience" } : null,
      education.length > 0 ? { id: "education", label: "Education" } : null,
      domains.length > 0 ? { id: "work", label: "Work" } : null,
      skills.length > 0 ? { id: "skills", label: "Skills" } : null,
      funProjects.length > 0 ? { id: "fun", label: "Fun projects" } : null,
      archived.length > 0 ? { id: "earlier", label: "Earlier work" } : null,
      certifications.length > 0
        ? { id: "certifications", label: "Certifications" }
        : null,
    ];
    return all.filter((item): item is SectionMeta => item !== null);
  }, [
    experience,
    education,
    domains,
    skills,
    funProjects,
    archived,
    certifications,
  ]);

  const sectionIds = useMemo(
    () => sections.map((section) => section.id),
    [sections],
  );
  const activeSectionId = useActiveSection(sectionIds);

  /**
   * Which nodes a selected skill touches.
   *
   * Derived from the relationship index rather than written down, so a new
   * project or technology lights the right nodes with no extra wiring.
   */
  const litSections = useMemo(() => {
    const lit = new Set<string>();
    if (!active) return lit;

    const { domainIds, projectIds } = active.relations;
    if (domainIds.length > 0) lit.add("work");
    if (funProjects.some((project) => projectIds.includes(project.id))) {
      lit.add("fun");
    }
    if (
      experience.some((entry) =>
        entry.relatedProjects.some((id) => projectIds.includes(id)),
      )
    ) {
      lit.add("experience");
    }
    lit.add("skills");
    return lit;
  }, [active, experience, funProjects]);

  const panelFor = (id: string) => {
    const index = sections.findIndex((section) => section.id === id);
    const section = sections[index];
    return {
      id,
      label: section?.label ?? id,
      index,
      total: sections.length,
      lit: litSections.has(id),
      first: index === 0,
    };
  };

  return (
    <>
      {/* Settles the scene down behind the sheet. A sibling rather than a
          pseudo-element of .page — see the note in the stylesheet. */}
      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.page}>
      {/* The wrapped state is the CSS default so there is no flash of content
          being hidden on load, which means without JavaScript nothing would
          ever unwrap and this page would be blank. It is the view that has to
          work when everything else does not, so the fallback is explicit. */}
      <noscript>
        <style>{`.${styles.panel},.${styles.card}{opacity:1 !important;transform:none !important}`}</style>
      </noscript>

      {/* Travel rail. Decorative duplication of the chain on the page itself,
          so it is skipped by assistive technology, which already has the
          headings. */}
      <nav className={styles.rail} aria-hidden="true">
        <ol className={styles.railList}>
          {sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className={classes(
                  styles.railNode,
                  activeSectionId === section.id && styles.railNodeActive,
                  litSections.has(section.id) && styles.railNodeLit,
                )}
                tabIndex={-1}
              >
                <span className={styles.railDot} />
                <span className={styles.railLabel}>{section.label}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className={styles.stream}>
        {/* This page can be linked to directly, so it needs to stand on its own
            as a document rather than borrowing the shell header for a title. */}
        <header className={styles.masthead}>
          <p className={styles.kicker}>Dossier</p>
          <h1 className={styles.name}>{person.name}</h1>
          <p className={styles.tagline}>{person.tagline}</p>
        </header>

        <Panel {...panelFor("about")}>
          <p className={styles.bio}>{person.bio}</p>
        </Panel>

        {experience.length > 0 && (
          <Panel {...panelFor("experience")}>
            <ul className={styles.deck}>
              {experience.map((entry, index) => (
                <li
                  key={entry.id}
                  style={stackIndex(index)}
                  className={classes(
                    styles.card,
                    isExperienceMuted(entry.relatedProjects) && styles.muted,
                  )}
                >
                  <div className={styles.cardHead}>
                    <h3 className={styles.cardTitle}>{entry.role}</h3>
                    <p className={styles.cardMeta}>
                      {formatMonth(entry.start)} to{" "}
                      {entry.end ? formatMonth(entry.end) : "Present"}
                    </p>
                  </div>
                  <p className={styles.cardSource}>
                    {entry.institution}
                    {placeSuffix(entry.institution, entry.location)}
                  </p>
                  {entry.location && (
                    <LocationView
                      id={entry.id}
                      location={entry.location}
                      open={openPlaceId === entry.id}
                      reducedMotion={reducedMotion}
                      onToggle={() => togglePlace(entry.id)}
                    />
                  )}
                  <p className={styles.cardSummary}>{entry.summary}</p>
                  {entry.highlights && entry.highlights.length > 0 && (
                    <ul className={styles.highlights}>
                      {entry.highlights.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {education.length > 0 && (
          <Panel {...panelFor("education")}>
            <ul className={styles.deck}>
              {education.map((entry, index) => {
                const placeId = `${entry.institution}-${entry.degree}`;
                return (
                  <li
                    key={placeId}
                    style={stackIndex(index)}
                    className={styles.card}
                  >
                    <div className={styles.cardHead}>
                      <h3 className={styles.cardTitle}>{entry.degree}</h3>
                      <p className={styles.cardMeta}>
                        {formatMonth(entry.start)} to{" "}
                        {entry.end ? formatMonth(entry.end) : "Present"}
                      </p>
                    </div>
                    <p className={styles.cardSource}>
                      {entry.institution}
                      {placeSuffix(entry.institution, entry.location)}
                    </p>
                    {entry.location && (
                      <LocationView
                        id={placeId}
                        location={entry.location}
                        open={openPlaceId === placeId}
                        reducedMotion={reducedMotion}
                        onToggle={() => togglePlace(placeId)}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </Panel>
        )}

        {/* The scene layer is aria-hidden, so this is where domain and project
            names exist for assistive technology and without WebGL. */}
        {domains.length > 0 && (
          <Panel {...panelFor("work")}>
            <div className={styles.deck}>
              {domains.map((domain, index) => (
                <article
                  key={domain.id}
                  style={stackIndex(index)}
                  className={classes(
                    styles.card,
                    styles.domainCard,
                    isDomainMuted(domain.id) && styles.muted,
                  )}
                >
                  <h3 className={styles.cardTitle}>{domain.name}</h3>
                  <p className={styles.cardSummary}>{domain.description}</p>
                  <ul className={styles.subDeck}>
                    {domain.projects.map((project) => (
                      <li
                        key={project.id}
                        className={classes(
                          styles.subCard,
                          isProjectMuted(project.id) && styles.muted,
                        )}
                      >
                        {/* A project with no link yet is still a project: it
                            shows as plain text rather than a dead anchor. */}
                        {project.url ? (
                          <a
                            className={styles.subTitle}
                            href={project.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {project.title}
                          </a>
                        ) : (
                          <span className={styles.subTitle}>
                            {project.title}
                          </span>
                        )}
                        <p className={styles.subSummary}>{project.summary}</p>
                        <ProjectMeta projectId={project.id} />
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </Panel>
        )}

        {skills.length > 0 && (
          <Panel
            {...panelFor("skills")}
            note="Pick one to light up where it appears in the record."
          >
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
          </Panel>
        )}

        {funProjects.length > 0 && (
          <Panel {...panelFor("fun")}>
            <ul className={styles.deck}>
              {funProjects.map((project, index) => (
                <li
                  key={project.id}
                  style={stackIndex(index)}
                  className={classes(
                    styles.card,
                    isProjectMuted(project.id) && styles.muted,
                  )}
                >
                  <a
                    className={styles.subTitle}
                    href={project.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {project.title}
                  </a>
                  <p className={styles.cardSummary}>{project.summary}</p>
                  <ProjectMeta projectId={project.id} />
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {archived.length > 0 && (
          <Panel {...panelFor("earlier")}>
            <ul className={styles.deck}>
              {archived.map((item, index) => (
                <li
                  key={item.id}
                  style={stackIndex(index)}
                  className={classes(styles.card, styles.quietCard)}
                >
                  <div className={styles.cardHead}>
                    <a
                      className={styles.subTitle}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {item.title}
                    </a>
                    <p className={styles.cardMeta}>{item.year}</p>
                  </div>
                  <p className={styles.cardSummary}>{item.summary}</p>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {certifications.length > 0 && (
          <Panel {...panelFor("certifications")}>
            <ul className={styles.certifications}>
              {certifications.map((item) => (
                <li key={item.url}>
                  <a
                    className={styles.certification}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </Panel>
        )}
        </div>
      </div>
    </>
  );
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
