"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AdditiveBlending,
  CanvasTexture,
  Mesh,
  PointLight,
  ShaderMaterial,
  SRGBColorSpace,
  Sprite,
  SpriteMaterial,
} from "three";

import { WORLD } from "@/scene/layout";
import {
  createStarSurfaceMaterial,
  type StarSurfaceMaterial,
} from "@/scene/starSurface";

const GLOW_TEXTURE_SIZE = 256;
/**
 * Halo extent as a multiple of the star's radius.
 *
 * Kept tighter than looks best at the overview on purpose. The halo is fixed
 * in world units, so it grows on screen as the camera approaches, and focusing
 * an inner domain brought the camera close enough that a wider glow washed out
 * the corner of the frame.
 */
const GLOW_SCALE = 5.4;

/** Rate the star comes up to full once the opening lifts. Close to the
 *  camera's approach, so the light arrives with the system rather than trailing
 *  it by several seconds. */
const IGNITION_LAMBDA = 1.2;
/** At this point the ignition is finished and that part of the frame work can
 *  stop. The last fraction of a percent is not visible and is not worth a
 *  per-frame cost. */
const IGNITION_DONE = 0.99;
/** Resting intensity of the light the star casts over the system. */
const LIGHT_INTENSITY = 520;
/** Fraction of extra halo at the peak of the flare. The halo overshoots its
 *  resting size midway through and settles back, so the star reads as catching
 *  light rather than as a lamp being turned up. */
const FLARE = 0.42;

/**
 * A soft radial falloff, drawn once to a canvas.
 *
 * Nested transparent spheres were the obvious way to build a halo but they
 * render as flat discs with a hard rim — a sphere of uniform colour has no
 * falloff. A gradient sprite gives real glow with one quad, no shader library
 * and no post-processing pass.
 */
function useGlowTexture() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = GLOW_TEXTURE_SIZE;
    canvas.height = GLOW_TEXTURE_SIZE;

    const context = canvas.getContext("2d");
    if (!context) return null;

    const centre = GLOW_TEXTURE_SIZE / 2;
    const gradient = context.createRadialGradient(
      centre,
      centre,
      0,
      centre,
      centre,
      centre,
    );
    gradient.addColorStop(0, "rgba(255, 216, 165, 0.55)");
    gradient.addColorStop(0.18, "rgba(255, 208, 152, 0.24)");
    gradient.addColorStop(0.45, "rgba(255, 198, 142, 0.07)");
    gradient.addColorStop(1, "rgba(255, 194, 138, 0)");

    context.fillStyle = gradient;
    context.fillRect(0, 0, GLOW_TEXTURE_SIZE, GLOW_TEXTURE_SIZE);

    const canvasTexture = new CanvasTexture(canvas);
    canvasTexture.colorSpace = SRGBColorSpace;
    return canvasTexture;
  }, []);

  useEffect(() => () => texture?.dispose(), [texture]);

  return texture;
}

interface CentralStarProps {
  reducedMotion: boolean;
  /** False while the opening still covers the screen: the star waits banked. */
  mayArrive: boolean;
}

/**
 * The person, at the centre and source of the system (PROJECT.md §3).
 *
 * Self-luminous: a shader surface (granulation, limb darkening — see
 * `starSurface.ts`) plus one additive halo sprite.
 *
 * It ignites rather than appearing lit. Holding the core at an ember and the
 * halo at nothing until the opening lifts means the first thing the reveal
 * shows is the centre catching, which is what makes the space read as coming
 * alive instead of as a finished picture being uncovered.
 *
 * The star carries no 3D label — the name is already stated in the header and
 * the overview heading, and repeating it here would clutter the centre.
 */
export function CentralStar({ reducedMotion, mayArrive }: CentralStarProps) {
  const glowTexture = useGlowTexture();
  const glowSize = WORLD.starRadius * GLOW_SCALE;

  const core = useRef<Mesh>(null);
  const halo = useRef<Sprite>(null);
  const light = useRef<PointLight>(null);
  // Frozen at the first render, matching how CameraRig decides: mayArrive is
  // false only while an opening is covering the screen, so this is exactly the
  // case with someone waiting to watch. A reload straight into the overview
  // finds the star already lit rather than sitting through the ignition again.
  const [cinematic] = useState(() => !reducedMotion && !mayArrive);
  const ignition = useRef(cinematic ? 0 : 1);

  const surface = useMemo(
    () => createStarSurfaceMaterial(cinematic ? 0 : 1),
    [cinematic],
  );
  useEffect(() => () => surface.dispose(), [surface]);

  useFrame((state, delta) => {
    // Reached through the mesh ref rather than the memo, the same way the
    // original colour ramp went through the material: frame-loop work stays
    // out of render-scoped values.
    const coreMaterial = core.current?.material;
    const surfaceMaterial =
      coreMaterial instanceof ShaderMaterial
        ? (coreMaterial as StarSurfaceMaterial)
        : null;

    // The granulation drifts for as long as the star is on screen; with motion
    // reduced the time uniform stays put and the surface is a still texture.
    if (!reducedMotion && surfaceMaterial) {
      surfaceMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    }

    if (!mayArrive || ignition.current >= IGNITION_DONE) return;

    ignition.current +=
      (1 - ignition.current) * (1 - Math.exp(-IGNITION_LAMBDA * delta));

    const t = ignition.current;
    if (surfaceMaterial) surfaceMaterial.uniforms.uIgnition.value = t;
    // Peaks halfway through and returns, giving the halo its overshoot.
    const flare = 1 + FLARE * Math.sin(Math.PI * t);

    if (halo.current) {
      const size = glowSize * t * flare;
      halo.current.scale.set(size, size, 1);

      const haloMaterial = halo.current.material;
      if (haloMaterial instanceof SpriteMaterial) haloMaterial.opacity = t;
    }

    // The planets come out of the dark with the star, since it is what lights
    // them. Squared so they stay low while the core is still an ember and then
    // fill in quickly, rather than tracking the centre in lockstep.
    if (light.current) light.current.intensity = LIGHT_INTENSITY * t * t;
  });

  return (
    <group>
      {/* The star lights the system from the centre it occupies. */}
      <pointLight
        ref={light}
        intensity={cinematic ? 0 : LIGHT_INTENSITY}
        distance={0}
        decay={2}
      />

      <mesh ref={core} material={surface}>
        {/* Segments beyond the planets' own: the limb darkening traces the
            silhouette, and a faceted edge would show straight through it. */}
        <sphereGeometry args={[WORLD.starRadius, 64, 64]} />
      </mesh>

      {glowTexture && (
        <sprite
          ref={halo}
          scale={cinematic ? [0, 0, 1] : [glowSize, glowSize, 1]}
        >
          <spriteMaterial
            map={glowTexture}
            blending={AdditiveBlending}
            transparent
            opacity={cinematic ? 0 : 1}
            depthWrite={false}
          />
        </sprite>
      )}
    </group>
  );
}
