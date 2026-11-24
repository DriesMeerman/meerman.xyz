// Run state: which level the player is on and the weapons forged so far. Phase two reads `weapons`.
import { LEVELS } from './levels.js';

/**
 * @typedef {object} Run
 * @property {number} seed
 * @property {number} level index into LEVELS
 * @property {number} attempt retries of the current level, mixed into the level seed
 * @property {(import('./forge.js').WeaponDescriptor | null)[]} weapons one slot per level, null until that level is won
 * @property {boolean} complete every level is won
 */

/**
 * @param {number} seed
 * @param {number} [level] starting level index
 * @returns {Run}
 */
export function createRun(seed, level = 0) {
  return { seed: seed >>> 0, level: clampLevel(level), attempt: 0, weapons: LEVELS.map(() => null), complete: false };
}

/** @param {number} level */
export const clampLevel = (level) => (Number.isFinite(level) ? Math.min(LEVELS.length - 1, Math.max(0, Math.trunc(level))) : 0);

/**
 * Stores the weapon forged from the level that was just won.
 * @param {Run} run
 * @param {import('./forge.js').WeaponDescriptor} weapon
 */
export function recordWeapon(run, weapon) {
  run.weapons[run.level] = weapon;
  if (run.level >= LEVELS.length - 1) run.complete = true;
}

/** Moves on to the next level. Returns false on the last one. @param {Run} run */
export function advance(run) {
  if (run.level >= LEVELS.length - 1) return false;
  run.level++;
  run.attempt = 0;
  return true;
}

/** Another try at the current level, with different rocks. @param {Run} run */
export function retry(run) {
  run.attempt++;
}

/**
 * Reads `seed` and `level` from the query string. `level` is 1 based in the URL.
 * @param {URLSearchParams} params
 * @param {() => number} [fallbackSeed]
 * @returns {{ seed: number, level: number, seeded: boolean }}
 */
export function parseRunParams(params, fallbackSeed = () => Math.floor(Math.random() * 0xffffffff)) {
  const rawSeed = params.get('seed');
  const parsed = rawSeed === null || rawSeed.trim() === '' ? NaN : Number(rawSeed);
  const seeded = Number.isFinite(parsed);
  const seed = (seeded ? Math.trunc(parsed) : fallbackSeed()) >>> 0;
  const level = clampLevel(Number(params.get('level') ?? '1') - 1);
  return { seed, level, seeded };
}
