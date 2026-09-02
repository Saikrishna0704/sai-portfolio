import { CanvasTexture, Color, RepeatWrapping, SRGBColorSpace } from "three";

import { mulberry32 } from "./random";

const WIDTH = 512;
const HEIGHT = 256;

/**
 * How far mottling strays from the base colour.
 *
 * Restrained, per PROJECT.md §8, but not flat: at 0.38 the bodies read as
 * smooth balls once the camera comes near, and surface character is most of
 * what separates a planet from a primitive. Raised until the terminator has
 * something to travel across, and no further.
 */
const MOTTLE_STRENGTH = 0.52;
const BAND_STRENGTH = 0.24;
const BLOB_COUNT = 62;

function shade(base: Color, amount: number): string {
  const next = base.clone();
  // Move towards white or black in linear terms, then back to a CSS string.
  next.lerp(new Color(amount > 0 ? "#ffffff" : "#000000"), Math.abs(amount));
  return `#${next.getHexString()}`;
}

/**
 * A planet surface, drawn procedurally to a canvas.
 *
 * Two reasons this exists at all. Without any surface variation an untextured
 * sphere lit from a fixed point looks identical at every rotation, so the axial
 * spin added in Phase 3 was invisible. And a perfectly smooth ball reads as a
 * primitive rather than a body.
 *
 * The mottling is deliberately *longitudinal*. Bodies spin about the Y axis,
 * and latitudinal banding alone is symmetric about that axis, so it would turn
 * without appearing to move. The bands are here for the look; the blobs are
 * what make the rotation legible.
 *
 * Procedural rather than an image file: no asset to load, no dependency, and
 * each domain's colour gets its own surface for free.
 */
export function createPlanetTexture(
  baseColor: string,
  seed: number,
): CanvasTexture | null {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  const context = canvas.getContext("2d");
  if (!context) return null;

  const random = mulberry32(seed);
  const base = new Color(baseColor);

  context.fillStyle = `#${base.getHexString()}`;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  // Latitudinal bands. Soft-edged so they read as atmosphere rather than
  // stripes, and irregular in height so they do not look mechanical.
  let y = 0;
  while (y < HEIGHT) {
    const height = 10 + random() * 34;
    const amount = (random() - 0.5) * 2 * BAND_STRENGTH;
    const gradient = context.createLinearGradient(0, y, 0, y + height);
    gradient.addColorStop(0, `${shade(base, amount)}00`);
    gradient.addColorStop(0.5, `${shade(base, amount)}ff`);
    gradient.addColorStop(1, `${shade(base, amount)}00`);
    context.fillStyle = gradient;
    context.fillRect(0, y, WIDTH, height);
    y += height * 0.75;
  }

  // Longitudinal mottling: this is what makes the spin visible.
  for (let i = 0; i < BLOB_COUNT; i += 1) {
    const cx = random() * WIDTH;
    const cy = random() * HEIGHT;
    const radius = 18 + random() * 62;
    const amount = (random() - 0.5) * 2 * MOTTLE_STRENGTH;
    const tint = shade(base, amount);

    // Drawn three times so a blob crossing the seam appears on both edges;
    // the texture wraps horizontally and a hard seam would be obvious.
    for (const offset of [-WIDTH, 0, WIDTH]) {
      const gradient = context.createRadialGradient(
        cx + offset,
        cy,
        0,
        cx + offset,
        cy,
        radius,
      );
      gradient.addColorStop(0, `${tint}b0`);
      gradient.addColorStop(1, `${tint}00`);
      context.fillStyle = gradient;
      context.fillRect(cx + offset - radius, cy - radius, radius * 2, radius * 2);
    }
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}
