/**
 * Small deterministic PRNG.
 *
 * The scene must look identical on every render: anything generated with
 * Math.random would shift under the camera between mounts, and in a texture it
 * would change the planet's face on every reload.
 */
export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
