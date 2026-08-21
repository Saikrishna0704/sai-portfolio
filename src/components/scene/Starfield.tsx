"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

const STAR_COUNT = 1400;
const INNER_RADIUS = 90;
const OUTER_RADIUS = 150;

/** Deterministic PRNG so the sky is identical on every mount. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Background sky: a single points cloud on a distant shell.
 *
 * Deliberately plain — one draw call, no textures, no motion (Phase 3 owns
 * drift). Brightness varies per star so the field reads as depth rather than
 * as uniform noise.
 */
export function Starfield() {
  const geometry = useMemo(() => {
    const random = mulberry32(20260820);
    const positions = new Float32Array(STAR_COUNT * 3);
    const colors = new Float32Array(STAR_COUNT * 3);

    for (let i = 0; i < STAR_COUNT; i += 1) {
      // Even distribution over the sphere, not clustered at the poles.
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      const radius = INNER_RADIUS + random() * (OUTER_RADIUS - INNER_RADIUS);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      // Mostly faint, a few bright — skewed so the sky stays restrained.
      const brightness = 0.35 + random() ** 2.2 * 0.65;
      // A touch of blue-white variation, nothing saturated.
      colors[i * 3] = brightness * 0.94;
      colors[i * 3 + 1] = brightness * 0.96;
      colors[i * 3 + 2] = brightness;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  // The geometry is built here rather than by R3F, so releasing it is ours too.
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <points geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        // Screen-space size: stars stay crisp points regardless of distance.
        size={1.6}
        sizeAttenuation={false}
        vertexColors
        transparent
        opacity={0.85}
        depthWrite={false}
      />
    </points>
  );
}
