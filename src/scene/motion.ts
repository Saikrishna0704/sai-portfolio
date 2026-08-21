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

/** Sky drift, radians per second — an order of magnitude below the planets. */
export const STARFIELD_DRIFT_SPEED = 0.0012;
