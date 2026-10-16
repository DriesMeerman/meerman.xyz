/** @type {import('../registry.js').WidgetMeta} */
export const meta = {
  id: 'seasons',
  title: 'Seasons',
  description: 'The year as four meteorological season blocks, with live progress, daylight and rotating side quests.',
  size: { width: 560, height: 440 },
  options: [
    { key: 'focus', label: 'Focus', type: 'select', choices: ['all', 'current'], default: 'all', hint: 'Current shows only the active season, good for tiny cards.' },
    { key: 'quests', label: 'Side quests', type: 'select', choices: ['on', 'off'], default: 'on' },
    { key: 'speed', label: 'Quest rotation (s)', type: 'number', default: '6', placeholder: '6', hint: 'Seconds between quests.' },
    { key: 'daylight', label: 'Daylight strip', type: 'select', choices: ['on', 'off'], default: 'on', hint: 'Sunrise, sunset and day length for the location below.' },
    { key: 'lat', label: 'Latitude', type: 'number', default: '52.37', placeholder: '52.37' },
    { key: 'lon', label: 'Longitude', type: 'number', default: '4.90', placeholder: '4.90', hint: 'East is positive. Defaults to Amsterdam.' }
  ],
  load: () => import('./SeasonsWidget.svelte')
};
