"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { STARFIELD_DRIFT_SPEED } from "@/scene/motion";
import { mulberry32 } from "@/scene/random";

const STAR_COUNT = 1700;
/**
 * Radial extent of the shell. Deeper than it used to be: the camera's opening
 * approach and the flights between domains cover tens of world units, and
 * stars spread from just beyond the system to the far shell move at visibly
 * different rates — which is what makes those moves feel like travel rather
 * than a zoom. The distribution is skewed so most stars stay far away and the
 * near field is only a scattering.
 */
const INNER_RADIUS = 55;
const OUTER_RADIUS = 150;

/**
 * Background sky: a single points cloud on a distant shell.
 *
 * One draw call, no textures. Each star carries its own size, brightness and
 * twinkle phase; the twinkle is a slow, shallow sine — atmosphere-grade
 * shimmer, far below anything that would read as blinking. Motion-reduced
 * visitors get the same sky, still.
 *
 * Drifts far more slowly than anything else in the scene: the sky should read
 * as the frame the system moves within, not as another moving object.
 */
const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;

  attribute float aSize;
  attribute float aPhase;
  attribute float aTwinkle;
  attribute vec3 aColor;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    // Shallow per-star shimmer. Two incommensurate rates so the field never
    // pulses in unison.
    float twinkle =
      1.0 - aTwinkle * (0.5 + 0.5 * sin(uTime * (0.6 + aPhase) + aPhase * 7.0));
    vAlpha = twinkle;

    gl_PointSize = aSize * uPixelRatio;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uOpacity;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Round, soft-edged point: the default square sprite reads as pixels.
    vec2 offset = gl_PointCoord - 0.5;
    float d = length(offset) * 2.0;
    float shape = 1.0 - smoothstep(0.55, 1.0, d);
    if (shape < 0.001) discard;

    gl_FragColor = vec4(vColor, shape * vAlpha * uOpacity);
    #include <colorspace_fragment>
  }
`;

/** ShaderMaterial with its uniforms stated, so callers need no index guards. */
interface StarfieldMaterial extends THREE.ShaderMaterial {
  uniforms: {
    uTime: { value: number };
    uPixelRatio: { value: number };
    uOpacity: { value: number };
  };
}

export function Starfield({ reducedMotion }: { reducedMotion: boolean }) {
  const pixelRatio = useThree((state) => state.gl.getPixelRatio());

  const { geometry, material } = useMemo(() => {
    const random = mulberry32(20260820);
    const positions = new Float32Array(STAR_COUNT * 3);
    const colors = new Float32Array(STAR_COUNT * 3);
    const sizes = new Float32Array(STAR_COUNT);
    const phases = new Float32Array(STAR_COUNT);
    const twinkles = new Float32Array(STAR_COUNT);

    for (let i = 0; i < STAR_COUNT; i += 1) {
      // Even distribution over the sphere, not clustered at the poles.
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      // Squared toward the far shell: depth comes from the few near stars,
      // restraint from most of them staying distant.
      const spread = random() ** 0.45;
      const radius = INNER_RADIUS + spread * (OUTER_RADIUS - INNER_RADIUS);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      // Mostly faint, a few bright — skewed so the sky stays restrained.
      const brightness = 0.35 + random() ** 2.2 * 0.65;
      // A touch of blue-white variation, nothing saturated; the occasional
      // star runs faintly warm, the way a real field does.
      const warm = random() > 0.86 ? 0.05 : 0;
      colors[i * 3] = brightness * (0.94 + warm);
      colors[i * 3 + 1] = brightness * 0.96;
      colors[i * 3 + 2] = brightness * (1 - warm * 0.6);

      // Bright stars are also the larger ones, never past a few pixels.
      sizes[i] = 1.1 + brightness * 1.4 + (random() > 0.97 ? 0.9 : 0);
      phases[i] = random() * Math.PI * 2;
      // Most stars barely shimmer; a scattering breathe more visibly.
      twinkles[i] = random() ** 3 * 0.5;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    geo.setAttribute("aTwinkle", new THREE.BufferAttribute(twinkles, 1));

    const shaderMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: 1 },
        uOpacity: { value: 0.85 },
      },
      transparent: true,
      depthWrite: false,
    }) as StarfieldMaterial;

    return { geometry: geo, material: shaderMaterial };
  }, []);

  // Built here rather than by R3F, so releasing them is ours too.
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  const pointsRef = useRef<THREE.Points>(null);

  // Through the ref rather than the memo, so nothing render-scoped is written
  // to after render.
  useEffect(() => {
    const points = pointsRef.current;
    if (points) {
      (points.material as StarfieldMaterial).uniforms.uPixelRatio.value =
        pixelRatio;
    }
  }, [pixelRatio]);

  useFrame((state) => {
    if (reducedMotion) return;
    const points = pointsRef.current;
    if (!points) return;
    (points.material as StarfieldMaterial).uniforms.uTime.value =
      state.clock.elapsedTime;
    points.rotation.y = state.clock.elapsedTime * STARFIELD_DRIFT_SPEED;
  });

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      frustumCulled={false}
    />
  );
}
