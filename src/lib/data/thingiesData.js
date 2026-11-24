/**
 * Entries on `/thingies`, in display order. An entry without `href` shows as not available yet.
 * Tags are lowercase ids. Add a label to `thingyTags` when a new tag needs nicer text than its id.
 *
 * @typedef {{
 *   id: string,
 *   title: string,
 *   description: string,
 *   tags: string[],
 *   href?: string
 * }} Thingy
 */

/** @type {Record<string, string>} */
export const thingyTags = {
  game: 'Game',
  tool: 'Tool'
};

/** @type {Thingy[]} */
export const thingies = [
  {
    id: 'lab',
    title: 'Lab',
    description: '[DRIES TO ADD SPICE]',
    tags: ['tool'],
    href: '/lab'
  },
  {
    id: 'hex-asteroid-defense',
    title: 'Hex asteroid defense (working title)',
    description: '[DRIES TO ADD SPICE]',
    tags: ['game']
  }
];
