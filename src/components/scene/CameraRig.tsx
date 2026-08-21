"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { MathUtils, PerspectiveCamera, Vector3 } from "three";

import { MOON_LABEL_REACH, planets, systemRadius } from "@/scene/layout";
import { planetAngleAt } from "@/scene/motion";
import type { Selection } from "@/state/selection";

/** Viewing elevation above the orbital plane, held constant at every level so
 *  the system always reads as a disc seen from the same angle. */
const ELEVATION = MathUtils.degToRad(32);
/** Breathing room between what is being framed and the viewport edge. */
const MARGIN = 1.12;
/** Where the camera sits when nothing is selected: on +Z, as in Phase 1. */
const OVERVIEW_AZIMUTH = Math.PI / 2;
/**
 * Focused views are taken from off the radial axis.
 *
 * Moons fan around their planet's outward direction (Phase 2), so a camera
 * sitting directly outward looks straight down the planet→moon axis and the
 * moons hide behind their planet — the opposite of what a domain view is for.
 * Swinging round puts the moon ring side-on and keeps the star in frame for
 * context, while staying far enough off the star–planet line that the star
 * never sits behind the subject.
 */
const FOCUS_AZIMUTH_OFFSET = MathUtils.degToRad(58);
/** Extra world units beyond a domain's own focus radius, so it never sits
 *  hard against the viewport edge. */
const DOMAIN_PADDING = 0.6;
/** What a focused project frames: far enough out to keep the moon's label on
 *  screen, which also leaves its planet visible for context. */
const PROJECT_FRAME_RADIUS = MOON_LABEL_REACH + 0.8;
/** Damping rate. Roughly a second to settle: brief, but not a cut. */
const LAMBDA = 2.8;
/**
 * How far out the camera starts on first load, as a multiple of its resting
 * distance. The system then settles into place instead of appearing already
 * arrived, which is the difference between the page opening and the page
 * simply being there.
 */
const ARRIVAL_PULLBACK = 1.85;

/** Wraps an angle into [-PI, PI] so damping always takes the short way round. */
function wrapAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

/**
 * Distance needed to frame something of a given radius.
 *
 * `verticalExtent` is how much of that radius is actually spent vertically on
 * screen: a disc lying in the orbital plane is compressed by the viewing
 * elevation, while a body is as tall as it is wide.
 */
function fitDistance(
  radius: number,
  fovDegrees: number,
  aspect: number,
  verticalExtent: number,
): number {
  const halfHeight = Math.tan(MathUtils.degToRad(fovDegrees) / 2);
  const halfWidth = halfHeight * aspect;
  return (
    Math.max(radius / halfWidth, (radius * verticalExtent) / halfHeight) * MARGIN
  );
}

interface CameraRigProps {
  selection: Selection;
  reducedMotion: boolean;
}

/**
 * Drives the camera for overview → domain → project.
 *
 * The camera is described as a focus point plus an orbit around it — azimuth,
 * a fixed elevation, and a distance — rather than as a position. Two reasons:
 *
 * 1. Damping a *position* between two points draws a straight line between
 *    them, and for a domain on the far side of the system that line passes
 *    through the star. Damping the azimuth arcs the camera around instead.
 * 2. The azimuth always points radially outward from the star through whatever
 *    is focused, so the star is never between the camera and its subject.
 *
 * Everything is recomputed from the current selection every frame and damped
 * towards it, so there is no transition to interrupt: changing selection
 * mid-flight simply re-targets. Repeated interaction cannot corrupt state
 * because there is no state to corrupt beyond the camera's own position.
 */
export function CameraRig({ selection, reducedMotion }: CameraRigProps) {
  const camera = useThree((state) => state.camera);

  const focus = useRef(new Vector3());
  const desiredFocus = useRef(new Vector3());
  const azimuth = useRef(OVERVIEW_AZIMUTH);
  const distance = useRef(0);
  const initialised = useRef(false);

  useFrame((state, delta) => {
    if (!(camera instanceof PerspectiveCamera)) return;

    const elapsed = state.clock.elapsedTime;
    const target = desiredFocus.current;

    target.set(0, 0, 0);
    let radius = systemRadius;
    let verticalExtent = Math.sin(ELEVATION);

    if (selection.kind !== "overview") {
      const planet = planets.find((item) => item.domainId === selection.domainId);

      if (planet) {
        // Recomputed from the same function the planet uses, so the camera
        // cannot lag a frame behind the body it is following.
        const angle = planetAngleAt(planet, elapsed, reducedMotion);
        target.set(
          Math.cos(angle) * planet.orbitRadius,
          0,
          Math.sin(angle) * planet.orbitRadius,
        );
        radius = planet.focusRadius + DOMAIN_PADDING;

        if (selection.kind === "project") {
          const moon = planet.moons.find(
            (item) => item.projectId === selection.projectId,
          );
          if (moon) {
            // Moon offsets are fixed in world space (Phase 3), so the moon's
            // position is just the planet's plus its offset.
            target.x += moon.position[0];
            target.z += moon.position[2];
            radius = PROJECT_FRAME_RADIUS;
            verticalExtent = 1;
          }
        }
      }
    }

    const aspect = state.size.width / state.size.height;
    const desiredDistance = fitDistance(radius, camera.fov, aspect, verticalExtent);

    // Outward from the star through whatever is focused, swung off the radial
    // axis so the moon ring is seen side-on rather than end-on.
    const horizontal = Math.hypot(target.x, target.z);
    const desiredAzimuth =
      horizontal > 0.001
        ? Math.atan2(target.z, target.x) + FOCUS_AZIMUTH_OFFSET
        : OVERVIEW_AZIMUTH;

    if (!initialised.current) {
      initialised.current = true;
      // Aim correctly straight away, so the arrival is a approach rather than
      // a swing, but start further out and let the damping close the distance.
      focus.current.copy(target);
      azimuth.current = desiredAzimuth;
      distance.current = reducedMotion
        ? desiredDistance
        : desiredDistance * ARRIVAL_PULLBACK;
    } else {
      // Frame-rate independent, so a transition takes the same time at 30fps
      // as at 120. Reduced motion snaps instead of gliding.
      const t = reducedMotion ? 1 : 1 - Math.exp(-LAMBDA * delta);

      focus.current.lerp(target, t);
      distance.current += (desiredDistance - distance.current) * t;
      azimuth.current += wrapAngle(desiredAzimuth - azimuth.current) * t;
    }

    const horizontalReach = Math.cos(ELEVATION) * distance.current;
    camera.position.set(
      focus.current.x + Math.cos(azimuth.current) * horizontalReach,
      focus.current.y + Math.sin(ELEVATION) * distance.current,
      focus.current.z + Math.sin(azimuth.current) * horizontalReach,
    );
    camera.lookAt(focus.current);
  });

  return null;
}
