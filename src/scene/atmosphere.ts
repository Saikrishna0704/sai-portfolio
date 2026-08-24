import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  ShaderMaterial,
  SRGBColorSpace,
} from "three";

/**
 * A planet's atmospheric rim: a thin fresnel glow in the domain's own colour.
 *
 * Drawn on a shell barely wider than the body — the shell must stay thin,
 * because a fresnel glow on a wide shell peaks at the *shell's* silhouette,
 * which reads as a detached ring floating around the planet rather than as
 * air hugging its limb. Additive and depth-read-only: it layers over the body
 * it wraps and hides correctly behind anything nearer.
 *
 * One uniform, `uStrength`, scales the whole effect, so emphasis (active,
 * dimmed) can be damped smoothly in the frame loop instead of switching.
 * The soft outer haze is a separate gradient sprite (`createGlowTexture`),
 * the same one-quad technique the star's halo uses.
 */
const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uStrength;

  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;

  void main() {
    float facing = clamp(dot(normalize(vNormal), normalize(vViewDir)), 0.0, 1.0);
    // Steep rise at the limb, nothing across the face.
    float rim = pow(1.0 - facing, 2.4);
    // Faded before the silhouette so the shell's own hard edge never shows:
    // the glow peaks just inside it and falls to zero at the boundary.
    float edgeFade = smoothstep(0.0, 0.1, facing);
    // Air glows where the star lights it. The star sits at the world origin,
    // so the light direction is simply back toward it; the night-side rim
    // keeps a trace of scatter rather than a uniform outline all the way
    // round, which read as a bubble.
    vec3 lightDir = normalize(-vWorldPos);
    float lit =
      0.18 + 0.82 * clamp(dot(normalize(vWorldNormal), lightDir), 0.0, 1.0);
    gl_FragColor = vec4(uColor, 1.0) * rim * edgeFade * lit * uStrength;
    #include <colorspace_fragment>
  }
`;

/** ShaderMaterial with its uniforms stated, so callers need no index guards. */
export interface AtmosphereMaterial extends ShaderMaterial {
  uniforms: {
    uColor: { value: Color };
    uStrength: { value: number };
  };
}

export function createAtmosphereMaterial(
  color: string,
  strength: number,
): AtmosphereMaterial {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      // Lifted toward white: the atmosphere is lit air, not paint, and the
      // planet's base colour is deliberately muted (PROJECT.md §8).
      uColor: { value: new Color(color).lerp(new Color("#ffffff"), 0.35) },
      uStrength: { value: strength },
    },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  }) as AtmosphereMaterial;
}

const GLOW_TEXTURE_SIZE = 128;

/**
 * A soft radial falloff in the planet's own colour, for the haze beyond the
 * limb. One canvas, one quad; the falloff starts gentle and reaches zero well
 * before the sprite's edge so nothing squares off.
 */
export function createGlowTexture(color: string): CanvasTexture | null {
  const canvas = document.createElement("canvas");
  canvas.width = GLOW_TEXTURE_SIZE;
  canvas.height = GLOW_TEXTURE_SIZE;

  const context = canvas.getContext("2d");
  if (!context) return null;

  const tint = new Color(color).lerp(new Color("#ffffff"), 0.4);
  const r = Math.round(tint.r * 255);
  const g = Math.round(tint.g * 255);
  const b = Math.round(tint.b * 255);

  const centre = GLOW_TEXTURE_SIZE / 2;
  const gradient = context.createRadialGradient(
    centre,
    centre,
    0,
    centre,
    centre,
    centre,
  );
  gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.5)`);
  gradient.addColorStop(0.32, `rgba(${r}, ${g}, ${b}, 0.16)`);
  gradient.addColorStop(0.62, `rgba(${r}, ${g}, ${b}, 0.04)`);
  gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

  context.fillStyle = gradient;
  context.fillRect(0, 0, GLOW_TEXTURE_SIZE, GLOW_TEXTURE_SIZE);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
