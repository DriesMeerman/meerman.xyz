// The forge: a won level's surviving structure becomes one weapon for the next phase.
// The shape of the build is the weapon's hit area, the mix of module types sets its stats.
// Pure functions only, so later layers (a weapon forged from weapons) can reuse them.
import { hexKey, rotateHex } from './hex.js';
import { BUILDABLE } from './data.js';

/** @typedef {import('./hex.js').Hex} Hex */
/** @typedef {import('./data.js').ModuleType} ModuleType */
/** @typedef {Record<Exclude<ModuleType, 'core'>, number>} ModuleCounts */

/**
 * @typedef {object} WeaponStats
 * @property {number} damage dealt to every rock inside the hit area, per pulse
 * @property {number} fireRate pulses per second
 * @property {number} slow share of rock speed removed inside the hit area, 0 to 1
 * @property {number} pierce armor ignored per hit
 * @property {number} repair hit points per second the weapon restores to itself
 */

/**
 * @typedef {object} WeaponDescriptor
 * @property {number} version shape version, bump when fields change meaning
 * @property {number} level 1 based level that forged it
 * @property {Hex[]} silhouette hex offsets relative to the core, core included at 0,0
 * @property {{ q: number, r: number, type: ModuleType }[]} cells the same offsets with their module types
 * @property {ModuleCounts} counts surviving modules per type, core excluded
 * @property {number} size number of hexes in the silhouette
 * @property {WeaponStats} stats
 */

/** Numbers behind the stat formulas, kept together for balance passes. */
export const FORGE = {
  baseDamage: 6,
  damagePerRivet: 5,
  damagePerLance: 18,
  baseFireRate: 0.4,
  fireRatePerRivet: 0.1,
  fireRatePerDynamo: 0.15,
  maxFireRate: 3,
  slowKeptPerMire: 0.8,
  maxSlow: 0.7,
  piercePerLance: 2,
  repairPerMender: 2
};

const round2 = (/** @type {number} */ value) => Math.round(value * 100) / 100;

/** @returns {ModuleCounts} */
export const emptyCounts = () => ({ rivet: 0, lance: 0, mire: 0, dynamo: 0, mender: 0 });

/**
 * Weapon stats from module counts.
 * @param {ModuleCounts} counts
 * @returns {WeaponStats}
 */
export function weaponStats(counts) {
  return {
    damage: FORGE.baseDamage + FORGE.damagePerRivet * counts.rivet + FORGE.damagePerLance * counts.lance,
    fireRate: round2(Math.min(FORGE.maxFireRate, FORGE.baseFireRate + FORGE.fireRatePerRivet * counts.rivet + FORGE.fireRatePerDynamo * counts.dynamo)),
    slow: round2(Math.min(FORGE.maxSlow, 1 - FORGE.slowKeptPerMire ** counts.mire)),
    pierce: FORGE.piercePerLance * counts.lance,
    repair: FORGE.repairPerMender * counts.mender
  };
}

/**
 * Builds a weapon descriptor from the modules still standing. Every surviving module counts,
 * online or not. The result holds plain data only, so it can be stored or sent as JSON.
 * @param {{ level: number, modules: ReadonlyMap<string, { type: ModuleType, q: number, r: number, hp: number }> }} state
 * @returns {WeaponDescriptor}
 */
export function forgeWeapon(state) {
  const all = [...state.modules.values()].filter((module) => module.hp > 0);
  const core = all.find((module) => module.type === 'core') ?? { q: 0, r: 0 };
  const cells = all
    .map((module) => ({ q: module.q - core.q, r: module.r - core.r, type: module.type }))
    .sort((a, b) => a.r - b.r || a.q - b.q);
  const counts = emptyCounts();
  for (const cell of cells) if (cell.type !== 'core') counts[cell.type]++;
  return {
    version: 1,
    level: state.level + 1,
    silhouette: cells.map(({ q, r }) => ({ q, r })),
    cells,
    counts,
    size: cells.length,
    stats: weaponStats(counts)
  };
}

/**
 * Places a silhouette on a grid: turns it in 60 degree steps, then moves it to `origin`.
 * @param {readonly Hex[]} silhouette
 * @param {Hex} origin
 * @param {number} [steps]
 * @returns {Hex[]}
 */
export function stampSilhouette(silhouette, origin, steps = 0) {
  return silhouette.map((offset) => {
    const turned = rotateHex(offset, steps);
    return { q: turned.q + origin.q, r: turned.r + origin.r };
  });
}

/** Lookup set for a stamped silhouette. @param {readonly Hex[]} hexes */
export const hexSet = (hexes) => new Set(hexes.map((hex) => hexKey(hex.q, hex.r)));

/** Module types in palette order that a weapon contains, for legends. @param {WeaponDescriptor} weapon */
export const weaponTypes = (weapon) => BUILDABLE.filter((type) => weapon.counts[/** @type {keyof ModuleCounts} */ (type)] > 0);
