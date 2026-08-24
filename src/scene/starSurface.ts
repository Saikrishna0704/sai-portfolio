import { Color, ShaderMaterial } from "three";

import { STAR_COLOR } from "./layout";

/** What the core is banked at before it catches: an ember, not darkness. */
export const EMBER_COLOR = "#3a1c0a";

/**
 * The star's surface, as a shader.
 *
 * The flat basic material this replaces read as a paper disc the moment the
 * camera came near — a uniform colour has no depth cue at all. Three things
 * make a ball of light read as a body of burning gas, and each is one term:
 *
 * - **granulation**: low-amplitude value noise drifting slowly across the
 *   surface, the convection-cell texture every star photo shows;
 * - **limb darkening**: the edge of a real star is dimmer and warmer than its
 *   centre, because the line of sight leaves through cooler layers;
 * - **rim warmth**: as brightness falls toward the limb the colour slides
 *   toward the ember shade, so the falloff reads as temperature, not shadow.
 *
 * Everything else about the star — halo, ignition timing, light — stays with
 * the component; this file only knows how to draw the surface. The ignition is
 * a uniform so the existing ember-to-lit ramp keeps working: at 0 the surface
 * is the banked ember, at 1 fully caught.
 *
 * Cheap on purpose: a handful of noise taps per fragment on one sphere, no
 * textures, no post-processing.
 */
const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vPos;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    // Object space, so the pattern is pinned to the surface and unaffected by
    // the camera; the mesh itself never rotates.
    vPos = position;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uIgnition;
  uniform vec3 uLitColor;
  uniform vec3 uEmberColor;

  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vPos;

  // Small value-noise stack. Hash from Dave Hoskins' shadertoy commons —
  // stable across GPUs, no textures needed.
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0, 0, 0)), hash(i + vec3(1, 0, 0)), f.x),
          mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
          mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p *= 2.1;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    // Two scales drifting against each other: large cells wandering slowly,
    // fine grain shimmering on top. Both slow — this is a surface seen from
    // orbit, not a fire.
    vec3 p = vPos * 2.4;
    float cells = fbm(p + vec3(uTime * 0.03, uTime * 0.021, -uTime * 0.017));
    float grain = fbm(p * 3.1 - vec3(uTime * 0.05, 0.0, uTime * 0.033));
    float granulation = cells * 0.72 + grain * 0.28;

    // Limb darkening: brightness falls as the surface turns away.
    float facing = clamp(dot(normalize(vNormal), normalize(vViewDir)), 0.0, 1.0);
    float limb = pow(facing, 0.62);

    // The surface brightens toward the centre and mottles everywhere. The
    // granulation term is small: visible texture, not camouflage.
    float brightness = limb * (0.82 + granulation * 0.36);

    // While igniting, the pattern deepens: at low ignition the granulation
    // contrast is exaggerated so the ember looks like coals rather than a
    // dim lamp, and it smooths out as the star catches.
    float contrast = mix(1.6, 1.0, uIgnition);
    brightness = pow(brightness, contrast);

    vec3 lit = mix(uEmberColor, uLitColor, uIgnition);
    // Toward the limb the colour cools toward ember, so the edge reads as
    // temperature falloff rather than as a shadowed rim.
    vec3 color = mix(uEmberColor, lit, clamp(brightness * 1.15, 0.0, 1.0));
    // Hot cores of the brightest cells push slightly past the base colour
    // toward white — only when lit, embers have no white anywhere.
    color += vec3(0.35, 0.28, 0.18) * pow(brightness, 3.0) * uIgnition;

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

/** ShaderMaterial with its uniforms stated, so callers need no index guards. */
export interface StarSurfaceMaterial extends ShaderMaterial {
  uniforms: {
    uTime: { value: number };
    uIgnition: { value: number };
    uLitColor: { value: Color };
    uEmberColor: { value: Color };
  };
}

export function createStarSurfaceMaterial(
  initialIgnition: number,
): StarSurfaceMaterial {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uIgnition: { value: initialIgnition },
      uLitColor: { value: new Color(STAR_COLOR) },
      uEmberColor: { value: new Color(EMBER_COLOR) },
    },
  }) as StarSurfaceMaterial;
}
