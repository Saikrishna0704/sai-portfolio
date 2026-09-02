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
 * Widest total angle the moon fan may cover, in radians (about 109 degrees).
 *
 * Four projects at the preferred gap wrap the fan 155 degrees around the
 * planet, which puts the end moons close to the camera while the middle ones
 * sit far from it. A domain view frames the planet from only a few units away,
 * so that depth difference is enough for perspective to throw the near labels
 * clear off the side of the screen. Capping the span keeps every moon on the
 * outward-facing arc, at roughly one depth, where the fit calculation holds.
 *
 * Domains with more projects tighten the gap rather than widen the arc, and
 * `moonRingRadius` then grows the ring to keep them from touching.
 */
const MOON_FAN_SPAN = 1.9;
/**
 * Extra framing a domain view needs per unit of fan width, as a fraction.
 *
 * A domain is framed from only a few world units away, so the fan is not flat
 * to the camera: the moons at the near end of the arc sit noticeably closer
 * than those at the far end, and perspective pushes their labels outward on
 * screen by more than their world radius accounts for. The fit calculation
 * models the fan as a flat disc, so without this the near label lands past the
 * bottom of the viewport.
 *
 * Empirical rather than derived: the exact magnification depends on the camera
 * distance, which depends on this radius, so solving it properly means solving
 * a fixed point. Scaled by the sine of the half-span so a single moon, which
 * has no depth spread at all, is unaffected.
 */
const FAN_PERSPECTIVE_ALLOWANCE = 0.7;
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

/**
 * A planet's own ring system, as multiples of the body's radius.
 *
 * The outer edge stays well inside `WORLD.moonOrbitRadius` (2.0 against a
 * planet radius of 0.62, so the rings end around 1.55) — the rings must never
 * reach the moons, or a project would look like it was orbiting inside the
 * dust rather than around the domain.
 */
const RING_INNER_SCALE = 1.75;
const RING_OUTER_SCALE = 2.75;
/**
 * Tilt off the orbital plane, in radians.
 *
 * Always the same sign, and larger than feels necessary. The camera sits at a
 * fixed 32 degrees, and a ring left near the orbital plane is foreshortened
 * hard enough that its vertical extent is smaller than the planet's own
 * radius — so it collapses onto the body and reads as scratches across it
 * rather than as a system around it. Tilting the far edge up opens the ellipse
 * until the rings clearly stand off the planet.
 *
 * Alternating the sign was worse: it flattened every other domain to an
 * edge-on line, which is why Inference briefly looked like it had a stick
 * through it.
 */
const RING_TILT_BASE = 0.3;
const RING_TILT_SPREAD = 0.14;

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

/**
 * A domain's ring system (PROJECT.md §3 — supporting technologies/methods).
 *
 * `bands` is the domain's `relatedSkills` count, so the rings state a real
 * quantity rather than decorating. A domain with no declared skills gets no
 * rings at all, which is the honest rendering of nothing to support it.
 */
export interface RingLayout {
  bands: number;
  /** Distance from the planet's centre, in world units. */
  inner: number;
  outer: number;
  /** Tilt off the orbital plane, radians. Varies per domain so the system
   *  does not read as a set of identical stacked discs. */
  tilt: number;
  /** Seeds the per-band brightness variation. */
  seed: number;
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
  /** Null when the domain declares no supporting technologies. */
  rings: RingLayout | null;
  moonOrbitRadius: number;
  /**
   * Radius a camera must frame to show this domain properly: the moon ring
   * plus the distance its labels are pushed beyond it. Framing only the bodies
   * pushes the labels off screen, and the labels are the point.
   */
  focusRadius: number;
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
  return Math.min(
    MOON_SPREAD,
    MOON_FAN_SPAN / (moonCount - 1),
    (Math.PI * 2) / moonCount,
  );
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

    // One band per supporting technology (PROJECT.md §3). Derived, never
    // hand-set: adding a skill to a domain widens its rings by one.
    const bandCount = domain.relatedSkills.length;

    return {
      domainId: domain.id,
      name: domain.name,
      position: onOrbit(orbitRadius, angle),
      labelOffset: [0, meanMoonZ >= 0 ? labelDistance : -labelDistance, 0],
      orbitRadius,
      orbitAngle: angle,
      radius: WORLD.planetRadius,
      color: DOMAIN_COLORS[domainIndex % DOMAIN_COLORS.length] ?? FALLBACK_COLOR,
      rings:
        bandCount > 0
          ? {
              bands: bandCount,
              inner: WORLD.planetRadius * RING_INNER_SCALE,
              outer: WORLD.planetRadius * RING_OUTER_SCALE,
              // One sign, with a stepped spread so no two domains share a
              // tilt and the set does not read as stamped from one template.
              tilt: RING_TILT_BASE + ((domainIndex * 0.052) % RING_TILT_SPREAD),
              seed: domainIndex * 17 + bandCount,
            }
          : null,
      moonOrbitRadius: ringRadius,
      focusRadius:
        moonCount > 0
          ? (ringRadius + MOON_LABEL_REACH) *
            (1 +
              FAN_PERSPECTIVE_ALLOWANCE * Math.sin((step * (moonCount - 1)) / 2))
          : WORLD.planetRadius * 6,
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
