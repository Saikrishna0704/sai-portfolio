"use client";

import { useEffect, useMemo } from "react";
import { AdditiveBlending, CanvasTexture, SRGBColorSpace } from "three";

import { STAR_COLOR, WORLD } from "@/scene/layout";

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

/**
 * The person, at the centre and source of the system (PROJECT.md §3).
 *
 * Self-luminous: an unlit core plus one additive halo sprite.
 *
 * The star carries no 3D label — the name is already stated in the header and
 * the overview heading, and repeating it here would clutter the centre.
 */
export function CentralStar() {
  const glowTexture = useGlowTexture();
  const glowSize = WORLD.starRadius * GLOW_SCALE;

  return (
    <group>
      <mesh>
        <sphereGeometry args={[WORLD.starRadius, 48, 48]} />
        <meshBasicMaterial color={STAR_COLOR} />
      </mesh>

      {glowTexture && (
        <sprite scale={[glowSize, glowSize, 1]}>
          <spriteMaterial
            map={glowTexture}
            blending={AdditiveBlending}
            transparent
            depthWrite={false}
          />
        </sprite>
      )}
    </group>
  );
}
