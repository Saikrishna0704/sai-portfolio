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

/** Axial spin, radians per second. */
export const PLANET_SPIN_SPEED = 0.06;

/**
 * Belt drift, radians per second. Slower than the outermost planet, which is
 * both what a wider orbit implies and what keeps the edge of the system from
 * pulling attention.
 */
export const ASTEROID_DRIFT_SPEED = 0.008;

/**
 * How far the belt has turned at a given moment.
 *
 * The belt rotates as one group, so an asteroid's layout position is not where
 * it actually is. Shared by the belt and by the camera that flies to it, for
 * the same reason `planetAngleAt` is: a camera aiming at a stale position
 * arrives at empty space.
 */
export function beltRotationAt(
  elapsed: number,
  reducedMotion: boolean,
): number {
  return reducedMotion ? 0 : elapsed * ASTEROID_DRIFT_SPEED;
}

/** Sky drift, radians per second — an order of magnitude below the planets. */
export const STARFIELD_DRIFT_SPEED = 0.0012;
