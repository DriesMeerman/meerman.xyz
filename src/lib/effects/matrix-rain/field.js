// One rain simulation, seen through any number of canvases. Drops live in page coordinates, so the rain
// lines up across panels and keeps falling while you scroll. Idle, a field holds one timer and every
// canvas is 0x0. During a burst a single animation loop draws into the canvases on screen.

/**
 * A point on a burst's intensity curve: x is percent of the burst length, y is percent of `density`.
 * @typedef {[number, number]} CurvePoint
 */

/**
 * @typedef {object} RainSettings
 * @property {number} every average seconds between automatic bursts (each wait is 0.5 to 1.5 times this)
 * @property {number} length seconds the intensity curve takes; drops still falling at the end fade out
 * @property {number} speed multiplier on drop speed
 * @property {number} density share of columns that rain at 100% intensity, 0 to 1
 * @property {number} size glyph size in pixels
 * @property {number} strength multiplier on `--matrix-rain-opacity`
 * @property {'scatter' | 'top'} start where drops appear: anywhere near the view, or in a curtain from the top
 * @property {CurvePoint[]} curve intensity over the burst, five points with x running from 0 to 100
 */

/** @type {Record<'steady' | 'cascade' | 'fade', CurvePoint[]>} */
export const RAIN_CURVES = {
  steady: [[0, 100], [25, 100], [50, 100], [75, 100], [100, 100]],
  // A heavy opening, a quick fall to a middle plateau, another quick fall, then a few stragglers.
  cascade: [[0, 100], [14, 38], [52, 32], [62, 7], [100, 4]],
  // Thins out quickly at first, then trails off.
  fade: [[0, 100], [25, 68], [51, 37], [73, 13], [100, 0]]
};

/** @type {RainSettings} */
export const RAIN_DEFAULTS = {
  every: 90,
  length: 7,
  speed: 1,
  density: 0.8,
  size: 13,
  strength: 1,
  start: 'scatter',
  curve: RAIN_CURVES.fade
};

/**
 * Intensity from 0 to 1 at `t` (0 to 1 through the burst), interpolated linearly between points.
 * @param {CurvePoint[]} curve
 * @param {number} t
 */
export function sampleCurve(curve, t) {
  const x = t * 100;
  for (let index = 1; index < curve.length; index += 1) {
    const [x1, y1] = curve[index];
    if (x > x1) continue;
    const [x0, y0] = curve[index - 1];
    const share = x1 === x0 ? 1 : (x - x0) / (x1 - x0);
    return (y0 + (y1 - y0) * share) / 100;
  }
  return curve[curve.length - 1][1] / 100;
}

// Half-width katakana, digits, and a few symbols, like the film.
const GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789:.=*+<>¦';
const FPS = 24;
const FADE_MS = 1200;
const LOOP_GAP_MS = 900;
const FONT = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

/** @param {number} min @param {number} max */
const between = (min, max) => min + Math.random() * (max - min);
const glyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/** @template T @param {T[]} items */
const pick = (items) => items.splice(Math.floor(Math.random() * items.length), 1)[0];

/**
 * @typedef {object} RainView
 * @property {HTMLCanvasElement} canvas
 * @property {CanvasRenderingContext2D | null} context
 * @property {boolean} visible
 * @property {string} color
 * @property {number} width
 * @property {number} height
 */

/** @typedef {{ left: number, top: number, width: number, height: number }} Region */

export class RainField {
  /** @type {RainSettings} */
  settings;
  enabled = true;
  /** When false, bursts only start through `burst()` (or `loop`). */
  auto = true;
  running = false;
  /** Rains inside its only canvas instead of the viewport; for previews and standalone use. */
  local;
  /** Starts the next burst shortly after one ends, for previews. */
  loop;
  /** @type {((seconds: number) => void) | undefined} called whenever a burst starts or restarts, with its length */
  onburst;

  /** @type {Map<HTMLCanvasElement, RainView>} */
  #views = new Map();
  /** @type {IntersectionObserver | undefined} */
  #observer;
  /** @type {{ x: number, y: number, speed: number, live: boolean }[]} */
  #columns = [];
  #timer = 0;
  #releaseTimer = 0;
  #frame = 0;
  #lastFrame = 0;
  #startedAt = 0;

