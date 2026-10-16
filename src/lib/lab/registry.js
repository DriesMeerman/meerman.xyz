// Widget registry for the lab. Each widget owns a `meta.js` in its folder; this file only collects them.
import { meta as year } from './year/meta.js';
import { meta as calendar } from './calendar/meta.js';
import { meta as seasons } from './seasons/meta.js';
import { meta as dice } from './dice/meta.js';
import { meta as orb } from './orb/meta.js';

/**
 * @typedef {object} WidgetOption
 * @property {string} key query parameter name
 * @property {string} label
 * @property {'select' | 'number' | 'text' | 'month' | 'date'} type
 * @property {string[]} [choices] values for `select`
 * @property {string} [default] value used when the parameter is missing (empty means "follow the clock")
 * @property {string} [placeholder]
 * @property {string} [hint] one short line shown in the embed builder
 */

/**
 * @typedef {object} WidgetMeta
 * @property {string} id value for `?w=`
 * @property {string} title
 * @property {string} description one line for the embed builder
 * @property {{ width: number, height: number }} size suggested embed size in pixels
 * @property {WidgetOption[]} options
 * @property {() => Promise<{ default: import('svelte').Component<WidgetProps> }>} load
 */

/**
 * Props every widget component receives.
 * @typedef {object} WidgetProps
 * @property {Record<string, string>} options resolved option values, defaults applied
 * @property {import('./clock.svelte.js').LabClock} clock read `clock.now` for the current date
 * @property {boolean} embedded true when shown alone through `?w=`
 */

/** @type {WidgetMeta[]} */
export const widgets = [year, calendar, seasons, dice, orb];

/** @param {string} id */
export function findWidget(id) {
  return widgets.find((widget) => widget.id === id);
}

/**
 * Options shared by every embed.
 * @type {WidgetOption[]}
 */
export const globalOptions = [
  { key: 'theme', label: 'Theme', type: 'select', choices: ['auto', 'dark', 'light'], default: 'auto', hint: 'Auto follows the system colour scheme.' },
  { key: 'frame', label: 'Frame', type: 'select', choices: ['on', 'off'], default: 'on', hint: 'Turn off when the canvas card already draws a border.' },
  { key: 'date', label: 'Pretend date', type: 'date', default: '', hint: 'Freeze the clock on a date. Leave empty to follow the computer.' }
];

/**
 * @param {WidgetOption[]} options
 * @param {URLSearchParams} params
 */
export function resolveOptions(options, params) {
  /** @type {Record<string, string>} */
  const resolved = {};
  for (const option of options) {
    const value = params.get(option.key)?.trim() ?? '';
    const valid = value !== '' && (option.type !== 'select' || option.choices?.includes(value));
    resolved[option.key] = valid ? value : (option.default ?? '');
  }
  return resolved;
}
