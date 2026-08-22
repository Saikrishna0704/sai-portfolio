/**
 * Ambient motion rates for the celestial scene.
 *
 * Kept separate from `layout.ts`: layout decides where a body sits, this
 * decides how it drifts. Every rate here is deliberately slow — PROJECT.md §5
 * asks for motion that reads as life, not as spectacle.
 *
 * All motion is derived from absolute elapsed time rather than accumulated
 * per-frame deltas, so nothing drifts out of position over a long session and
 * a dropped frame cannot leave the system permanently offset.
 */

import { WORLD, type PlanetLayout } from "./layout";

/** Seconds for a planet on the innermost domain orbit to travel once around. */
const INNER_ORBIT_PERIOD = 300;

/**
 * Angular speed for a domain orbit, in radians per second.
 *
 * Falls off with radius the way a real system does, so outer domains drift
 * more slowly than inner ones. The exponent is Kepler's 3/2; the effect at
 * these speeds is a gentle differential, not an astronomy lesson.
 */
export function orbitAngularSpeed(orbitRadius: number): number {
  const base = (Math.PI * 2) / INNER_ORBIT_PERIOD;
  return base * (WORLD.firstOrbitRadius / orbitRadius) ** 1.5;
}

/**
 * Where a planet is on its orbit at a given moment.
 *
 * Shared by the planet itself and by the camera that follows it — the camera
 * has to agree exactly with where the body is drawn, and recomputing from the
 * same function is more reliable than reading a ref that may be a frame stale.
 */
export function planetAngleAt(
  planet: PlanetLayout,
  elapsed: number,
  reducedMotion: boolean,
): number {
  if (reducedMotion) return planet.orbitAngle;
  return planet.orbitAngle + elapsed * orbitAngularSpeed(planet.orbitRadius);
}

/**
 * How far a planet's moon fan has swung from where it was laid out.
 *
 * Moons are placed around the planet's *initial* outward direction, but the
 * planet then travels along its orbit. Leaving the fan where it started means
 * it slowly points somewhere else entirely: with several projects the fan is
 * wide, and one of its labels eventually swings across the star, where dark
 * text on a bright surface cannot be read.
 *
 * Rotating the fan by this angle keeps it pointing outward for good. Shared by
 * the planet that draws the moons and the camera that flies to them, for the
 * same reason `planetAngleAt` is shared: the two must not disagree about where
 * a moon is, or the camera frames empty space.
 */
export function moonFanRotation(
  planet: PlanetLayout,
  elapsed: number,
  reducedMotion: boolean,
): number {
  return planetAngleAt(planet, elapsed, reducedMotion) - planet.orbitAngle;
}

/** Axial spin, radians per second. */
export const PLANET_SPIN_SPEED = 0.06;

/** Sky drift, radians per second — an order of magnitude below the planets. */
export const STARFIELD_DRIFT_SPEED = 0.0012;
