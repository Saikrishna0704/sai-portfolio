import { Color, DoubleSide, ShaderMaterial } from "three";

/**
 * A domain's ring system.
 *
 * PROJECT.md §3 reserves rings for "supporting technologies / methods" that
 * "closely surround and support a domain", and every domain already declares
 * `relatedSkills`. So the band count is not a look — it is that number, drawn.
 * A domain supported by five technologies wears five bands.
 *
 * Built as a shader on a flat annulus rather than as N separate ring meshes:
 * one draw call regardless of band count, and the radial falloff that keeps the
 * inner and outer edges from ending in a hard line is a single smoothstep
 * instead of geometry.
 *
 * The bands are deliberately uneven in brightness. Perfectly regular rings read
 * as a graphic; real ring systems have gaps and density variation, and the
 * slight per-band variation is what stops this looking like a target.
 */
const vertexShader = /* glsl */ `
  varying vec2 vLocal;

  void main() {
    // Object space, so the band positions are pinned to the ring itself and
    // unaffected by how the group is tilted or where the planet has travelled.
    vLocal = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uStrength;
  uniform float uInner;
  uniform float uOuter;
  uniform float uBands;
  uniform float uSeed;

  varying vec2 vLocal;

  // Cheap deterministic hash, for per-band variation.
  float hash(float n) {
    return fract(sin(n * 127.1 + uSeed * 311.7) * 43758.5453);
  }

  void main() {
    float r = length(vLocal);
    // Normalised position across the ring system, 0 at the inner edge.
    float t = (r - uInner) / (uOuter - uInner);
    if (t < 0.0 || t > 1.0) discard;

    // Which band this fragment falls in, and where within it.
    float band = floor(t * uBands);
    float within = fract(t * uBands);

    // Each band is a thin line with a wide gap after it. The width matters a
    // lot: at 0.42 the bands nearly touched and the system read as a bullseye
    // rather than as rings. Delicate lines with space between them is what
    // makes a ring system look like one.
    float line = 1.0 - smoothstep(0.0, 0.2, abs(within - 0.5));

    // Per-band brightness and width variation, so the set is not mechanical.
    float variation = 0.55 + 0.45 * hash(band);
    line *= variation;

    // The whole system fades at both extremes, so neither edge is a hard cut.
    float edges = smoothstep(0.0, 0.12, t) * (1.0 - smoothstep(0.82, 1.0, t));

    float alpha = line * edges * uStrength;
    if (alpha < 0.002) discard;

    gl_FragColor = vec4(uColor, alpha);
    #include <colorspace_fragment>
  }
`;

/** ShaderMaterial with its uniforms stated, so callers need no index guards. */
export interface RingMaterial extends ShaderMaterial {
  uniforms: {
    uColor: { value: Color };
    uStrength: { value: number };
    uInner: { value: number };
    uOuter: { value: number };
    uBands: { value: number };
    uSeed: { value: number };
  };
}

export function createRingMaterial(
  color: string,
  bands: number,
  inner: number,
  outer: number,
  seed: number,
  strength: number,
): RingMaterial {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      // Warmed toward cream. Rings catch the star's light rather than carrying
      // the domain's own colour, which keeps them reading as material around
      // the body instead of as more of the body.
      uColor: { value: new Color(color).lerp(new Color("#f0e3c8"), 0.72) },
      uStrength: { value: strength },
      uInner: { value: inner },
      uOuter: { value: outer },
      uBands: { value: bands },
      uSeed: { value: seed },
    },
    transparent: true,
    // Seen from either face as the system turns.
    side: DoubleSide,
    depthWrite: false,
  }) as RingMaterial;
}
