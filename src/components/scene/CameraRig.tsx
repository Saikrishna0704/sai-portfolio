"use client";

import { useThree } from "@react-three/fiber";
import { useLayoutEffect } from "react";
import * as THREE from "three";

import { systemRadius } from "@/scene/layout";

/** Viewing elevation above the orbital plane. Enough tilt to read the orbits
 *  as a system rather than a flat ring, without flattening them to a line. */
const ELEVATION = THREE.MathUtils.degToRad(32);
/** Breathing room between the outermost orbit and the viewport edge. */
const MARGIN = 1.12;

/**
 * Frames the whole system for the current viewport.
 *
 * A fixed camera position cannot serve both a wide desktop window and a narrow
 * portrait one: the system is a disc, so on a tall viewport it has to be framed
 * by width. The camera is solved from the aspect ratio instead, which keeps
 * every body on screen at any size. Bodies get small on portrait — labels are
 * fixed-size DOM and stay readable — and Phase 9 owns the mobile-specific
 * decision of showing fewer bodies instead.
 *
 * This runs once per resize, not per frame.
 */
export function CameraRig() {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);

  useLayoutEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    const aspect = size.width / size.height;
    const halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const halfWidth = halfHeight * aspect;

    // The disc projects to an ellipse: full width, compressed vertically by
    // the viewing elevation.
    const distanceForWidth = systemRadius / halfWidth;
    const distanceForHeight = (systemRadius * Math.sin(ELEVATION)) / halfHeight;
    const distance = Math.max(distanceForWidth, distanceForHeight) * MARGIN;

    camera.position.set(
      0,
      distance * Math.sin(ELEVATION),
      distance * Math.cos(ELEVATION),
    );
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  return null;
}
