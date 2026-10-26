/**
 * Article entry from the generated `/feed.json` (see `tools/lib/types.ts`).
 * @typedef {{
 *   ID: number | string,
 *   slug?: string,
 *   filename?: string,
 *   title: string,
 *   summary: string,
 *   date: string,
 *   author: string,
 *   tags: string[],
 *   sourceType?: 'md' | 'html',
 *   enableCustomJs?: boolean
 * }} FeedItem
 */

/** @type {import('./$types').PageLoad} */
export async function load({ params, fetch }) {
  const slug = params.slug.split('#')[0];
  const res = await fetch('/feed.json');
  /** @type {FeedItem | null} */
  let meta = null;
  if (res.ok) {
    /** @type {FeedItem[]} */
    const items = await res.json();
    meta = items.find((i) => i.slug === slug || i.filename?.replace(/\.md$/, '') === slug) || null;
  }
  return { slug, meta };
}
