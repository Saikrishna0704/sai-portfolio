"use client";

import { portfolioData } from "@/data/portfolio-data";
import { minorBodies, minorBodyById } from "@/data/relationships";
import { useSelection } from "@/state/selection";

import styles from "./DomainNav.module.css";

/**
 * Conventional navigation for the overview (PROJECT.md §4).
 *
 * This is the reliable path to every domain and project: real buttons, so
 * keyboard focus and activation work, and full-width targets that do not
 * depend on hitting a body that is only a few pixels across once the system is
 * framed on a small screen. The 3D bodies are a second, direct-manipulation
 * route to the same state, never the only one.
 *
 * Hovering an entry previews it in the scene, so the two views stay legible as
 * the same thing.
 */
export function DomainNav() {
  const { selection, activeDomainId, select, setHover, goUp, clearSelection } =
    useSelection();

  const activeDomain = portfolioData.domains.find(
    (domain) => domain.id === activeDomainId,
  );
  const selectedDomain =
    selection.kind === "domain" || selection.kind === "project"
      ? activeDomain
      : undefined;

  const selectedAsteroid =
    selection.kind === "asteroid" ? minorBodyById(selection.asteroidId) : undefined;

  return (
    <nav className={styles.nav} aria-label="Work domains">
      <ul className={styles.domains}>
        {portfolioData.domains.map((domain) => {
          const isSelected =
            (selection.kind === "domain" || selection.kind === "project") &&
            selection.domainId === domain.id;

          return (
            <li key={domain.id}>
              <button
                type="button"
                className={styles.domain}
                aria-pressed={isSelected}
                onClick={() => select({ kind: "domain", domainId: domain.id })}
                onPointerEnter={() => setHover({ domainId: domain.id })}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover({ domainId: domain.id })}
                onBlur={() => setHover(null)}
              >
                {domain.name}
                <span className={styles.count}>
                  {domain.projects.length}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* The belt, reachable without hunting for a few pixels of rock. Kept
          visually quiet: these are the least important bodies in the system. */}
      {minorBodies.length > 0 && (
        <ul className={styles.minor}>
          {minorBodies.map((body) => {
            const isSelected =
              selection.kind === "asteroid" && selection.asteroidId === body.id;

            return (
              <li key={body.id}>
                <button
                  type="button"
                  className={styles.minorButton}
                  aria-pressed={isSelected}
                  onClick={() =>
                    select({ kind: "asteroid", asteroidId: body.id })
                  }
                >
                  {body.title}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selectedAsteroid && (
        <div className={styles.detail}>
          <h2 className={styles.minorTitle}>{selectedAsteroid.title}</h2>
          <p className={styles.description}>{selectedAsteroid.summary}</p>
          <a
            className={styles.link}
            href={selectedAsteroid.url}
            target="_blank"
            rel="noreferrer"
          >
            Open ↗
          </a>
          <div className={styles.returns}>
            <button
              type="button"
              className={styles.back}
              onClick={clearSelection}
            >
              Back to overview
            </button>
          </div>
        </div>
      )}

      {selectedDomain && (
        <div className={styles.detail}>
          <p className={styles.description}>{selectedDomain.description}</p>

          <ul className={styles.projects}>
            {selectedDomain.projects.map((project) => {
              const isSelected =
                selection.kind === "project" && selection.projectId === project.id;

              return (
                <li key={project.id} className={styles.project}>
                  <button
                    type="button"
                    className={styles.projectName}
                    aria-pressed={isSelected}
                    onClick={() =>
                      select({
                        kind: "project",
                        domainId: selectedDomain.id,
                        projectId: project.id,
                      })
                    }
                    onPointerEnter={() =>
                      setHover({
                        domainId: selectedDomain.id,
                        projectId: project.id,
                      })
                    }
                    onPointerLeave={() => setHover(null)}
                    onFocus={() =>
                      setHover({
                        domainId: selectedDomain.id,
                        projectId: project.id,
                      })
                    }
                    onBlur={() => setHover(null)}
                  >
                    {project.title}
                  </button>

                  {isSelected && (
                    <>
                      <p className={styles.summary}>{project.summary}</p>
                      <a
                        className={styles.link}
                        href={project.url}
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

          {/* One step back, then all the way out. Both are always reachable,
              so there is never a level you can only leave by guessing. */}
          <div className={styles.returns}>
            {selection.kind === "project" && (
              <button type="button" className={styles.back} onClick={goUp}>
                ← {selectedDomain.name}
              </button>
            )}
            <button
              type="button"
              className={styles.back}
              onClick={clearSelection}
            >
              Back to overview
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
