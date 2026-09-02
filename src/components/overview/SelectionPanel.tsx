"use client";

import { portfolioData } from "@/data/portfolio-data";
import { skillsForProject } from "@/data/relationships";
import { useSelection } from "@/state/selection";

import styles from "./SelectionPanel.module.css";

/** "3" to "03", so the counters line up in a tabular face. */
function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * What is currently selected, as a card at the right of the frame.
 *
 * This used to be a thin list tucked into the bottom-left corner, where it
 * competed with the identity block and was easy to miss entirely — selecting a
 * planet appeared to do nothing but move the camera. A card that arrives at
 * the right edge is the thing the eye goes to once the camera settles, and it
 * has room to actually say something.
 *
 * It is deliberately the Dossier's paper rather than dark glass. The two views
 * are one product, and making the record surface the same object in both means
 * selecting a body reads as pulling its page out of the file.
 *
 * Nothing renders at the overview: the card is the response to a selection, so
 * with nothing selected there is nothing to answer.
 */
export function SelectionPanel() {
  const { selection, select, setHover, goUp, clearSelection } = useSelection();

  if (selection.kind === "overview") return null;

  const domainIndex = portfolioData.domains.findIndex(
    (item) => item.id === selection.domainId,
  );
  const domain = portfolioData.domains[domainIndex];
  if (!domain) return null;

  const projectIndex =
    selection.kind === "project"
      ? domain.projects.findIndex((item) => item.id === selection.projectId)
      : -1;
  const project = projectIndex >= 0 ? domain.projects[projectIndex] : undefined;

  const skills = project
    ? skillsForProject(project.id)
    : domain.relatedSkills
        .map((id) => portfolioData.skills.find((skill) => skill.id === id))
        .filter((skill): skill is (typeof portfolioData.skills)[number] =>
          Boolean(skill),
        );

  return (
    <aside
      className={styles.panel}
      aria-label={`${project ? project.title : domain.name} detail`}
      /* Keyed so switching selection replays the entrance rather than
         swapping text inside a card that never appears to have moved. */
      key={project ? project.id : domain.id}
    >
      <p className={styles.kicker}>
        <span>{project ? "Project" : "Domain"}</span>
        <span className={styles.counter}>
          {project
            ? `${pad(projectIndex + 1)} / ${pad(domain.projects.length)}`
            : `${pad(domainIndex + 1)} / ${pad(portfolioData.domains.length)}`}
        </span>
      </p>

      <h2 className={styles.title}>{project ? project.title : domain.name}</h2>

      {/* A project keeps its domain visible above it, so the card always says
          where in the system you are standing. */}
      {project && <p className={styles.parent}>in {domain.name}</p>}

      <hr className={styles.rule} />

      <p className={styles.description}>
        {project ? project.summary : domain.description}
      </p>

      {!project && domain.projects.length > 0 && (
        <>
          <p className={styles.label}>Projects</p>
          <ul className={styles.projects}>
            {domain.projects.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={styles.projectName}
                  onClick={() =>
                    select({
                      kind: "project",
                      domainId: domain.id,
                      projectId: item.id,
                    })
                  }
                  onPointerEnter={() =>
                    setHover({ domainId: domain.id, projectId: item.id })
                  }
                  onPointerLeave={() => setHover(null)}
                  onFocus={() =>
                    setHover({ domainId: domain.id, projectId: item.id })
                  }
                  onBlur={() => setHover(null)}
                >
                  {item.title}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {skills.length > 0 && (
        <>
          <p className={styles.label}>
            {project ? "Technologies" : "Supported by"}
          </p>
          <p className={styles.tags}>
            {skills.map((skill) => (
              <span key={skill.id} className={styles.tag}>
                {skill.name}
              </span>
            ))}
          </p>
        </>
      )}

      {project?.url && (
        <a
          className={styles.link}
          href={project.url}
          target="_blank"
          rel="noreferrer"
        >
          Open <span aria-hidden="true">↗</span>
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      )}

      {/* One step back, then all the way out. Both always reachable, so there
          is never a level you can only leave by guessing. */}
      <div className={styles.returns}>
        {project && (
          <button type="button" className={styles.back} onClick={goUp}>
            ← {domain.name}
          </button>
        )}
        <button type="button" className={styles.back} onClick={clearSelection}>
          Back to overview
        </button>
      </div>
    </aside>
  );
}
