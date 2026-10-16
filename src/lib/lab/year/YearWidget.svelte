<script>
  import { dayOfYear, daysInYear, yearProgress } from '../time.js';

  /** @type {import('../registry.js').WidgetProps} */
  let { options, clock, embedded } = $props();

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const now = $derived(clock.now);
  const year = $derived.by(() => {
    const pinned = Number.parseInt(options.year, 10);
    return Number.isInteger(pinned) && pinned > 0 && pinned < 10000 ? pinned : now.getFullYear();
  });
  const progress = $derived(yearProgress(year, now));
  const total = $derived(daysInYear(year));
  const phase = $derived(year < now.getFullYear() ? 'complete' : year > now.getFullYear() ? 'pending' : 'live');
  const daysDone = $derived(phase === 'complete' ? total : phase === 'pending' ? 0 : dayOfYear(now));
  const decimals = $derived(Math.min(4, Math.max(0, Number.parseInt(options.precision, 10) || 0)));
  const percent = $derived((progress * 100).toFixed(decimals));

  /** Position of a date inside the year, 0 to 1. @param {number} month @param {number} [y] */
  function at(month, y = year) {
    const start = new Date(year, 0, 1).getTime();
    return (new Date(y, month, 1).getTime() - start) / (new Date(year + 1, 0, 1).getTime() - start);
  }

  const months = $derived(MONTHS.map((label, index) => ({ label, start: at(index), end: at(index + 1) })));

  // Winter is split: January and February close the previous winter, December opens the next one.
  const seasons = $derived([
    { id: 'winter', label: 'Winter', start: 0, end: at(2) },
    { id: 'spring', label: 'Spring', start: at(2), end: at(5) },
    { id: 'summer', label: 'Summer', start: at(5), end: at(8) },
    { id: 'autumn', label: 'Autumn', start: at(8), end: at(11) },
    { id: 'winter', label: 'Winter', start: at(11), end: 1 }
  ]);

  const status = $derived(
    phase === 'complete' ? 'Complete' : phase === 'pending' ? `Starts in ${Math.ceil((new Date(year, 0, 1).getTime() - now.getTime()) / 86_400_000)}d` : `${total - daysDone}d left`
  );
</script>