  /**
   * @param {Partial<RainSettings>} [settings]
   * @param {{ local?: boolean, loop?: boolean }} [options]
   */
  constructor(settings = {}, { local = false, loop = false } = {}) {
    this.settings = { ...RAIN_DEFAULTS, ...settings };
    this.local = local;
    this.loop = loop;
  }

  /**
   * Shows the field through a canvas that fills a positioned element. Returns the detach function.
   * @param {HTMLCanvasElement} canvas
   */
  attach(canvas) {
    this.#observer ??= new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const view = this.#views.get(/** @type {HTMLCanvasElement} */ (entry.target));
        if (!view) continue;
        view.visible = entry.isIntersecting;
        // Trails stop fading while a view is off screen, so drop them instead of showing stale ones later.
        if (!view.visible) view.context?.clearRect(0, 0, view.width, view.height);
      }
    });
    /** @type {RainView} */
    const view = { canvas, context: null, visible: false, color: '', width: 0, height: 0 };
    this.#views.set(canvas, view);
    this.#observer.observe(canvas);
    canvas.style.setProperty('--matrix-rain-strength', String(this.settings.strength));
    if (this.running) this.#prepare(view);
    else if (this.#views.size === 1) this.#schedule();

    return () => {
      this.#observer?.unobserve(canvas);
      this.#views.delete(canvas);
      if (this.#views.size === 0) this.#halt();
    };
  }

  /** @param {Partial<RainSettings>} settings */
  set(settings) {
    const before = this.settings;
    this.settings = { ...before, ...settings };
    for (const { canvas } of this.#views.values()) canvas.style.setProperty('--matrix-rain-strength', String(this.settings.strength));
    if (this.settings.every !== before.every && !this.running) this.#schedule();
    if (this.running && this.settings.size !== before.size) this.#seed();
  }

  /** @param {boolean} enabled */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (enabled) this.#schedule();
    else this.#halt();
  }

  /** Starts a fresh burst, wiping one that is still running. Ignored while disabled. */
  burst() {
    if (!this.enabled) return;
    if (!this.running) return this.#start();
    for (const view of this.#views.values()) view.context?.clearRect(0, 0, view.width, view.height);
    this.#begin();
  }

  destroy() {
    this.#halt();
    this.#observer?.disconnect();
    this.#views.clear();
  }

  #schedule() {
    clearTimeout(this.#timer);
    if (!this.enabled || this.#views.size === 0 || !(this.auto || this.loop)) return;
    const wait = this.loop ? LOOP_GAP_MS : this.settings.every * between(0.5, 1.5) * 1000;
    this.#timer = window.setTimeout(() => {
      const quiet = document.hidden || reducedMotion() || ![...this.#views.values()].some((view) => view.visible);
      if (quiet) this.#schedule();
      else this.#start();
    }, wait);
  }

  #start() {
    clearTimeout(this.#timer);
    if (this.running || this.#views.size === 0) return;
    clearTimeout(this.#releaseTimer);
    this.running = true;
    for (const view of this.#views.values()) this.#prepare(view);
    this.#begin();
    this.#lastFrame = 0;
    this.#frame = requestAnimationFrame(this.#tick);
  }

  #begin() {
    this.#startedAt = performance.now();
    this.#seed();
    this.onburst?.(this.settings.length);
  }

  /** The area drops fall through, in page coordinates. */
  #region() {
    const first = this.#views.values().next().value;
    if (this.local && first) {
      const rect = first.canvas.getBoundingClientRect();
      return { left: rect.left + window.scrollX, top: rect.top + window.scrollY, width: rect.width, height: rect.height };
    }
    return { left: 0, top: window.scrollY, width: document.documentElement.scrollWidth, height: window.innerHeight };
  }

  /** @param {Region} region @param {boolean} [first] true for the opening drops of a burst */
  #spawnY(region, first = false) {
    const { size, start } = this.settings;
    if (start === 'top') return region.top - between(0, first ? 6 : 3) * size;
    return region.top + region.height * (first ? between(-0.7, 0.3) : between(-0.4, 0.5));
  }

  /** Lays out columns across the region and lights the opening share of them. */
  #seed() {
    const region = this.#region();
    const { size, density, curve } = this.settings;
    const share = density * sampleCurve(curve, 0);
    this.#columns = Array.from({ length: Math.ceil(region.width / size) }, (_, index) => ({
      x: region.left + index * size,
      y: this.#spawnY(region, true),
      speed: between(0.5, 1),
      live: Math.random() < share
    }));
  }

  /** @param {RainView} view */
  #prepare(view) {
    const { canvas } = view;
    view.width = canvas.clientWidth;
    view.height = canvas.clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(view.width * ratio);
    canvas.height = Math.round(view.height * ratio);
    view.context = canvas.getContext('2d');
    view.context?.setTransform(ratio, 0, 0, ratio, 0, 0);
    const style = getComputedStyle(canvas);
    view.color = style.getPropertyValue('--matrix-rain-color').trim() || style.color;
    canvas.classList.add('running');
  }

  /** @param {number} now */
  #tick = (now) => {
    this.#frame = requestAnimationFrame(this.#tick);
    if (now - this.#lastFrame < 1000 / FPS) return;
    this.#lastFrame = now;

    const { size, speed, density, curve, length } = this.settings;
    const region = this.#region();
    const progress = (now - this.#startedAt) / (length * 1000);
    const target = progress < 1 ? Math.round(this.#columns.length * density * sampleCurve(curve, progress)) : 0;
    const live = this.#columns.filter((column) => column.live);
    const dark = this.#columns.filter((column) => !column.live);

    // Follow the curve smoothly: cut a share of the surplus mid-fall, or light a share of the shortfall.
    if (live.length > target) {
      for (let count = Math.ceil((live.length - target) * 0.2); count > 0; count -= 1) pick(live).live = false;
    } else if (live.length < target) {
      for (let count = Math.ceil((target - live.length) * 0.3); count > 0 && dark.length; count -= 1) {
        const column = pick(dark);
        column.live = true;
        column.y = this.#spawnY(region);
      }
    }

    /** @type {{ x: number, y: number }[]} */
    const heads = [];
    let lit = 0;
    for (const column of this.#columns) {
      if (!column.live) continue;
      const before = Math.floor(column.y / size);
      column.y += column.speed * speed * size;
      const cell = Math.floor(column.y / size);
      if (cell !== before) heads.push({ x: column.x, y: cell * size });
      // Drops that leave the region (by falling or by scrolling) start over while the curve wants them.
      const outside = column.y > region.top + region.height + size * 2 || column.y < region.top - region.height;
      if (outside && lit >= target) column.live = false;
      else if (outside) column.y = this.#spawnY(region);
      if (column.live) lit += 1;
    }

    for (const view of this.#views.values()) {
      if (!view.visible || !view.context) continue;
      const rect = view.canvas.getBoundingClientRect();
      if (Math.round(rect.width) !== Math.round(view.width) || Math.round(rect.height) !== Math.round(view.height)) this.#prepare(view);
      const context = /** @type {CanvasRenderingContext2D} */ (view.context);
      // Erase a little of everything drawn so far, which leaves fading trails on a transparent canvas.
      context.globalCompositeOperation = 'destination-out';
      context.fillStyle = 'rgba(0, 0, 0, 0.12)';
      context.fillRect(0, 0, view.width, view.height);
      context.globalCompositeOperation = 'source-over';
      context.fillStyle = view.color;
      context.font = `${size}px ${FONT}`;
      context.textBaseline = 'top';
      const left = rect.left + window.scrollX;
      const top = rect.top + window.scrollY;
      for (const head of heads) {
        const x = head.x - left;
        const y = head.y - top;
        if (x > -size && x < view.width && y > -size && y < view.height) context.fillText(glyph(), x, y);
      }
    }

    if (progress >= 1 && lit === 0) this.#stop();
  };

  #stop(reschedule = true) {
    cancelAnimationFrame(this.#frame);
    this.#columns = [];
    if (this.running) {
      this.running = false;
      for (const { canvas } of this.#views.values()) canvas.classList.remove('running');
      // Free the backing stores once the CSS fade has finished.
      clearTimeout(this.#releaseTimer);
      this.#releaseTimer = window.setTimeout(() => {
        if (this.running) return;
        for (const view of this.#views.values()) {
          view.canvas.width = view.canvas.height = 0;
          view.context = null;
        }
      }, FADE_MS);
    }
    if (reschedule) this.#schedule();
  }

  #halt() {
    clearTimeout(this.#timer);
    this.#stop(false);
  }
}
