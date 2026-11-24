// Axial hex coordinates on a pointy-top grid. Pure math, no DOM and no three.js.
// The "world" here is the 2D hex plane; the scene maps world y onto three's z axis.

/** @typedef {{ q: number, r: number }} Hex */
/** @typedef {{ x: number, y: number }} Point */

export const SQRT3 = Math.sqrt(3);

/** Distance from a hex centre to a corner, in world units. */
export const HEX_SIZE = 1;

/** Distance between the centres of two adjacent hexes, in world units. */
export const HEX_STEP = SQRT3 * HEX_SIZE;

/** The six neighbour offsets, in 60 degree steps. */
export const DIRECTIONS = /** @type {readonly Hex[]} */ (
  Object.freeze([
    { q: 1, r: 0 },
    { q: 1, r: -1 },
    { q: 0, r: -1 },
    { q: -1, r: 0 },
    { q: -1, r: 1 },
    { q: 0, r: 1 }
  ])
);

/** @param {number} q @param {number} r */
export const hexKey = (q, r) => `${q},${r}`;

/** @param {string} key @returns {Hex} */
export function parseKey(key) {
  const [q, r] = key.split(',').map(Number);
  return { q, r };
}

/** @param {number} q @param {number} r @returns {Hex[]} */
export function neighbors(q, r) {
  return DIRECTIONS.map((d) => ({ q: q + d.q, r: r + d.r }));
}

/** Hex steps between two hexes. @param {Hex} a @param {Hex} b */
export function hexDistance(a, b) {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

/**
 * The hexes exactly `radius` steps from `center`, walking around the ring.
 * @param {Hex} center
 * @param {number} radius
 * @returns {Hex[]}
 */
export function ring(center, radius) {
  if (radius === 0) return [{ q: center.q, r: center.r }];
  /** @type {Hex[]} */
  const out = [];
  let q = center.q + DIRECTIONS[4].q * radius;
  let r = center.r + DIRECTIONS[4].r * radius;
  for (let side = 0; side < 6; side++) {
    for (let i = 0; i < radius; i++) {
      out.push({ q, r });
      q += DIRECTIONS[side].q;
      r += DIRECTIONS[side].r;
    }
  }
  return out;
}

/** Every hex within `radius` steps of the origin, centre first. @param {number} radius @returns {Hex[]} */
export function disk(radius) {
  /** @type {Hex[]} */
  const out = [];
  for (let n = 0; n <= radius; n++) out.push(...ring({ q: 0, r: 0 }, n));
  return out;
}

/**
 * Rotates a hex offset around the origin in 60 degree steps. Negative steps turn the other way.
 * @param {Hex} hex
 * @param {number} steps
 * @returns {Hex}
 */
export function rotateHex(hex, steps) {
  let { q, r } = hex;
  const turns = ((steps % 6) + 6) % 6;
  for (let i = 0; i < turns; i++) [q, r] = [-r, q + r];
  // Avoid negative zero so rotated offsets compare and print cleanly.
  return { q: q + 0, r: r + 0 };
}

/** @param {number} q @param {number} r @returns {Point} */
export function hexToWorld(q, r) {
  return { x: HEX_STEP * (q + r / 2), y: HEX_SIZE * 1.5 * r };
}

/** Rounds fractional axial coordinates to the nearest hex. @param {number} fq @param {number} fr @returns {Hex} */
export function hexRound(fq, fr) {
  const fs = -fq - fr;
  let q = Math.round(fq);
  let r = Math.round(fr);
  const s = Math.round(fs);
  const dq = Math.abs(q - fq);
  const dr = Math.abs(r - fr);
  const ds = Math.abs(s - fs);
  if (dq > dr && dq > ds) q = -r - s;
  else if (dr > ds) r = -q - s;
  return { q: q + 0, r: r + 0 };
}

/** The hex containing a world point. @param {number} x @param {number} y @returns {Hex} */
export function worldToHex(x, y) {
  const fr = y / (HEX_SIZE * 1.5);
  const fq = x / HEX_STEP - fr / 2;
  return hexRound(fq, fr);
}

/** The six corners of a hex in world units, starting at the top right and going around. @param {number} q @param {number} r @param {number} [size] */
export function hexCorners(q, r, size = HEX_SIZE) {
  const c = hexToWorld(q, r);
  /** @type {Point[]} */
  const out = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    out.push({ x: c.x + size * Math.cos(angle), y: c.y + size * Math.sin(angle) });
  }
  return out;
}
