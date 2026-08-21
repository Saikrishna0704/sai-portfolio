"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { STARFIELD_DRIFT_SPEED } from "@/scene/motion";
import { mulberry32 } from "@/scene/random";

const STAR_COUNT = 1400;
const INNER_RADIUS = 90;
const OUTER_RADIUS = 150;

/**
 * Background sky: a single points cloud on a distant shell.
 *
 * Deliberately plain — one draw call, no textures. Brightness varies per star
 * so the field reads as depth rather than as uniform noise.
 *
 * Drifts far more slowly than anything else in the scene: the sky should read
 * as the frame the system moves within, not as another moving object.
 */
export function Starfield({ reducedMotion }: { reducedMotion: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (reducedMotion || !pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.elapsedTime * STARFIELD_DRIFT_SPEED;
  });

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
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
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
