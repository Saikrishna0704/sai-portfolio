/**
 * Presentation configuration for the celestial scene.
 *
 * PROJECT.md §11: semantic relationships live in `portfolio-data.ts`; the
 * coordinates, scale and materials that *express* them live here. Nothing in
 * this file decides what belongs to what — it only decides where things sit.
 *
 * `buildSystem` is a pure function of the domain list, so the whole layout is
 * derived from data rather than hand-placed, and can be exercised with any
 * shape of content without touching a scene component.
 */

import { portfolioData, type Domain } from "@/data/portfolio-data";

/** One consistent world scale for every body in the system. */
export const WORLD = {
  starRadius: 1.5,
  planetRadius: 0.62,
  moonRadius: 0.22,
  /** Radius of the innermost domain orbit. */
  firstOrbitRadius: 5.5,
  /** Minimum gap between neighbouring domain orbits. */
  orbitSpacing: 3,
  /**
   * Smallest distance from a planet's centre to its project moons. Wide enough
   * that a moon's label clears the planet — labels are fixed-size DOM, so this
   * gap has to be read in pixels, not just world units. Domains with many
   * projects widen their own ring beyond this.
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
/** Preferred angular gap between sibling moons around their planet. */
const MOON_SPREAD = 0.9;
/**
 * How far past a moon its label sits, along the moon's radial direction.
 * Sized against the label's own pixel width, not just the moon's radius.
 */
const MOON_LABEL_PUSH = 1.8;
/** Multiple of a moon's diameter to keep clear between neighbouring moons. */
const MOON_CLEARANCE = 1.8;
/** Gap between one planet's moon ring and the next planet's. */
const RING_GAP = 1.2;

export interface MoonLayout {
  projectId: string;
  title: string;
  /** Position relative to the parent planet. */
  position: [number, number, number];
  /**
   * Label position relative to the moon. Pushed outward along the moon's own
   * radial direction rather than simply hung below it: a moon sitting above
   * its planet on screen would otherwise drop its label onto the planet.
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
  /**
   * Starting angle on the orbit. `position` is this angle resolved at rest;
   * ambient motion advances from here (see `motion.ts`).
   */
  orbitAngle: number;
  radius: number;
  color: string;
  moonOrbitRadius: number;
  moons: MoonLayout[];
}

export interface SystemLayout {
  planets: PlanetLayout[];
  /**
   * Radius the camera must frame to keep every body on screen, including the
   * outermost moon ring.
   */
  radius: number;
}

function onOrbit(radius: number, angle: number): [number, number, number] {
  // The system lies in the XZ plane; y is reserved for elevation.
  return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius];
}

/**
 * Angular gap between sibling moons.
 *
 * The preferred fan gap, except that a domain with many projects would fan
 * past a full circle and wrap back onto itself — so the gap collapses to an
 * even distribution once the count demands it.
 */
function moonAngularStep(moonCount: number): number {
  if (moonCount < 2) return 0;
  return Math.min(MOON_SPREAD, (Math.PI * 2) / moonCount);
}

/**
 * How wide a planet's moon ring has to be. Grows with the project count so
 * neighbouring moons never touch, however many a domain accumulates.
 */
function moonRingRadius(moonCount: number): number {
  const step = moonAngularStep(moonCount);
  if (step === 0) return WORLD.moonOrbitRadius;

  // Arc length between adjacent moons is radius * step; solve for the radius
  // that keeps that arc clear of both moons.
  const required = (WORLD.moonRadius * 2 * MOON_CLEARANCE) / step;
  return Math.max(WORLD.moonOrbitRadius, required);
}

/**
 * Builds the whole scene layout from portfolio domains.
 *
 * Pure and total: any number of domains, each with any number of projects,
 * produces a laid-out system with no per-domain configuration.
 */
export function buildSystem(domains: Domain[]): SystemLayout {
  let previousOrbit = 0;
  let previousRing = 0;

  const planets = domains.map((domain, domainIndex) => {
    const moonCount = domain.projects.length;
    const ringRadius = moonRingRadius(moonCount);

    // Each orbit clears the previous planet's ring as well as its own, so a
    // domain that grows a wide ring pushes its neighbours out rather than
    // overlapping them.
    const orbitRadius =
      domainIndex === 0
        ? Math.max(WORLD.firstOrbitRadius, WORLD.starRadius + ringRadius + RING_GAP)
        : previousOrbit +
          Math.max(WORLD.orbitSpacing, previousRing + ringRadius + RING_GAP);

    previousOrbit = orbitRadius;
    previousRing = ringRadius;

    const angle = BASE_ANGLE + domainIndex * GOLDEN_ANGLE;
    const step = moonAngularStep(moonCount);

    const moons: MoonLayout[] = domain.projects.map((project, projectIndex) => {
      // Moons fan around the planet's outward radial direction, so with few
      // projects they sit in the open space away from the star rather than in
      // the crowded gap between planet and centre.
      const moonAngle = angle + (projectIndex - (moonCount - 1) / 2) * step;

      return {
        projectId: project.id,
        title: project.title,
        position: onOrbit(ringRadius, moonAngle),
        // Purely radial: a vertical nudge would drag the label back towards
        // the planet whenever the moon sits above it on screen.
        labelOffset: [
          Math.cos(moonAngle) * MOON_LABEL_PUSH,
          0,
          Math.sin(moonAngle) * MOON_LABEL_PUSH,
        ],
        radius: WORLD.moonRadius,
      };
    });

    // The camera looks down the +Z axis, so a moon at -Z projects *above* its
    // planet on screen. Put the domain label on the other side.
    const meanMoonZ =
      moons.reduce((total, moon) => total + moon.position[2], 0) /
      (moons.length || 1);
    const labelDistance = WORLD.planetRadius + 0.55;

    return {
      domainId: domain.id,
      name: domain.name,
      position: onOrbit(orbitRadius, angle),
      labelOffset: [0, meanMoonZ >= 0 ? labelDistance : -labelDistance, 0],
      orbitRadius,
      orbitAngle: angle,
      radius: WORLD.planetRadius,
      color: DOMAIN_COLORS[domainIndex % DOMAIN_COLORS.length] ?? FALLBACK_COLOR,
      moonOrbitRadius: ringRadius,
      moons,
    } satisfies PlanetLayout;
  });

  // Annotated: WORLD is `as const`, so an unannotated seed narrows the
  // accumulator to the literal 1.5.
  const radius = planets.reduce<number>(
    (widest, planet) =>
      Math.max(widest, planet.orbitRadius + planet.moonOrbitRadius + planet.radius),
    WORLD.starRadius,
  );

  return { planets, radius };
}

const system = buildSystem(portfolioData.domains);

export const planets = system.planets;
export const systemRadius = system.radius;
