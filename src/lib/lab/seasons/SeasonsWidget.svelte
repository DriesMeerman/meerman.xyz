<script>
  import { SEASONS, seasonAt, seasonRange, rangeProgress, daysBetween, startOfDay } from '../time.js';
  import { sunTimes, solarEvent } from './solar.js';
  import { seasonMotif } from './motif.js';
  import questData from './quests.json';
  import QuestTicker from './QuestTicker.svelte';

  /** @type {import('../registry.js').WidgetProps} */
  let { options, clock } = $props();

  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  /** Equinox or solstice that falls inside each meteorological season. */
  const MARKERS = /** @type {const} */ ({
    spring: { which: 'march', label: 'EQUINOX' },
    summer: { which: 'june', label: 'SOLSTICE' },
    autumn: { which: 'september', label: 'EQUINOX' },
    winter: { which: 'december', label: 'SOLSTICE' }
  });

  /** @param {string} value @param {number} fallback @param {number} limit */
  const coord = (value, fallback, limit) => {
    const n = Number.parseFloat(value);
    return Number.isFinite(n) && Math.abs(n) <= limit ? n : fallback;
  };
  const lat = $derived(coord(options.lat, 52.37, 89.9));
  const lon = $derived(coord(options.lon, 4.9, 180));
  const speed = $derived(coord(options.speed, 6, 600));
  const showQuests = $derived(options.quests !== 'off');
  const showDaylight = $derived(options.daylight !== 'off');
  const focusCurrent = $derived(options.focus === 'current');

  // Only recompute the heavy parts when the calendar day changes; `now` itself ticks every second.
  const dayKey = $derived(startOfDay(clock.now).getTime());
  const today = $derived(new Date(dayKey));
  const current = $derived(seasonAt(today));

  // The four blocks show one "season cycle": spring to winter of the year the current season started in.
  // Winter belongs to the cycle of the December it starts in, so in January 2027 you still see
  // spring 2026 to winter 2026 (with winter active), and the new cycle appears on 1 March 2027.
  // That keeps the grid stable for a whole cycle and always shows exactly one active block.
  const cycleYear = $derived(current.startYear);

  const blocks = $derived(
    SEASONS.map((season, i) => {
      const range = seasonRange(season.id, cycleYear);
      const last = new Date(range.end.getFullYear(), range.end.getMonth(), 0);
      const marker = MARKERS[season.id];
      const event = solarEvent(marker.which, cycleYear);
      const state = today >= range.end ? 'done' : today < range.start ? 'next' : 'active';
      return {
        ...range,
        index: i,
        state,
        from: `${MONTHS[range.start.getMonth()]} ${pad(range.start.getDate())}`,
        to: `${MONTHS[last.getMonth()]} ${pad(last.getDate())}`,
        span: daysBetween(range.start, range.end),
        left: daysBetween(today, range.end),
        until: daysBetween(today, range.start),
        event: { ...marker, date: event, at: rangeProgress(range, event), text: `${MONTHS[event.getMonth()]} ${pad(event.getDate())}`},
        motif: seasonMotif(season.id, cycleYear),
        quests: /** @type {Record<string, string[]>} */ (questData)[season.id] ?? [],
        seed: Math.floor(dayKey / 86_400_000) + i * 3
      };
    })
  );
  const visible = $derived(focusCurrent ? blocks.filter((block) => block.state === 'active') : blocks);
  const progress = $derived(rangeProgress(current, clock.now));

  const sun = $derived.by(() => {
    const now = sunTimes(today, lat, lon);
    const before = sunTimes(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1), lat, lon);
    return { ...now, delta: Math.round((now.dayMinutes - before.dayMinutes) * 60) };
  });
  const sunPhase = $derived.by(() => {
    if (!sun.rise || !sun.set) return sun.dayMinutes > 0 ? 'POLAR DAY' : 'POLAR NIGHT';
    const t = clock.now.getTime();
    return t < sun.rise.getTime() ? 'PRE-DAWN' : t < sun.set.getTime() ? 'SUN UP' : 'SUN DOWN';
  });
  const sunArc = $derived(sun.rise && sun.set ? Math.min(1, Math.max(0, (clock.now.getTime() - sun.rise.getTime()) / (sun.set.getTime() - sun.rise.getTime()))) : 0);

  /** @param {number} n */
  function pad(n) {
    return String(n).padStart(2, '0');
  }
  /** @param {Date | null} date */
  function hhmm(date) {
    return date ? `${pad(date.getHours())}:${pad(date.getMinutes())}` : '--:--';
  }
  /** @param {number} minutes */
  function duration(minutes) {
    const total = Math.round(minutes);
    return `${Math.floor(total / 60)}h ${pad(total % 60)}m`;
  }
  /** @param {number} seconds */
  function delta(seconds) {
    const sign = seconds > 0 ? '+' : seconds < 0 ? '−' : '±';
    const abs = Math.abs(seconds);
    return `${sign}${Math.floor(abs / 60)}m ${pad(abs % 60)}s`;
  }
  /** @param {(typeof blocks)[number]} block */
  function status(block) {
    if (block.state === 'active') return `${block.left}d left`;
    if (block.state === 'done') return 'done';
    return `in ${block.until}d`;
  }
