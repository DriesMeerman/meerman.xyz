/** @type {import('../registry.js').WidgetMeta} */
export const meta = {
  id: 'year',
  title: 'Year progress',
  description: 'How far through a year you are. Past years stay full, future years stay empty.',
  size: { width: 640, height: 220 },
  options: [
    { key: 'year', label: 'Year', type: 'number', default: '', placeholder: 'this year', hint: 'Pin a year, for example 2025 on last year\'s dashboard.' },
    { key: 'seasons', label: 'Season strip', type: 'select', choices: ['on', 'off'], default: 'on' },
    { key: 'precision', label: 'Decimals', type: 'select', choices: ['0', '1', '2', '4'], default: '2' }
  ],
  load: () => import('./YearWidget.svelte')
};
