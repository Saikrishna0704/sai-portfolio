import { Color, ShaderMaterial } from "three";

/**
 * A planet's surface.
 *
 * This replaces a procedural canvas texture that had two problems. It was
 * low-contrast by design — restraint read as flatness, and the bodies looked
 * like plastic balls. And being a 2D map wrapped on a sphere, it pinched at
 * the poles and needed a seam workaround at the wrap.
 *
 * Noise evaluated in 3D object space fixes both: there is no map, so no seam
 * and no polar pinch, and the contrast can be pushed without a texture budget.
 *
 * `uCharacter` moves each body along one axis from rocky to banded. Low values
 * give continent-like blotches and a broken surface; high values give the
 * latitudinal flow of a gas giant. It is presentation config, seeded per
 * domain, not a claim about the work — no portfolio meaning is encoded here.
 *
 * Lighting is computed here rather than by a standard material, because the
 * star sits at the world origin: the light direction is just the direction
 * back to centre, so a full lighting rig buys nothing. What it buys instead is
 * control of the terminator, which is most of what makes a sphere read as a
 * world — a hard shadow line looks like a ball, a soft scattering one looks
 * like a planet.
 */
const vertexShader = /* glsl */ `
  varying vec3 vObject;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  varying vec3 vViewDir;

  void main() {
    vObject = position;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPos = world.xyz;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uHigh;
  uniform vec3 uLow;
  uniform float uCharacter;
  uniform float uSeed;
  uniform float uDim;

  varying vec3 vObject;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  varying vec3 vViewDir;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + uSeed * 0.1);
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
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p = p * 2.13 + vec3(11.3, 7.1, 3.7);
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec3 p = normalize(vObject);

    // Warped domain: sampling noise through another noise field is what turns
    // round blobs into the curled, marbled shapes real surfaces have.
    vec3 warp = vec3(
      fbm(p * 2.1),
      fbm(p * 2.1 + 5.2),
      fbm(p * 2.1 + 9.7)
    );
    float detail = fbm(p * 3.4 + warp * 1.6);

    // Latitude drives the banding. Pushing the flow through the same warp is
    // what keeps a gas giant's bands wavering rather than ruled.
    float lat = p.y;
    float bands = 0.5 + 0.5 * sin(lat * 13.0 + (warp.x - 0.5) * 6.5);

    // One axis from rocky and broken to banded and flowing.
    float surface = mix(detail, mix(detail, bands, 0.72), uCharacter);

    // Widened around the midpoint: the old canvas map kept its variation
    // inside a narrow range, which is precisely what made the bodies look
    // like untextured spheres once the camera came close.
    surface = clamp((surface - 0.5) * 1.7 + 0.5, 0.0, 1.0);

    vec3 albedo = mix(uLow, uHigh, surface);
    albedo = mix(albedo, uBase, 0.35);

    // Ice at the poles, thrown by the same noise so the margin is ragged
    // rather than a drawn circle.
    float polar = smoothstep(0.72, 0.94, abs(lat) + (detail - 0.5) * 0.22);
    albedo = mix(albedo, vec3(0.93, 0.94, 0.95), polar * 0.55);

    // The star is at the world origin.
    vec3 lightDir = normalize(-vWorldPos);
    float ndl = dot(normalize(vWorldNormal), lightDir);

    // Wrapped, so the terminator falls off over a band rather than a line,
    // and the night side keeps a trace of light instead of going to black.
    float lambert = clamp((ndl + 0.28) / 1.28, 0.0, 1.0);
    lambert = pow(lambert, 1.35);

    vec3 color = albedo * (0.06 + 1.18 * lambert);

    // A cool bounce on the night side, so the dark limb reads as shadowed
    // rather than as a hole cut in the starfield.
    color += albedo * vec3(0.05, 0.07, 0.11) * (1.0 - lambert) * 0.6;

    // Recedes while another domain holds focus. A neutral multiply down, so
    // the hue does not shift as it dims.
    color *= uDim;

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

/** ShaderMaterial with its uniforms stated, so callers need no index guards. */
export interface PlanetSurfaceMaterial extends ShaderMaterial {
  uniforms: {
    uBase: { value: Color };
    uHigh: { value: Color };
    uLow: { value: Color };
    uCharacter: { value: number };
    uSeed: { value: number };
    uDim: { value: number };
  };
}

export function createPlanetSurfaceMaterial(
  color: string,
  character: number,
  seed: number,
): PlanetSurfaceMaterial {
  const base = new Color(color);

  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uBase: { value: base.clone() },
      // A real body's range runs from bright dust to dark rock. Both ends are
      // pulled well away from the base colour so the surface has somewhere to
      // travel as it turns.
      uHigh: { value: base.clone().lerp(new Color("#ffffff"), 0.5) },
      uLow: { value: base.clone().lerp(new Color("#120f14"), 0.6) },
      uCharacter: { value: character },
      uSeed: { value: seed },
      uDim: { value: 1 },
    },
  }) as PlanetSurfaceMaterial;
}
