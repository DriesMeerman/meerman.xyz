// Scripted build policies and a headless level runner. The balance test uses them to check that the
// numbers in data.js and levels.js give the intended difficulty, and they double as a quick way to
// try a tuning change: `node -e "import('./src/lib/thingies/hexfall/policy.js').then(m => console.log(m.playLevel(0, 1, m.POLICIES.generalist)))"`.
import { DIRECTIONS, disk, hexDistance, hexKey } from './hex.js';
import { FIXED_DT, ISLAND_RADIUS, MODULES } from './data.js';
import { hasPowerAt } from './network.js';
import { forgeWeapon } from './forge.js';
import { coreOf, createLevel, placeModule, placementError, startWave, step } from './sim.js';

/** @typedef {import('./data.js').ModuleType} ModuleType */
/** @typedef {import('./sim.js').LevelState} LevelState */
/** @typedef {(state: LevelState) => void} Policy */

/** Hexes ordered from the core outward, alternating sides so a build spreads evenly. */
const SPREAD = disk(ISLAND_RADIUS)
  .slice(1)
  .map((hex, index) => ({ hex, index }))
  .sort((a, b) => hexDistance(a.hex, { q: 0, r: 0 }) - hexDistance(b.hex, { q: 0, r: 0 }) || ((a.index * 7) % 6) - ((b.index * 7) % 6) || a.index - b.index)
  .map((entry) => entry.hex);

/**
 * The next sensible hex for a module: land, free, next to the structure, and powered unless the
 * module is a power source. Null when there is none.
 * @param {LevelState} state
 * @param {ModuleType} type
 */
export function pickSpot(state, type) {
  for (const hex of SPREAD) {
    const key = hexKey(hex.q, hex.r);
    if (!state.land.has(key) || state.modules.has(key)) continue;
    if (!DIRECTIONS.some((d) => state.modules.get(hexKey(hex.q + d.q, hex.r + d.r))?.linked)) continue;
    const powered = hasPowerAt(state.modules, hex.q, hex.r);
    // Sources go just outside the powered area to extend it; everything else must be powered.
    if (MODULES[type].source ? powered && hexDistance(hex, { q: 0, r: 0 }) < 2 : !powered) continue;
    return hex;
  }
  return null;
}

/**
 * A policy that buys the next module in `order` as soon as it can pay for it, looping the tail.
 * When a module has no powered spot, it buys a Dynamo first.
 * @param {ModuleType[]} order
 * @param {ModuleType[]} [tail] repeated once `order` runs out
 * @returns {() => Policy}
 */
export function buildOrder(order, tail = ['rivet']) {
  return () => {
    let index = 0;
    return (state) => {
      for (let guard = 0; guard < 8; guard++) {
        let type = index < order.length ? order[index] : tail[(index - order.length) % tail.length];
        let spot = pickSpot(state, type);
        let extra = false;
        if (!spot && !MODULES[type].source) {
          type = 'dynamo';
          spot = pickSpot(state, type);
          extra = true;
        }
        if (!spot || placementError(state, type, spot.q, spot.r)) return;
        placeModule(state, type, spot.q, spot.r);
        if (!extra) index++;
      }
    };
  };
}

/** Policy factories. Each call returns a fresh policy with its own position in the build order. */
export const POLICIES = {
  /** Builds nothing. */
  idle: () => () => {},
  /** A first time player: mostly guns, one of everything else, the same order on every level. */
  generalist: buildOrder(['rivet', 'rivet', 'rivet', 'mire', 'rivet', 'lance', 'mender', 'rivet', 'rivet', 'dynamo', 'lance', 'rivet', 'mire'], ['rivet', 'rivet', 'lance']),
  /** Guns only. */
  rivets: buildOrder([], ['rivet']),
  /** Leans on beams, the answer to armor. */
  lancer: buildOrder(['rivet', 'lance', 'rivet', 'lance', 'mire', 'lance', 'mender', 'rivet', 'lance', 'dynamo'], ['lance', 'rivet', 'lance'])
};

/**
 * @typedef {object} LevelResult
 * @property {boolean} won
 * @property {number} wave last wave started
 * @property {number} time seconds simulated
 * @property {number} coreHp share of core health left, 0 to 1
 * @property {number} landLeft land hexes still standing
 * @property {number} modules modules standing, core included
 * @property {number} modulesLost
 * @property {number} credits unspent currency
 * @property {import('./forge.js').WeaponDescriptor | null} weapon
 */

/**
 * Plays one level with a policy and no rendering. The policy runs twice a second and whenever a
 * wave ends; the next wave starts as soon as the policy has had its turn.
 * @param {number} level
 * @param {number} seed
 * @param {() => Policy} makePolicy
 * @param {{ maxSeconds?: number }} [options]
 * @returns {LevelResult}
 */
export function playLevel(level, seed, makePolicy, { maxSeconds = 900 } = {}) {
  const state = createLevel({ level, seed });
  const policy = makePolicy();
  const thinkEvery = Math.round(0.5 / FIXED_DT);
  let ticks = 0;
  while (state.phase !== 'won' && state.phase !== 'lost' && state.time < maxSeconds) {
    if (state.phase === 'build') {
      policy(state);
      startWave(state);
    } else if (ticks % thinkEvery === 0) {
      policy(state);
    }
    step(state, FIXED_DT);
    state.events.length = 0;
    ticks++;
  }
  const core = coreOf(state);
  return {
    won: state.phase === 'won',
    wave: state.wave,
    time: state.time,
    coreHp: core ? core.hp / core.maxHp : 0,
    landLeft: state.land.size,
    modules: state.modules.size,
    modulesLost: state.stats.modulesLost,
    credits: state.credits,
    weapon: state.phase === 'won' ? forgeWeapon(state) : null
  };
}
