// Small seeded generator (mulberry32). The state is one unsigned 32 bit number kept on the object
// that owns it, so a simulation can be copied or replayed without hidden globals.

/** @typedef {{ rng: number }} RngHolder */

/**
 * Advances the generator on `holder` and returns a float in [0, 1).
 * @param {RngHolder} holder
 */
export function random(holder) {
  holder.rng = (holder.rng + 0x6d2b79f5) >>> 0;
  let t = holder.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** @param {RngHolder} holder @param {number} min @param {number} max */
export const randomRange = (holder, min, max) => min + random(holder) * (max - min);

/** An integer in [0, count). @param {RngHolder} holder @param {number} count */
export const randomInt = (holder, count) => Math.floor(random(holder) * count);

/**
 * Mixes several integers into one 32 bit seed, so each level and attempt gets its own stream.
 * @param {...number} parts
 */
export function mixSeed(...parts) {
  let h = 0x811c9dc5;
  for (const part of parts) {
    h ^= part >>> 0;
    h = Math.imul(h, 0x01000193);
    h ^= h >>> 13;
    h = Math.imul(h, 0x5bd1e995);
    h ^= h >>> 15;
  }
  return h >>> 0;
}
