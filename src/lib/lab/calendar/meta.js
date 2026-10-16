/** @type {import('../registry.js').WidgetMeta} */
export const meta = {
  id: 'calendar',
  title: 'Calendar',
  description: 'Glass month calendar with Dutch holidays and events.',
  size: { width: 520, height: 340 },
  options: [
    { key: 'month', label: 'Month', type: 'month', default: '', hint: 'Show a fixed month. Leave empty to follow the clock.' },
    { key: 'events', label: 'Events', type: 'select', choices: ['on', 'off'], default: 'on', hint: 'Holidays and notable days next to the grid.' },
    { key: 'weeks', label: 'Week numbers', type: 'select', choices: ['off', 'on'], default: 'off', hint: 'ISO week numbers in front of each row.' },
    { key: 'lang', label: 'Language', type: 'select', choices: ['nl', 'en'], default: 'nl', hint: 'Day and month names.' }
  ],
  load: () => import('./CalendarWidget.svelte')
};
