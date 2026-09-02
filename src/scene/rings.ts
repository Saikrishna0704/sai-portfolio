import { Color, DoubleSide, ShaderMaterial } from "three";

/**
 * A domain's ring system.
 *
 * The first version of this drew one bright band per supporting technology,
 * on the reasoning that PROJECT.md §3 assigns rings that meaning. It counted
 * correctly and looked wrong: evenly spaced lines with even gaps is the one
 * thing no real ring system has, and the result read as a target painted round
 * the planet. The semantics were driving the picture, and the picture lost.
 *
 * So the band count is gone. What a ring system actually is: a broad disc of
 * debris with dense fine structure at every scale, cut by a small number of
 * real divisions where a resonance has swept the material out. Nearly all the
 * variation is high-frequency noise; the gaps are few and wide.
 *
 * The meaning that survives is the honest part — a domain has rings only if it
 * has supporting technologies at all, and how far the disc extends scales with
 * how many. Nothing is countable by eye, which is correct: you cannot count
 * Saturn's ringlets either.
 */
const vertexShader = /* glsl */ `
  varying vec2 vLocal;
  varying vec3 vWorldPos;

  void main() {
    vLocal = position.xy;
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uColorWarm;
  uniform float uStrength;
  uniform float uInner;
  uniform float uOuter;
  uniform float uSeed;

  varying vec2 vLocal;
  varying vec3 vWorldPos;

  float hash(float n) {
    return fract(sin(n * 127.1 + uSeed * 311.7) * 43758.5453);
  }

  // Value noise in one dimension: ring structure is purely radial.
  float noise(float x) {
    float i = floor(x);
    float f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(hash(i), hash(i + 1.0), f);
  }

  // Octaves down to very fine scale. The high octaves are what make the disc
  // read as countless ringlets rather than as a painted gradient.
  float fbm(float x) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 6; i++) {
      value += amplitude * noise(x);
      x *= 2.17;
      amplitude *= 0.55;
    }
    return value;
  }

  void main() {
    float r = length(vLocal);
    float t = (r - uInner) / (uOuter - uInner);
    if (t < 0.0 || t > 1.0) discard;

    // Fine radial structure across the whole disc.
    float fine = fbm(t * 42.0 + uSeed);
    // A slower swell so the disc has broad bright and faint regions, the way
    // a B ring is denser than a C ring.
    float broad = 0.45 + 0.55 * fbm(t * 3.5 + uSeed * 0.7);

    float density = broad * (0.55 + 0.75 * fine);

    // Two divisions, placed by seed so no two domains share them. Wide and
    // soft-edged: a real gap is a clearing, not a hairline.
    float gapA = 0.28 + 0.2 * hash(3.0);
    float gapB = 0.66 + 0.16 * hash(9.0);
    density *= smoothstep(0.035, 0.075, abs(t - gapA));
    density *= smoothstep(0.02, 0.05, abs(t - gapB));

    // The disc thins toward both rims rather than ending at a cut edge.
    density *= smoothstep(0.0, 0.14, t) * (1.0 - smoothstep(0.72, 1.0, t));

    // Lit by the star at the origin, so the far arc darkens as it swings away
    // and the near arc catches light. Flat brightness was most of why the old
    // rings looked like a decal.
    vec3 lightDir = normalize(-vWorldPos);
    float lit = 0.45 + 0.55 * clamp(dot(normalize(vWorldPos), -lightDir), 0.0, 1.0);

    // Denser material reads warmer; thin material is dust-grey.
    vec3 color = mix(uColor, uColorWarm, clamp(density * 0.9, 0.0, 1.0));

    float alpha = clamp(density, 0.0, 1.0) * uStrength * lit;
    if (alpha < 0.003) discard;

    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;

/** ShaderMaterial with its uniforms stated, so callers need no index guards. */
export interface RingMaterial extends ShaderMaterial {
  uniforms: {
    uColor: { value: Color };
    uColorWarm: { value: Color };
    uStrength: { value: number };
    uInner: { value: number };
    uOuter: { value: number };
    uSeed: { value: number };
  };
}

export function createRingMaterial(
  color: string,
  inner: number,
  outer: number,
  seed: number,
  strength: number,
): RingMaterial {
  const base = new Color(color);

  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      // Thin dust: cool and grey, barely tinted by the body it orbits.
      uColor: { value: base.clone().lerp(new Color("#b9b3a4"), 0.8) },
      // Dense material: warm, closer to ice and rock catching the star.
      uColorWarm: { value: base.clone().lerp(new Color("#f4e6c9"), 0.85) },
      uStrength: { value: strength },
      uInner: { value: inner },
      uOuter: { value: outer },
      uSeed: { value: seed },
    },
    transparent: true,
    side: DoubleSide,
    depthWrite: false,
  }) as RingMaterial;
}
