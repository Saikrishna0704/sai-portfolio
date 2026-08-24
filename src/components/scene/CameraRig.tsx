"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { MathUtils, PerspectiveCamera, Vector3 } from "three";

import { MOON_LABEL_REACH, planets, systemRadius } from "@/scene/layout";
import { moonFanRotation, planetAngleAt } from "@/scene/motion";
import type { Selection } from "@/state/selection";

import { markSceneArrived } from "./arrivalState";

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
 * How far out the camera starts when the opening is playing, as a multiple of
 * its resting distance.
 *
 * Far enough that closing the gap is a journey rather than a nudge: the
 * starfield sits at a fixed radius, so covering this much ground drags the
 * stars past in parallax and the system grows from a speck. Held here in the
 * dark until the opening lifts, so none of it is spent unseen.
 */
const CINEMATIC_PULLBACK = 4.6;
/** The same idea at ordinary scale, for a load with no opening in front of it:
 *  enough that the system settles rather than appearing already arrived. */
const ARRIVAL_PULLBACK = 1.85;
/**
 * Ceiling on that starting distance, in world units.
 *
 * The multiplier alone does not survive a change of aspect ratio: framing the
 * whole system on a narrow phone already puts the camera around 110 units out,
 * and multiplying *that* would start the shot beyond both the starfield shell
 * and the far plane. The clamp keeps the approach inside the stars, at the cost
 * of a shorter dolly on portrait screens — which is why the arrival also
 * changes elevation, since that reads at any distance.
 */
const ARRIVAL_MAX_DISTANCE = 130;
/** Elevation the approach begins from: nearly edge-on, so the system resolves
 *  from a line into a disc as the camera climbs. */
const ARRIVAL_ELEVATION = MathUtils.degToRad(4);
/**
 * Damping for the cinematic approach. Much slower than ordinary navigation: it
 * should read as coasting in under momentum, not as a camera move.
 */
const CINEMATIC_LAMBDA = 1.1;
/**
 * Within this fraction of the resting distance, the arrival is over.
 *
 * Deliberately loose. Exponential damping has a long, flat tail, and holding on
 * for the last couple of percent buys seconds of movement too small to see
 * while the labels are still waiting on it.
 */
const ARRIVAL_SETTLED = 0.06;

/**
 * How far the pointer can lean the camera, in radians.
 *
 * A fraction of a degree of orbit per screen-width of pointer travel — enough
 * that the system answers the hand and the starfield slides in parallax,
 * far too little to disturb framing or navigation. The scene responding to
 * attention is what separates a live space from a rendered picture.
 */
const PARALLAX_AZIMUTH = MathUtils.degToRad(2.2);
const PARALLAX_ELEVATION = MathUtils.degToRad(1.6);
/** Damping for the lean: looser than navigation, so it trails the pointer
 *  like something heavy rather than tracking it rigidly. */
