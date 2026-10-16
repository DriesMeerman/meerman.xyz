// Colour sets for the orb. `shell` runs from the dim haze colour to the bright filament colour,
// `hot` is the pointer flare, `core` the inner sphere, `ring` the orbiting lattice bands.

/**
 * @typedef {object} OrbPalette
 * @property {[string, string]} shell
 * @property {string} hot
 * @property {string} core
 * @property {string} ring
 */

/** @type {Record<string, OrbPalette>} */
export const PALETTES = {
  cyan: { shell: ['#0b4f7a', '#7df5f9'], hot: '#ff6fae', core: '#ff3d8f', ring: '#9beef3' },
  emerald: { shell: ['#0a5a33', '#86f7a8'], hot: '#ff5c5c', core: '#ff2e4a', ring: '#b4f5c8' },
  crimson: { shell: ['#6e0f22', '#ff7a7a'], hot: '#ffd166', core: '#ffb347', ring: '#ffa3aa' },
  violet: { shell: ['#2f1a86', '#bb98ff'], hot: '#ffb347', core: '#ff9f43', ring: '#d3c0ff' },
  mono: { shell: ['#2e3d47', '#eaf4f7'], hot: '#9fd7ff', core: '#7fc3ff', ring: '#d6e1e6' }
};

export const DEFAULT_PALETTE = 'cyan';

/** @param {string | undefined} name */
export function paletteNamed(name) {
  return PALETTES[name ?? ''] ? /** @type {string} */ (name) : DEFAULT_PALETTE;
}
