"use client";

import { portfolioData } from "@/data/portfolio-data";
import { skillsForProject } from "@/data/relationships";
import { useSelection } from "@/state/selection";

import styles from "./SelectionPanel.module.css";

/**
 * What is currently selected, in readable DOM.
 *
 * Nothing renders at the overview: the canvas stays empty until someone picks
 * a domain. The panel is the only thing that appears over the scene, and it
 * carries the return paths so there is always a way back out.
 */
export function SelectionPanel() {
  const { selection, select, setHover, goUp, clearSelection } = useSelection();

  if (selection.kind === "overview") return null;

  const domain = portfolioData.domains.find(
    (item) => item.id === selection.domainId,
  );
  if (!domain) return null;

  const project =
    selection.kind === "project"
      ? domain.projects.find((item) => item.id === selection.projectId)
      : undefined;

  return (
    <aside className={styles.panel} aria-label={`${domain.name} detail`}>
      <h2 className={styles.title}>{domain.name}</h2>
      <p className={styles.description}>{domain.description}</p>

      <ul className={styles.projects}>
        {domain.projects.map((item) => {
          const isSelected = project?.id === item.id;

          return (
            <li key={item.id} className={styles.project}>
              <button
                type="button"
                className={styles.projectName}
                aria-pressed={isSelected}
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

              {isSelected && (
                <>
                  <p className={styles.summary}>{item.summary}</p>
                  <p className={styles.tags}>
                    {skillsForProject(item.id).map((skill) => (
                      <span key={skill.id} className={styles.tag}>
                        {skill.name}
                      </span>
                    ))}
                  </p>
                  <a
                    className={styles.link}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open ↗
                  </a>
                </>
              )}
            </li>
          );
        })}
      </ul>

      {/* One step back, then all the way out. Both always reachable, so there
          is never a level you can only leave by guessing. */}
      <div className={styles.returns}>
        {selection.kind === "project" && (
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
