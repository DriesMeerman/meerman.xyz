const corePages = [
  { id: 'home', label: 'Home', path: '/' },
  { id: 'skills', label: 'Skills', path: '/skills' },
  { id: 'experience', label: 'Experience', path: '/experience' },
  { id: 'education', label: 'Education', path: '/education' },
  { id: 'blog', label: 'Blog', path: '/blog' }
];

export const historyViewport = { width: 1440, height: 1000 };

/**
 * @typedef {{ version: string; date: string | null; revision: string | null; title: string; highlights: string[]; pages: { id: string; label: string; path: string }[]; sourceUrl?: string; originalTheme?: boolean }} HistoryRelease
 */

/** @type {HistoryRelease[]} */
export const siteHistory = [
  {
    version: '0',
    date: null,
    revision: null,
    title: 'Where it all started',
    highlights: ['Single-page profile', 'Expandable skill lists', 'The first particles'],
    pages: [{ id: 'home', label: 'Home', path: '/' }],
    sourceUrl: 'https://old.meerman.xyz/',
    originalTheme: true
  },
  {
    version: '1.1.0',
    date: '2023-06-21',
    revision: 'cdf63e2304087e11d87f68ae5dbc4374c41dc3a3',
    title: 'The original loadout',
    highlights: ['Trading-card skills', 'The first blog post', 'Light and dark modes'],
    pages: corePages
  },
  {
    version: '2.2.0',
    date: '2023-12-13',
    revision: '95b7d56b895375b4708bf0d1968a37f1c6d4cca6',
    title: 'A growing journal',
    highlights: ['Digital Reflections', 'Updated work history', 'Svelte 4'],
    pages: corePages
  },
  {
    version: '3.1.0',
    date: '2026-02-26',
    revision: '6392e617279012412299c78d3e824e27e114bc3c',
    title: 'New routes, familiar character',
    highlights: ['Refreshed timelines', 'The Tools page', 'SvelteKit'],
    pages: [...corePages, { id: 'tools', label: 'Tools', path: '/tools' }]
  },
  {
    version: '4.0.0',
    date: '2026-10-04',
    revision: 'f47a6ce1d91ca66117abfd7a260d37a5c5c9eeae',
    title: 'One visual language',
    highlights: ['A shared design system', 'Meerman Industries', 'Leadership cards and cats'],
    pages: [
      ...corePages,
      { id: 'tools', label: 'Tools', path: '/tools' },
      { id: 'industries', label: 'Industries', path: '/industries' },
      { id: 'cats', label: 'Cats', path: '/cats' }
    ]
  }
];

/** @param {string} date */
export function formatReleaseDate(date) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
}

/** @param {string} version @param {string} page @param {string} theme @param {boolean} [full] */
export function historyImage(version, page, theme, full = false) {
  return `/site-history/${version}/${page}-${theme}${full ? '-full' : ''}.webp`;
}
