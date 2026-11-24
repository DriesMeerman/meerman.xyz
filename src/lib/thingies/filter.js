/** @typedef {import('$lib/data/thingiesData.js').Thingy} Thingy */

/**
 * Every tag used by the entries, in order of first use.
 * @param {Thingy[]} entries
 */
export function tagsOf(entries) {
  return [...new Set(entries.flatMap((entry) => entry.tags))];
}

/**
 * Keeps the entries that match the search and the selected tags.
 * Each word of the query has to appear in the title, description or a tag (case-insensitive).
 * With tags selected, an entry needs at least one of them. No tags selected means no tag filter.
 * @param {Thingy[]} entries
 * @param {{ query?: string, tags?: string[] }} filter
 */
export function filterThingies(entries, { query = '', tags = [] } = {}) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return entries.filter((entry) => {
    if (tags.length > 0 && !entry.tags.some((tag) => tags.includes(tag))) return false;
    const text = [entry.title, entry.description, ...entry.tags].join(' ').toLowerCase();
    return words.every((word) => text.includes(word));
  });
}
