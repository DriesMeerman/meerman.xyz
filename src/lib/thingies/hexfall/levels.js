// Wave definitions. Each level leans on one rock type so the three builds, and the three weapons
// forged from them, come out different.

/**
 * @typedef {object} SpawnGroup
 * @property {import('./data.js').RockType} type
 * @property {number} count
 * @property {number} start seconds after the wave starts
 * @property {number} interval seconds between rocks in the group
 * @property {number} [arc] spread in radians around the wave's bearing; missing means all directions
 */

/** @typedef {{ groups: SpawnGroup[] }} WaveDef */

/**
 * @typedef {object} LevelDef
 * @property {string} id
 * @property {string} name
 * @property {import('./data.js').RockType} leansOn
 * @property {number} startCredits
 * @property {WaveDef[]} waves
 */

/** @type {LevelDef[]} */
export const LEVELS = [
  {
    id: 'swarm',
    name: 'Level 1',
    leansOn: 'grit',
    startCredits: 160,
    waves: [
      { groups: [{ type: 'grit', count: 14, start: 0, interval: 1.6 }] },
      { groups: [{ type: 'grit', count: 22, start: 0, interval: 1.2 }, { type: 'dart', count: 3, start: 14, interval: 3 }] },
      { groups: [{ type: 'grit', count: 16, start: 0, interval: 0.5, arc: 1.2 }, { type: 'grit', count: 18, start: 10, interval: 1.1 }] },
      {
        groups: [
          { type: 'grit', count: 34, start: 0, interval: 0.8 },
          { type: 'dart', count: 5, start: 8, interval: 3.2 },
          { type: 'monolith', count: 1, start: 12, interval: 1 }
        ]
      }
    ]
  },
  {
    id: 'streak',
    name: 'Level 2',
    leansOn: 'dart',
    startCredits: 200,
    waves: [
      { groups: [{ type: 'dart', count: 12, start: 0, interval: 1.8 }, { type: 'grit', count: 8, start: 4, interval: 2.2 }] },
      { groups: [{ type: 'dart', count: 12, start: 0, interval: 0.7, arc: 1.4 }, { type: 'dart', count: 12, start: 12, interval: 1.4 }] },
      { groups: [{ type: 'dart', count: 26, start: 0, interval: 1.0 }, { type: 'grit', count: 16, start: 2, interval: 1.4 }, { type: 'slag', count: 2, start: 10, interval: 8 }] },
      {
        groups: [
          { type: 'dart', count: 32, start: 0, interval: 0.85 },
          { type: 'grit', count: 14, start: 5, interval: 1.6 },
          { type: 'monolith', count: 1, start: 10, interval: 1 }
        ]
      }
    ]
  },
  {
    id: 'plate',
    name: 'Level 3',
    leansOn: 'slag',
    startCredits: 240,
    waves: [
      { groups: [{ type: 'slag', count: 5, start: 0, interval: 4.5 }, { type: 'grit', count: 10, start: 2, interval: 2 }] },
      { groups: [{ type: 'slag', count: 8, start: 0, interval: 3.2 }, { type: 'dart', count: 10, start: 6, interval: 1.8 }] },
      { groups: [{ type: 'slag', count: 7, start: 0, interval: 1.6, arc: 1.2 }, { type: 'slag', count: 6, start: 14, interval: 3 }, { type: 'grit', count: 20, start: 4, interval: 1.1 }] },
      {
        groups: [
          { type: 'slag', count: 14, start: 0, interval: 2.2 },
          { type: 'dart', count: 14, start: 6, interval: 1.6 },
          { type: 'grit', count: 16, start: 3, interval: 1.5 },
          { type: 'monolith', count: 1, start: 8, interval: 1 },
          { type: 'monolith', count: 1, start: 24, interval: 1 }
        ]
      }
    ]
  }
];

/** Seconds from a wave's start until its last rock has spawned. @param {WaveDef} wave */
export function waveSpawnSeconds(wave) {
  return Math.max(...wave.groups.map((group) => group.start + (group.count - 1) * group.interval));
}
