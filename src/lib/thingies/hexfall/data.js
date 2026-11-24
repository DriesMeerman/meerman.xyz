// Rules and numbers for Hexfall. Everything a balance pass needs to touch lives in this file and in
// levels.js. Ranges are in hex steps (centre to adjacent centre); the simulation converts to world units.

/** @typedef {'core' | 'rivet' | 'lance' | 'mire' | 'dynamo' | 'mender'} ModuleType */
/** @typedef {'grit' | 'dart' | 'slag' | 'monolith'} RockType */

/**
 * @typedef {object} ModuleDef
 * @property {ModuleType} id
 * @property {string} name
 * @property {string} role short functional label for the HUD
 * @property {number} cost
 * @property {number} hp
 * @property {number} [range] hex steps: weapon reach, slow radius, or repair reach
 * @property {number} [damage] per shot
 * @property {number} [cooldown] seconds between shots
 * @property {number} [shotSpeed] world units per second; missing means the shot lands instantly
 * @property {boolean} [pierce] ignores rock armor
 * @property {number} [slow] share of rock speed removed inside the field, 0 to 1
 * @property {number} [heal] hit points per second given to each module in reach
 * @property {boolean} [source] powers modules within POWER_RANGE without needing power itself
 */

/** Hexes from the core hex to the edge of a level island. */
export const ISLAND_RADIUS = 3;

/** Modules work within this many hex steps of the core or of a linked Dynamo. */
export const POWER_RANGE = 2;

/** Hit points of one bare land hex. */
export const LAND_HP = 20;

/** Rocks appear on a circle of this radius (world units) around the core. */
export const SPAWN_RADIUS = 13;

/** Rocks that fly this far past the island without hitting anything are dropped. */
export const DESPAWN_RADIUS = SPAWN_RADIUS + 3;

/** Share of the build cost paid back when selling, scaled by the module's remaining health. */
export const SELL_REFUND = 0.6;

/** The simulation always advances in steps of this many seconds. */
export const FIXED_DT = 1 / 60;

/** @type {Record<ModuleType, ModuleDef>} */
export const MODULES = {
  core: { id: 'core', name: 'Core', role: 'Lose it and the level ends', cost: 0, hp: 200, source: true },
  rivet: { id: 'rivet', name: 'Rivet', role: 'Gun', cost: 40, hp: 60, range: 2.9, damage: 8, cooldown: 0.4, shotSpeed: 16 },
  lance: { id: 'lance', name: 'Lance', role: 'Beam', cost: 90, hp: 50, range: 4.5, damage: 60, cooldown: 2.4, pierce: true },
  mire: { id: 'mire', name: 'Mire', role: 'Slow field', cost: 60, hp: 60, range: 2.2, slow: 0.45 },
  dynamo: { id: 'dynamo', name: 'Dynamo', role: 'Power', cost: 50, hp: 80, source: true },
  mender: { id: 'mender', name: 'Mender', role: 'Repair', cost: 70, hp: 50, range: 1, heal: 4 }
};

/** Build palette order. The core is placed by the level, never by the player. */
export const BUILDABLE = /** @type {readonly ModuleType[]} */ (Object.freeze(['rivet', 'lance', 'mire', 'dynamo', 'mender']));

/**
 * @typedef {object} RockDef
 * @property {RockType} id
 * @property {string} name
 * @property {number} hp
 * @property {number} speed world units per second
 * @property {number} damage total damage the rock can deal before it breaks up
 * @property {number} armor removed from every non-piercing hit, down to a minimum of 1
 * @property {number} radius world units, for drawing and for shot contact
 * @property {number} reward currency paid when a module destroys it
 */

/** @type {Record<RockType, RockDef>} */
export const ROCKS = {
  grit: { id: 'grit', name: 'Grit', hp: 14, speed: 1.5, damage: 10, armor: 0, radius: 0.26, reward: 3 },
  dart: { id: 'dart', name: 'Dart', hp: 10, speed: 3.4, damage: 12, armor: 0, radius: 0.22, reward: 4 },
  slag: { id: 'slag', name: 'Slag', hp: 80, speed: 1.0, damage: 30, armor: 6, radius: 0.42, reward: 12 },
  monolith: { id: 'monolith', name: 'Monolith', hp: 520, speed: 0.55, damage: 160, armor: 3, radius: 0.95, reward: 50 }
};

/** Currency paid when wave number `wave` (1 based) is cleared. @param {number} wave */
export const waveBonus = (wave) => 20 + 10 * wave;
