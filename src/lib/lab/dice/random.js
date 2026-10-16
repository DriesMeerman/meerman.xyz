// Fair dice numbers from the browser's cryptographic generator, using rejection sampling so every
// side is exactly as likely as the others.

/**
 * @param {number} sides
 * @returns {number} an integer from 1 to `sides`
 */
export function rollFair(sides) {
  const range = 2 ** 32;
  const limit = range - (range % sides);
  const buffer = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buffer);
    if (buffer[0] < limit) return (buffer[0] % sides) + 1;
  }
}

/**
 * Resolves the side count from the URL options: a valid `sides` value wins over `die`.
 * @param {Record<string, string>} options
 */
export function sidesFromOptions(options) {
  const custom = clampSides(Number.parseInt(options.sides ?? '', 10));
  if (custom) return custom;
  return clampSides(Number.parseInt((options.die ?? 'd20').replace(/^d/i, ''), 10)) || 20;
}

/** @param {number} value */
export function clampSides(value) {
  if (!Number.isFinite(value) || value < 2) return 0;
  return Math.min(999, Math.round(value));
}
