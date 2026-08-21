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
  /** Minor bodies: smaller than a project moon, because they are minor. */
  asteroidRadius: 0.13,
  /** Clearance between the outermost domain and the asteroid belt. */
  beltGap: 2.6,
  /** How far asteroids scatter either side of the belt's mean radius. */
  beltSpread: 1.1,
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
/** How far a moon's label reaches past its planet's moon ring. */
export const MOON_LABEL_REACH = MOON_LABEL_PUSH + WORLD.moonRadius;
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
  /**
   * Radius a camera must frame to show this domain properly: the moon ring
   * plus the distance its labels are pushed beyond it. Framing only the bodies
   * pushes the labels off screen, and the labels are the point.
   */
  focusRadius: number;
  moons: MoonLayout[];
}

/**
 * A minor body out past the domains: a side project or archived work.
 *
 * PROJECT.md §3 reserves asteroids for "smaller prototypes, experiments, or
 * archived work". Keeping them in an outer belt is the placement doing the
 * talking: present and reachable, but plainly at the edge of the system rather
 * than competing with the domains.
 */
export interface AsteroidLayout {
  /** Project id or archived object id, so content can be looked up by it. */
  id: string;
  position: [number, number, number];
  radius: number;
}

export interface SystemLayout {
  planets: PlanetLayout[];
  asteroids: AsteroidLayout[];
  /**
   * Radius the camera must frame to keep every body on screen, including the
   * outermost moon ring and the asteroid belt.
   */
  radius: number;
  /**
   * The same, ignoring the belt. Framing the belt costs roughly a quarter of
   * every body's on-screen size, which is not a trade worth making on a screen
   * where the bodies are already small (PROJECT.md §12: mobile may show fewer
   * bodies).
   */
  coreRadius: number;
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
/**
 * Scatters minor bodies around an outer belt.
 *
 * Golden-angle spacing again, plus a deterministic wobble in radius and
 * elevation so the belt reads as a scattered field rather than a ring of
 * evenly spaced beads. Deterministic because the layout must be identical on
 * every render; a random scatter would move the bodies under the camera.
 */
function buildAsteroids(ids: string[], innerEdge: number): AsteroidLayout[] {
  return ids.map((id, index) => {
    const angle = BASE_ANGLE + (index + 0.5) * GOLDEN_ANGLE;
    // Two incommensurate frequencies, so the wobble never repeats over the
    // handful of bodies a belt actually holds.
    const radial = Math.sin(index * 2.399) * WORLD.beltSpread;
    const elevation = Math.cos(index * 1.618) * WORLD.beltSpread * 0.35;

    return {
      id,
      position: [
        Math.cos(angle) * (innerEdge + radial),
        elevation,
        Math.sin(angle) * (innerEdge + radial),
      ],
      radius: WORLD.asteroidRadius,
    };
  });
}

export function buildSystem(
  domains: Domain[],
  minorBodyIds: string[] = [],
): SystemLayout {
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
      focusRadius:
        moonCount > 0 ? ringRadius + MOON_LABEL_REACH : WORLD.planetRadius * 6,
      moons,
    } satisfies PlanetLayout;
  });

  // Annotated: WORLD is `as const`, so an unannotated seed narrows the
  // accumulator to the literal 1.5.
  const planetsRadius = planets.reduce<number>(
    (widest, planet) =>
      Math.max(widest, planet.orbitRadius + planet.moonOrbitRadius + planet.radius),
    WORLD.starRadius,
  );

  const asteroids = buildAsteroids(
    minorBodyIds,
    planetsRadius + WORLD.beltGap + WORLD.beltSpread,
  );

  const radius = asteroids.reduce<number>(
    (widest, asteroid) =>
      Math.max(
        widest,
        Math.hypot(asteroid.position[0], asteroid.position[2]) + asteroid.radius,
      ),
    planetsRadius,
  );

  return { planets, asteroids, radius, coreRadius: planetsRadius };
}

/**
 * Side projects and archived work, in that order: built for their own sake
 * first, then the older material furthest out.
 */
const minorBodyIds = [
  ...portfolioData.funProjects.map((project) => project.id),
  ...portfolioData.archived.map((item) => item.id),
];

const system = buildSystem(portfolioData.domains, minorBodyIds);

export const planets = system.planets;
export const asteroids = system.asteroids;
export const systemRadius = system.radius;
export const coreRadius = system.coreRadius;
