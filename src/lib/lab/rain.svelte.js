// Lab-wide matrix rain: one field for the page, settings that round-trip through the URL,
// and a context so every HudPanel below the lab page can show it.
import { getContext, setContext } from 'svelte';
import { RAIN_CURVES, RAIN_DEFAULTS, RainField } from '$lib/effects/matrix-rain/field.js';

/** @typedef {import('$lib/effects/matrix-rain/field.js').RainSettings} RainSettings */
/** @typedef {import('$lib/effects/matrix-rain/field.js').CurvePoint} CurvePoint */

const KEY = Symbol('lab-rain');

/**
 * @typedef {object} RainSlider
 * @property {'every' | 'length' | 'speed' | 'density' | 'size' | 'strength'} key
 * @property {string} label
 * @property {number} min
 * @property {number} max
 * @property {number} step
 * @property {string} unit
 * @property {string} hint
 */

/** @type {RainSlider[]} */
export const rainSliders = [
  { key: 'every', label: 'Every', min: 10, max: 600, step: 5, unit: 's', hint: 'Average wait between bursts.' },
  { key: 'length', label: 'Burst length', min: 2, max: 30, step: 1, unit: 's', hint: 'How long the curve takes.' },
  { key: 'speed', label: 'Speed', min: 0.3, max: 3, step: 0.1, unit: '×', hint: 'How fast the drops fall.' },
  { key: 'density', label: 'Density', min: 0.1, max: 1, step: 0.05, unit: '', hint: 'Columns raining at 100% on the curve.' },
  { key: 'size', label: 'Glyph size', min: 9, max: 24, step: 1, unit: 'px', hint: 'Larger glyphs mean fewer columns.' },
  { key: 'strength', label: 'Strength', min: 0.3, max: 3, step: 0.1, unit: '×', hint: 'Multiplies the theme opacity.' }
];

/**
 * Bundles of start, curve, and length.
 * @type {{ id: string, label: string, hint: string, settings: Pick<RainSettings, 'start' | 'curve' | 'length'> }[]}
 */
export const rainPresets = [
  { id: 'classic', label: 'Classic', hint: 'Steady rain, drops appear anywhere.', settings: { start: 'scatter', curve: RAIN_CURVES.steady, length: 7 } },
  { id: 'cascade', label: 'Cascade', hint: 'A curtain from the top that thins out in steps.', settings: { start: 'top', curve: RAIN_CURVES.cascade, length: 14 } },
  { id: 'fade', label: 'Fade out', hint: 'Starts full, thins out quickly, then trails off.', settings: { start: 'scatter', curve: RAIN_CURVES.fade, length: 10 } }
];

/** @param {CurvePoint[]} curve */
export const curveToParam = (curve) => curve.map(([x, y]) => `${x}-${y}`).join('_');

/**
 * Five points, x rising from 0 to 100, everything within 0 to 100. Anything else is ignored.
 * @param {string | null} value
 * @returns {CurvePoint[] | undefined}
 */
function curveFromParam(value) {
  const points = (value ?? '').split('_').map((pair) => /** @type {CurvePoint} */ (pair.split('-').map(Number)));
  const valid =
    points.length === 5 &&
    points.every((point, index) => point.length === 2 && point.every((n) => Number.isFinite(n) && n >= 0 && n <= 100) && (index === 0 || point[0] > points[index - 1][0])) &&
    points[0][0] === 0 &&
    points[4][0] === 100;
  return valid ? points : undefined;
}

/** @param {string} key */
const paramName = (key) => `rain-${key}`;

export class RainControl {
  field;
  enabled = $state(true);
  /** @type {RainSettings} */
  settings = $state({ ...RAIN_DEFAULTS });
  /** URL parameters for the settings as last committed, so embeds and previews do not reload on every slider step. */
  params = $state(/** @type {[string, string][]} */ ([]));
  /** Whether any setting differs from the defaults. */
  changed = $derived(this.#serialize(false).length > 0);
  /** The preset matching the current start and curve, if any. */
  preset = $derived(
    rainPresets.find((preset) => preset.settings.start === this.settings.start && curveToParam(preset.settings.curve) === curveToParam(this.settings.curve))?.id
  );

  /** @param {URLSearchParams} params */
  constructor(params) {
    this.enabled = params.get('rain') !== 'off';
    for (const slider of rainSliders) {
      const value = Number(params.get(paramName(slider.key)));
      if (params.has(paramName(slider.key)) && Number.isFinite(value)) {
        this.settings[slider.key] = Math.min(slider.max, Math.max(slider.min, value));
      }
    }
    if (params.get('rain-start') === 'top') this.settings.start = 'top';
    this.settings.curve = curveFromParam(params.get('rain-curve')) ?? this.settings.curve;
    this.field = new RainField($state.snapshot(this.settings));
    this.field.enabled = this.enabled;
    this.params = this.#serialize();
  }

  /** @param {boolean} enabled */
  setEnabled(enabled) {
    this.enabled = enabled;
    this.field.setEnabled(enabled);
  }

  /** @param {Partial<RainSettings>} settings */
  update(settings) {
    Object.assign(this.settings, settings);
    this.field.set($state.snapshot(this.settings));
  }

  reset() {
    this.update(RAIN_DEFAULTS);
  }

  rainNow() {
    this.field.burst();
  }

  /** Publishes the current settings to `params`. */
  commit() {
    this.params = this.#serialize();
  }

  /** Only values that differ from the defaults, so plain links stay short. */
  #serialize(withEnabled = true) {
    /** @type {[string, string][]} */
    const entries = [];
    if (withEnabled && !this.enabled) entries.push(['rain', 'off']);
    for (const slider of rainSliders) {
      const value = this.settings[slider.key];
      if (value !== RAIN_DEFAULTS[slider.key]) entries.push([paramName(slider.key), String(value)]);
    }
    if (this.settings.start !== RAIN_DEFAULTS.start) entries.push(['rain-start', this.settings.start]);
    const curve = curveToParam(this.settings.curve);
    if (curve !== curveToParam(RAIN_DEFAULTS.curve)) entries.push(['rain-curve', curve]);
    return entries;
  }
}

/** True for every query parameter the rain settings own. */
export const isRainParam = (/** @type {string} */ name) => name === 'rain' || name.startsWith('rain-');

/** @param {RainControl} control */
export const setRainControl = (control) => setContext(KEY, control);

/** @returns {RainControl | undefined} undefined outside the lab, so panels elsewhere stay still */
export const getRainControl = () => getContext(KEY);