</script>

<div class="seasons" class:focus={focusCurrent}>
  {#if showDaylight}
    <div class="daylight" aria-label="Daylight today at {lat.toFixed(2)}, {lon.toFixed(2)}">
      <span class="sol">
        <svg viewBox="0 0 40 22" aria-hidden="true">
          <path class="sky" d="M2 20 A18 18 0 0 1 38 20" />
          <line class="horizon" x1="0" y1="20" x2="40" y2="20" />
          <circle class="dot" cx={20 - 18 * Math.cos(Math.PI * sunArc)} cy={20 - 18 * Math.sin(Math.PI * sunArc)} r="2.2" />
        </svg>
        <span class="phase">{sunPhase}</span>
      </span>
      <span class="cell"><span class="k">Rise</span><span class="v">{hhmm(sun.rise)}</span></span>
      <span class="cell"><span class="k">Set</span><span class="v">{hhmm(sun.set)}</span></span>
      <span class="cell"><span class="k">Day</span><span class="v">{duration(sun.dayMinutes)}</span></span>
      <span class="cell delta" class:gain={sun.delta > 0} class:loss={sun.delta < 0}>
        <span class="k">Vs yday</span><span class="v">{delta(sun.delta)}</span>
      </span>
      <span class="cell loc" title="{Math.abs(lat).toFixed(2)}{lat >= 0 ? 'N' : 'S'} {Math.abs(lon).toFixed(2)}{lon >= 0 ? 'E' : 'W'}"><span class="k">Cycle</span><span class="v">{cycleYear}</span></span>
    </div>
  {/if}

  {#if !showDaylight}
    <div class="cycle">
      <span>Cycle {cycleYear}</span>
      <span class="rule" aria-hidden="true"></span>
      <span>{current.label} {(progress * 100).toFixed(1)}%</span>
    </div>
  {/if}

  <div class="grid" style:--n={visible.length}>
    {#each visible as block (block.id)}
      <article
        class="block {block.state}"
        style:--c="var(--lab-season-{block.id})"
        aria-label="{block.label} {block.startYear}, {status(block)}"
      >
        <svg class="motif" viewBox="0 0 100 100" aria-hidden="true"><path d={block.motif} /></svg>

        <header class="top">
          <span class="idx">{pad(block.index + 1)}</span>
          <h3>{block.label}</h3>
          <span class="state">
            {#if block.state === 'active'}<span class="led" aria-hidden="true"></span>{/if}<span class="state-text">{block.state === 'active' ? 'Active' : block.state === 'done' ? 'Done' : 'Queued'}</span>
          </span>
        </header>

        <div class="readout">
          <span class="big">
            {#if block.state === 'active'}{block.left}<small>d left</small>{:else if block.state === 'done'}{block.span}<small>d logged</small>{:else}<small>in</small> {block.until}<small>d</small>{/if}
          </span>
          <span class="dates">{block.from} <span aria-hidden="true">&rarr;</span> {block.to}<span class="days"> / {block.span}d</span></span>
        </div>

        <div class="bar" role="progressbar" aria-label="{block.label} progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(rangeProgress(block, clock.now) * 100)}>
          <span class="fill" style:width="{rangeProgress(block, clock.now) * 100}%"></span>
          <span class="event" class:passed={clock.now >= block.event.date} style:left="{block.event.at * 100}%" title="{block.event.label} {block.event.text}"></span>
        </div>
        <div class="scale">
          <span>{(rangeProgress(block, clock.now) * 100).toFixed(block.state === 'active' ? 1 : 0)}%</span>
          <span class="event-label">{block.event.label === 'EQUINOX' ? 'EQX' : 'SOL'} {block.event.text}</span>
        </div>

        {#if showQuests && block.quests.length}
          <div class="quests">
            <QuestTicker quests={block.quests} seed={block.seed} {speed} delay={block.index * 1300} label={block.label} />
          </div>
        {/if}
      </article>
    {/each}
  </div>
</div>

<style>
  .seasons {
    display: flex;
    flex-direction: column;
    gap: .55rem;
    height: 100%;
    min-height: 0;
    font-family: var(--lab-meta-font);
    font-variant-numeric: tabular-nums;
  }

  /* Daylight strip */
  .daylight {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 1rem;
    padding: .4rem .6rem;
    white-space: nowrap;
    overflow: hidden;
    border: 1px solid var(--lab-line);
    border-radius: .5rem;
    background: var(--lab-inset);
    font-size: .6rem;
    letter-spacing: .1em;
    text-transform: uppercase;
  }
  .sol { display: inline-flex; align-items: center; gap: .45rem; color: var(--lab-accent); }
  .sol svg { width: 2.1rem; height: 1.15rem; overflow: visible; }
  .sky { fill: none; stroke: var(--lab-line-strong); stroke-width: 1; stroke-dasharray: 2 2; }
  .horizon { stroke: var(--lab-line-strong); stroke-width: 1; }
  .dot { fill: var(--lab-season-summer); filter: drop-shadow(0 0 3px var(--lab-season-summer)); }
  .phase { text-shadow: var(--lab-text-glow); }
  .cell { display: inline-flex; gap: .4rem; align-items: baseline; }
  .k { color: var(--lab-muted); }
  .v { color: var(--lab-ink); }
  .delta.gain .v { color: var(--lab-season-spring); }
  .delta.loss .v { color: var(--lab-season-autumn); }
  .loc { margin-left: auto; }

  .cycle {
    display: flex;
    align-items: center;
    gap: .6rem;
    color: var(--lab-muted);
    font-size: .58rem;
    letter-spacing: .16em;
    text-transform: uppercase;
  }
  .cycle .rule { flex: 1; height: 1px; background: linear-gradient(90deg, var(--lab-line-strong), transparent); }

  /* Season grid */
  .grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-rows: minmax(0, 1fr);
    gap: .55rem;
    min-height: 0;
  }
  .focus .grid { grid-template-columns: minmax(0, 1fr); }

  .block > * { flex-shrink: 0; }
  .block {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: .4rem;
    min-width: 0;
    min-height: 0;
    padding: .6rem .65rem .6rem;
    border: 1px solid var(--lab-line);
    border-radius: .55rem;
    background: linear-gradient(160deg, color-mix(in srgb, var(--c) 7%, transparent), transparent 60%), var(--lab-inset);
    overflow: hidden;
    isolation: isolate;
  }
  .block::before {
    content: '';
    position: absolute;
    left: 0;
    top: .6rem;
    bottom: .6rem;
    width: 2px;
    border-radius: 2px;
    background: var(--c);
    opacity: .35;
  }
  .block.done { opacity: .7; }
  .block.active {
    border-color: color-mix(in srgb, var(--c) 70%, transparent);
    background: linear-gradient(160deg, color-mix(in srgb, var(--c) 16%, transparent), transparent 70%), var(--lab-inset);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--c) 25%, transparent), 0 0 22px color-mix(in srgb, var(--c) 22%, transparent), inset 0 0 18px color-mix(in srgb, var(--c) 10%, transparent);
  }
  .block.active::before { opacity: 1; box-shadow: 0 0 8px var(--c); }

  .motif {
    position: absolute;
    right: -.6rem;
    bottom: -.6rem;
    width: 58%;
    max-width: 9rem;
    aspect-ratio: 1;
    z-index: -1;
    color: var(--c);
    opacity: .22;
    pointer-events: none;
  }
  .motif path { fill: none; stroke: currentColor; stroke-width: 1; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
  .block.active .motif { opacity: .34; filter: drop-shadow(0 0 4px color-mix(in srgb, var(--c) 60%, transparent)); }

  .top { display: flex; align-items: center; gap: .5rem; min-width: 0; }
  .idx { color: var(--c); font-size: .55rem; letter-spacing: .12em; }
  h3 {
    margin: 0;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--lab-ink);
    font-family: var(--lab-display-font);
    font-size: .82rem;
    font-weight: 400;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  .active h3 { color: var(--c); text-shadow: 0 0 12px color-mix(in srgb, var(--c) 55%, transparent); }
  .state {
    display: inline-flex;
    align-items: center;
    gap: .35rem;
    margin-left: auto;
    padding: .1rem .4rem;
    border: 1px solid var(--lab-line);
    border-radius: 999px;
    color: var(--lab-muted);
    font-size: .5rem;
    letter-spacing: .16em;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .active .state { border-color: var(--c); color: var(--c); background: color-mix(in srgb, var(--c) 12%, transparent); }
  .led { width: 5px; height: 5px; border-radius: 50%; background: var(--c); box-shadow: 0 0 6px var(--c); animation: blink 1.8s ease-in-out infinite; }

  .readout { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: .1rem .6rem; }
  .big { color: var(--lab-ink); font-family: var(--lab-display-font); font-size: 1.05rem; line-height: 1.1; }
  .active .big { color: var(--c); text-shadow: 0 0 14px color-mix(in srgb, var(--c) 45%, transparent); font-size: 1.35rem; }
  .big small { margin-left: .15rem; color: var(--lab-muted); font-family: var(--lab-meta-font); font-size: .55rem; letter-spacing: .12em; text-transform: uppercase; }
  .dates { color: var(--lab-muted); font-size: .56rem; letter-spacing: .1em; white-space: nowrap; }

  .bar {
    position: relative;
    height: 6px;
    border: 1px solid var(--lab-line);
    border-radius: 2px;
    background: repeating-linear-gradient(90deg, transparent 0 calc(100% / 13 - 1px), var(--lab-line) calc(100% / 13 - 1px) calc(100% / 13));
  }
  .fill {
    position: absolute;
    inset: 0 auto 0 0;
    background: linear-gradient(90deg, color-mix(in srgb, var(--c) 35%, transparent), var(--c));
    opacity: .85;
  }
  .active .fill { box-shadow: 0 0 10px var(--c); opacity: 1; }
  .done .fill { background: color-mix(in srgb, var(--c) 45%, transparent); }
  .event {
    position: absolute;
    top: -4px;
    bottom: -4px;
    width: 0;
    border-left: 1px dashed var(--lab-ink);
    opacity: .7;
  }
  .event::after { content: ''; position: absolute; top: -3px; left: -3.5px; width: 6px; height: 6px; transform: rotate(45deg); background: var(--lab-ink); }
  .event.passed::after { background: var(--c); }
  .scale { display: flex; justify-content: space-between; gap: .5rem; color: var(--lab-muted); font-size: .52rem; letter-spacing: .12em; margin-top: -.15rem; }
  .active .scale > span:first-child { color: var(--c); }

  .quests { margin-top: auto; flex-shrink: 1; min-height: 0; }

  /* Focus mode: one big block */
  .focus .block { padding: .8rem .9rem; gap: .55rem; }
  .focus h3 { font-size: 1.05rem; }
  .focus .active .big { font-size: 2rem; }
  .focus .motif { width: 46%; max-width: 13rem; }

  /* Short embeds: the iframe viewport is the card, so height media queries apply. */
  @media (max-height: 380px) {
    .seasons:not(.focus) .scale { display: none; }
    .seasons:not(.focus) .readout { margin-bottom: .1rem; }
  }
  @media (max-height: 260px) {
    .scale { display: none; }
  }

  @keyframes blink { 50% { opacity: .3; } }
  @media (prefers-reduced-motion: reduce) { .led { animation: none; } }

  /* Shrinking cards: drop details as space runs out. */
  @container (max-width: 520px) {
    .loc, .days { display: none; }
    .daylight { gap: .7rem; }
  }
  @container (max-width: 470px) {
    .phase { display: none; }
  }
  @container (max-width: 380px) {
    .daylight .delta { display: none; }
  }
  @container (max-width: 420px) {
    .seasons:not(.focus) .motif { display: none; }
    .seasons:not(.focus) .done .state, .seasons:not(.focus) .next .state { display: none; }
    .seasons:not(.focus) .state-text { display: none; }
    .seasons:not(.focus) .active .state { padding: .3rem; }
    .cycle { display: none; }
    .grid { gap: .4rem; }
    .block { padding: .5rem .5rem .5rem .6rem; gap: .3rem; }
    h3 { font-size: .7rem; }
    .active .big { font-size: 1.1rem; }
    .seasons:not(.focus) .dates { display: none; }
  }
  @container (max-width: 320px) {
    .sol { display: none; }
    .idx { display: none; }
    .scale .event-label { display: none; }
  }
</style>
