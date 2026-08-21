/**
 * Presentation configuration for the celestial scene.
 *
 * PROJECT.md §11: semantic relationships live in `portfolio-data.ts`; the
 * coordinates, scale and materials that *express* them live here. Nothing in
 * this file decides what belongs to what — it only decides where things sit.
 *
 * Placement is derived procedurally from data order, so adding a domain or a
 * project produces a sensible layout with no new scene code.
 */

import { portfolioData } from "@/data/portfolio-data";

/** One consistent world scale for every body in the system. */
export const WORLD = {
  starRadius: 1.5,
  planetRadius: 0.62,
  moonRadius: 0.22,
  /** Radius of the innermost domain orbit. */
  firstOrbitRadius: 5.5,
  /** Added for each subsequent domain. */
  orbitSpacing: 3,
  /**
   * Distance from a planet's centre to its project moons. Wide enough that a
   * moon's label clears the planet — labels are fixed-size DOM, so this gap
   * has to be read in pixels, not just world units.
   */
  moonOrbitRadius: 2,
} as const;

/**
 * Restrained, desaturated body colours (PROJECT.md §8 — no neon).
 * Indexed by domain order; colour distinguishes domains, it does not rank them.
 */
const DOMAIN_COLORS = ["#8fa8c8", "#c3a37a", "#93b3a4", "#a89bb5"] as const;
const FALLBACK_COLOR = "#9aa4b2";

export const STAR_COLOR = "#ffd7a3";
export const MOON_COLOR = "#a6aebb";
export const ORBIT_COLOR = "#8fa3c0";

/**
 * Golden-angle spacing keeps any number of bodies visually separated without a
 * hand-tuned angle per domain.
 */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
/** Rotates the whole system so the first domain does not sit dead-centre. */
const BASE_ANGLE = 0.6;
/** Angular gap between sibling moons around their planet. */
const MOON_SPREAD = 0.9;
/**
 * How far past a moon its label sits, along the moon's radial direction.
 * Sized against the label's own pixel width, not just the moon's radius.
 */
const MOON_LABEL_PUSH = 1.8;

export interface MoonLayout {
  projectId: string;
  title: string;
  /** Position relative to the parent planet. */
  position: [number, number, number];
  /**
   * Label position relative to the moon. Pushed further out along the moon's
   * own radial direction rather than simply hung below it: a moon sitting
   * above its planet on screen would otherwise drop its label onto the planet.
   */
  labelOffset: [number, number, number];
  radius: number;
}

export interface PlanetLayout {
  domainId: string;
  name: string;
  position: [number, number, number];
  /**
   * Label position relative to the planet, placed on the opposite screen side
   * from its moons so the domain label never collides with a project label.
   */
  labelOffset: [number, number, number];
  orbitRadius: number;
  radius: number;
  color: string;
  moonOrbitRadius: number;
  moons: MoonLayout[];
}

function onOrbit(radius: number, angle: number): [number, number, number] {
  // The system lies in the XZ plane; y is reserved for elevation.
  return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius];
}

export const planets: PlanetLayout[] = portfolioData.domains.map(
  (domain, domainIndex) => {
    const orbitRadius =
      WORLD.firstOrbitRadius + domainIndex * WORLD.orbitSpacing;
    const angle = BASE_ANGLE + domainIndex * GOLDEN_ANGLE;

    const moons: MoonLayout[] = domain.projects.map(
      (project, projectIndex) => {
        // Moons are spread around the planet's outward radial direction, so
        // they sit in the open space away from the star rather than in the
        // crowded gap between planet and centre.
        const moonAngle =
          angle + (projectIndex - (domain.projects.length - 1) / 2) * MOON_SPREAD;

        return {
          projectId: project.id,
          title: project.title,
          position: onOrbit(WORLD.moonOrbitRadius, moonAngle),
          // Purely radial: a vertical nudge would drag the label back towards
          // the planet whenever the moon sits above it on screen.
          labelOffset: [
            Math.cos(moonAngle) * MOON_LABEL_PUSH,
            0,
            Math.sin(moonAngle) * MOON_LABEL_PUSH,
          ],
          radius: WORLD.moonRadius,
        };
      },
    );

    // The camera looks down the +Z axis, so a moon at -Z projects *above* its
    // planet on screen. Put the domain label on the other side.
    const meanMoonZ =
      moons.reduce((total, moon) => total + moon.position[2], 0) /
      (moons.length || 1);
    const labelAbove = meanMoonZ >= 0;
    const labelDistance = WORLD.planetRadius + 0.55;

    return {
      domainId: domain.id,
      name: domain.name,
      position: onOrbit(orbitRadius, angle),
      labelOffset: [0, labelAbove ? labelDistance : -labelDistance, 0],
      orbitRadius,
      radius: WORLD.planetRadius,
      color: DOMAIN_COLORS[domainIndex % DOMAIN_COLORS.length] ?? FALLBACK_COLOR,
      moonOrbitRadius: WORLD.moonOrbitRadius,
      moons,
    };
  },
);

/**
 * Radius the camera must frame to keep the whole system on screen, including
 * the outermost moon orbit.
 */
export const systemRadius =
  (planets.at(-1)?.orbitRadius ?? WORLD.firstOrbitRadius) +
  WORLD.moonOrbitRadius +
  WORLD.planetRadius;