<div class="year" class:embedded class:complete={phase === 'complete'} style:--progress={progress}>
  <div class="readout">
    <p class="year-number" aria-label="Year {year}">{year}</p>
    <div class="stats">
      <p class="percent"><span>{percent}</span><small>%</small></p>
      <p class="meta">
        <span>Day {String(daysDone).padStart(3, '0')} / {total}</span>
        <span class="status" class:done={phase === 'complete'}>{status}</span>
      </p>
    </div>
  </div>

  <div
    class="track"
    role="progressbar"
    aria-label="Progress through {year}"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow={Number(percent)}
  >
    <div class="cells" aria-hidden="true">
      {#each months as month (month.label)}
        <span class="cell" style:left="{month.start * 100}%" style:width="{(month.end - month.start) * 100}%">
          <span class="cell-label">{month.label}</span>
        </span>
      {/each}
    </div>
    <div class="fill" aria-hidden="true"></div>
    {#if phase === 'live'}
      <div class="cursor" aria-hidden="true"></div>
    {/if}
  </div>

  {#if options.seasons !== 'off'}
    <div class="season-strip" aria-hidden="true">
      {#each seasons as season, index (index)}
        <span class="band band-{season.id}" style:left="{season.start * 100}%" style:width="{(season.end - season.start) * 100}%">
          {#if index > 0}<span class="band-label">{season.label}</span>{/if}
        </span>
      {/each}
    </div>
  {/if}
</div>

<style>
  .year { display: flex; flex-direction: column; gap: .85rem; padding: 0 .35rem .2rem; }
  .year.embedded { justify-content: center; height: 100%; }

  .readout { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; }
  .year-number {
    color: var(--lab-ink);
    font-family: var(--lab-display-font);
    font-size: clamp(2.2rem, 11cqi, 4.6rem);
    line-height: .9;
    letter-spacing: .02em;
    text-shadow: var(--lab-text-glow);
  }
  .stats { display: grid; justify-items: end; gap: .35rem; text-align: right; }
  .percent { color: var(--lab-accent); font-family: var(--lab-meta-font); font-size: clamp(1.1rem, 4.6cqi, 1.9rem); font-variant-numeric: tabular-nums; line-height: 1; text-shadow: var(--lab-text-glow); }
  .percent small { margin-left: .15rem; font-size: .55em; color: var(--lab-muted); }
  .meta { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: .25rem .9rem; color: var(--lab-muted); font-family: var(--lab-meta-font); font-size: .62rem; letter-spacing: .12em; text-transform: uppercase; font-variant-numeric: tabular-nums; }
  .status { color: var(--lab-ink); }
  .status.done { color: var(--lab-accent); }

  .track {
    position: relative;
    flex-shrink: 0;
    height: clamp(2rem, 8cqi, 3rem);
    border: 1px solid var(--lab-line-strong);
    border-radius: .35rem;
    background: var(--lab-inset);
    overflow: hidden;
  }
  .cells { position: absolute; inset: 0; z-index: 1; }
  .cell { position: absolute; top: 0; bottom: 0; border-left: 1px solid var(--lab-line); }
  .cell:first-child { border-left: 0; }
  .cell-label { position: absolute; left: .4rem; bottom: .25rem; padding: 0 .2rem; border-radius: .2rem; color: var(--lab-ink); background: var(--lab-inset); font-family: var(--lab-meta-font); font-size: .55rem; letter-spacing: .1em; text-transform: uppercase; opacity: .85; }

  .fill {
    position: absolute;
    inset: 0 auto 0 0;
    width: calc(var(--progress) * 100%);
    background:
      repeating-linear-gradient(-45deg, var(--lab-accent) 0 1px, transparent 1px 7px),
      linear-gradient(90deg, var(--lab-accent-soft), var(--lab-accent-soft));
    opacity: .7;
    transition: width .6s ease;
  }
  .complete .fill { opacity: .9; }
  .cursor {
    position: absolute;
    top: -1px;
    bottom: -1px;
    left: calc(var(--progress) * 100%);
    width: 2px;
    margin-left: -1px;
    background: var(--lab-accent);
    box-shadow: 0 0 10px var(--lab-accent), 0 0 22px var(--lab-accent);
    animation: blink 2.4s ease-in-out infinite;
  }

  .season-strip { position: relative; flex-shrink: 0; height: 1.1rem; }
  .band { position: absolute; top: 0; height: 3px; border-radius: 2px; opacity: .85; }
  .band + .band { margin-left: 2px; }
  .band-spring { background: var(--lab-season-spring); }
  .band-summer { background: var(--lab-season-summer); }
  .band-autumn { background: var(--lab-season-autumn); }
  .band-winter { background: var(--lab-season-winter); }
  .band-label { position: absolute; top: .35rem; left: 0; color: var(--lab-muted); font-family: var(--lab-meta-font); font-size: .55rem; letter-spacing: .12em; text-transform: uppercase; white-space: nowrap; }

  @container (max-width: 520px) {
    .cell-label { display: none; }
    .band-label { display: none; }
    .season-strip { height: 3px; }
    .readout { align-items: center; }
  }
  @container (max-width: 340px) {
    .readout { flex-direction: column; align-items: flex-start; gap: .5rem; }
    .stats { justify-items: start; text-align: left; }
    .meta { justify-content: flex-start; }
  }

  @keyframes blink { 50% { opacity: .45; } }
  @media (prefers-reduced-motion: reduce) {
    .cursor { animation: none; }
    .fill { transition: none; }
  }
</style>