const PARALLAX_LAMBDA = 2.2;

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
  /** False while the opening still covers the screen. */
  mayArrive: boolean;
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
export function CameraRig({
  selection,
  reducedMotion,
  mayArrive,
}: CameraRigProps) {
  const camera = useThree((state) => state.camera);

  const focus = useRef(new Vector3());
  const desiredFocus = useRef(new Vector3());
  const azimuth = useRef(OVERVIEW_AZIMUTH);
  const distance = useRef(0);
  const elevation = useRef(ELEVATION);
  const initialised = useRef(false);
  const arriving = useRef(true);
  // Decided once, at the first frame: the long approach is the opening's, not
  // something to sit through on every reload.
  const cinematic = useRef(false);

  // Where the pointer is leaning the view, and where it currently wants to.
  // Mouse-only by construction: touch fires no pointermove while idle, so on
  // touch devices both stay zero and the rig behaves exactly as before.
  const leanTarget = useRef({ x: 0, y: 0 });
  const lean = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (reducedMotion) return;

    const handleMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      // Normalised to [-1, 1] from screen centre.
      leanTarget.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      leanTarget.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    return () => window.removeEventListener("pointermove", handleMove);
  }, [reducedMotion]);

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
            // The moon fan rotates with the orbit, so the layout offset has to
            // be turned by the same angle before it is added. Reading the
            // static offset instead is what once sent the camera to empty
            // space when a group rotated underneath it.
            const fan = moonFanRotation(planet, elapsed, reducedMotion);
            const cos = Math.cos(fan);
            const sin = Math.sin(fan);
            const [dx, , dz] = moon.position;
            target.x += dx * cos - dz * sin;
            target.z += dz * cos + dx * sin;
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
      arriving.current = !reducedMotion;
      // mayArrive is false only while the opening covers the screen, so this is
      // exactly the case where the approach has an audience waiting for it.
      cinematic.current = !reducedMotion && !mayArrive;

      // Aim correctly straight away, so the arrival is an approach rather than
      // a swing, but start further out and let the damping close the distance.
      focus.current.copy(target);
      azimuth.current = desiredAzimuth;
      distance.current = reducedMotion
        ? desiredDistance
        : Math.max(
            desiredDistance,
            Math.min(
              desiredDistance *
                (cinematic.current ? CINEMATIC_PULLBACK : ARRIVAL_PULLBACK),
              ARRIVAL_MAX_DISTANCE,
            ),
          );
      elevation.current = cinematic.current ? ARRIVAL_ELEVATION : ELEVATION;

      // Nothing worth hiding on an ordinary load, so the DOM layer is told the
      // system is in place straight away.
      if (!cinematic.current) markSceneArrived();
    } else if (arriving.current && !mayArrive) {
      // Hold out in the dark. Aim keeps tracking so the moment the veil lifts
      // the camera is already pointed at the right thing, but the distance
      // does not close where nobody can watch it.
      focus.current.copy(target);
      azimuth.current = desiredAzimuth;
    } else {
      // Frame-rate independent, so a transition takes the same time at 30fps
      // as at 120. Reduced motion snaps instead of gliding.
      const lambda =
        arriving.current && cinematic.current ? CINEMATIC_LAMBDA : LAMBDA;
      const t = reducedMotion ? 1 : 1 - Math.exp(-lambda * delta);

      focus.current.lerp(target, t);
      distance.current += (desiredDistance - distance.current) * t;
      azimuth.current += wrapAngle(desiredAzimuth - azimuth.current) * t;
      elevation.current += (ELEVATION - elevation.current) * t;

      if (
        arriving.current &&
        Math.abs(distance.current - desiredDistance) <
          desiredDistance * ARRIVAL_SETTLED
      ) {
        // Hand back to the ordinary damping, so selecting a domain from here
        // moves at navigation speed rather than at arrival speed.
        arriving.current = false;
        markSceneArrived();
      }
    }

    // The pointer's lean, damped separately so it drifts after the hand.
    // Held out of the opening approach — that shot belongs to the camera —
    // and inert under reduced motion and on touch, where the target is zero.
    const leanT = 1 - Math.exp(-PARALLAX_LAMBDA * delta);
    lean.current.x += (leanTarget.current.x - lean.current.x) * leanT;
    lean.current.y += (leanTarget.current.y - lean.current.y) * leanT;
    const leanActive = !reducedMotion && !arriving.current;
    const viewAzimuth =
      azimuth.current + (leanActive ? lean.current.x * PARALLAX_AZIMUTH : 0);
    const viewElevation =
      elevation.current + (leanActive ? -lean.current.y * PARALLAX_ELEVATION : 0);

    // Elevation is the resting angle for everything except the first approach,
    // which climbs into it.
    const horizontalReach = Math.cos(viewElevation) * distance.current;
    camera.position.set(
      focus.current.x + Math.cos(viewAzimuth) * horizontalReach,
      focus.current.y + Math.sin(viewElevation) * distance.current,
      focus.current.z + Math.sin(viewAzimuth) * horizontalReach,
    );
    camera.lookAt(focus.current);
  });

  return null;
}
