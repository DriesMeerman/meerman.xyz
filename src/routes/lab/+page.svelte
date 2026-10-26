<script>
  import '$lib/lab/lab.css';
  import { untrack } from 'svelte';
  import { page } from '$app/state';
  import { replaceState } from '$app/navigation';
  import { darkMode, particlesEnabled } from '$lib/state.svelte.js';
  import { widgets, findWidget, globalOptions, resolveOptions } from '$lib/lab/registry.js';
  import { LabClock, parseDateOverride } from '$lib/lab/clock.svelte.js';
  import { dayOfYear, isoWeek } from '$lib/lab/time.js';
  import { RainControl, isRainParam, setRainControl } from '$lib/lab/rain.svelte.js';
  import WidgetHost from '$lib/lab/WidgetHost.svelte';
  import EmbedBuilder from '$lib/lab/builder/EmbedBuilder.svelte';
  import RainSettings from '$lib/lab/RainSettings.svelte';

  const params = $derived(page.url.searchParams);
  const requested = $derived((params.get('w') ?? '').split(',').map((id) => id.trim()).filter(Boolean));
  const embedded = $derived(requested.length > 0);
  const selected = $derived(requested.map(findWidget).filter((widget) => widget !== undefined));
  const shared = $derived(resolveOptions(globalOptions, params));
  const clock = $derived(new LabClock(parseDateOverride(shared.date)));

  /** @param {string} id */
  const code = (id) => String(widgets.findIndex((widget) => widget.id === id) + 1).padStart(2, '0');
  /** @param {string} id */
  const widgetById = (id) => /** @type {import('$lib/lab/registry.js').WidgetMeta} */ (findWidget(id));
  /** @param {import('$lib/lab/registry.js').WidgetMeta} widget */
  const optionsFor = (widget) => resolveOptions(widget.options, params);

  $effect(() => clock.start());

  // `rain` and `rain-*` parameters set the starting state. The settings tab writes changes back to the URL.
  const rain = setRainControl(new RainControl(page.url.searchParams));
  $effect(() => () => rain.field.destroy());

  let firstSync = true;
  $effect(() => {
    const entries = rain.params;
    if (firstSync) return void (firstSync = false);
    const url = new URL(window.location.href);
    for (const name of [...url.searchParams.keys()]) if (isRainParam(name)) url.searchParams.delete(name);
    for (const [name, value] of entries) url.searchParams.set(name, value);
    untrack(() => replaceState(url, page.state));
  });

  // The particles button in the menu doubles as a rain trigger, in both directions.
  let particlesSeen = particlesEnabled.current;
  $effect(() => {
    if (particlesEnabled.current === particlesSeen) return;
    particlesSeen = particlesEnabled.current;
    untrack(() => rain.rainNow());
  });

  let settingsOpen = $state(false);
  let settingsTab = $state('embed');

  // Embeds pick their theme from the URL or the system, without touching the saved site preference.
  $effect(() => {
    const theme = shared.theme;
    if (theme === 'dark' || theme === 'light') {
      darkMode.current = theme === 'dark';
      return;
    }
    if (!embedded) return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => (darkMode.current = query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  });

  $effect(() => {
    document.documentElement.classList.toggle('lab-embed', embedded);
    return () => document.documentElement.classList.remove('lab-embed');
  });

  const stamp = $derived.by(() => {
    const now = clock.now;
    const pad = (/** @type {number} */ n) => String(n).padStart(2, '0');
    return {
      date: `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}`,
      time: `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
      week: pad(isoWeek(now)),
      day: String(dayOfYear(now)).padStart(3, '0')
    };
  });
</script>

<svelte:head>
  <title>Lab · Meerman</title>
  <meta name="robots" content="noindex" />
</svelte:head>

{#if embedded}
  <div class="embed profile-theme lab-theme" style:--count={Math.max(selected.length, 1)}>
    {#each selected as widget (widget.id)}
      <WidgetHost {widget} options={optionsFor(widget)} {clock} embedded frame={shared.frame === 'on'} code={code(widget.id)} />
    {:else}
      <p class="unknown">Unknown widget. Try one of: {widgets.map((widget) => widget.id).join(', ')}.</p>
    {/each}
  </div>
{:else}
  <div class="lab profile-theme lab-theme">
    <div class="lab-marker">
      <span class="marker-cross" aria-hidden="true">+</span>
      <span>MEERMAN / LAB</span>
      <span class="readout" aria-label="Current date and time">
        <span>{stamp.date}</span><span>W{stamp.week}</span><span>D{stamp.day}</span><span class="time">{stamp.time}</span>
      </span>
    </div>

    <header class="lab-intro">
      <h1>Lab<span aria-hidden="true">.</span></h1>
    </header>

    <div class="dashboard">
      {#each ['year', 'calendar', 'seasons', 'dice', 'orb'] as id (id)}
        <div class="slot slot-{id}">
          <WidgetHost widget={widgetById(id)} options={optionsFor(widgetById(id))} {clock} code={code(id)} />
        </div>
      {/each}
    </div>

    <details class="settings" bind:open={settingsOpen}>
      <summary class="lab-section-head">
        <h2><span class="chevron" aria-hidden="true">›</span>06 / Settings</h2>
        <span>Embed links for canvases, and the matrix rain playground</span>
      </summary>
      <div class="tabs" role="tablist" aria-label="Settings">
        {#each [['embed', 'Embed builder'], ['rain', 'Matrix rain']] as [id, label] (id)}
          <button
            type="button"
            role="tab"
            id="tab-{id}"
            aria-controls="panel-{id}"
            aria-selected={settingsTab === id}
            onclick={() => (settingsTab = id)}
          >{label}</button>
        {/each}
      </div>
      <!-- Both tabs stay mounted so switching keeps the builder's choices. -->
      <div id="panel-embed" role="tabpanel" aria-labelledby="tab-embed" hidden={settingsTab !== 'embed'}><EmbedBuilder /></div>
      <div id="panel-rain" role="tabpanel" aria-labelledby="tab-rain" hidden={settingsTab !== 'rain'}><RainSettings active={settingsOpen && settingsTab === 'rain'} /></div>
    </details>
  </div>
{/if}

<style>
  .embed {
    display: grid;
    grid-template-rows: repeat(var(--count), minmax(0, 1fr));
    gap: .75rem;
    height: 100vh;
    height: 100dvh;
    padding: .5rem;
    box-sizing: border-box;
  }
  .unknown { align-self: center; justify-self: center; color: var(--lab-muted); font-family: var(--lab-meta-font); font-size: .75rem; }

  .lab { max-width: 1280px; margin: 0 auto; }
  /* In dark mode the full lab trades the site grey for a deep control-room backdrop. */
  :global(html.dark body:has(.lab)) { background: radial-gradient(ellipse 120% 900px at 50% -10%, #17313b 0%, #0c171d 60%, #070d11 100%) no-repeat #070d11; }
  .lab-marker {
    display: flex;
    flex-wrap: wrap;
    gap: .75rem;
    align-items: center;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--lab-line);
    color: var(--lab-muted);
    font-family: var(--lab-meta-font);
    font-size: .67rem;
    line-height: 1.6;
    letter-spacing: .12em;
  }
  .marker-cross { color: var(--lab-accent); font-size: 1rem; }
  .readout { display: flex; gap: 1rem; margin-left: auto; font-variant-numeric: tabular-nums; }
  .readout .time { color: var(--lab-accent); text-shadow: var(--lab-text-glow); }

  .lab-intro { padding: 2rem 0 1.75rem; }
  h1 { color: var(--lab-ink); font-family: var(--lab-display-font); font-size: clamp(2.4rem, 6vw, 4rem); line-height: 1; letter-spacing: -.02em; }
  h1 span { color: var(--lab-accent); text-shadow: var(--lab-text-glow); }


  .dashboard {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1rem;
  }
  .slot { min-width: 0; }
  .slot-orb { min-height: 360px; }

  @media (min-width: 900px) {
    .dashboard {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      grid-template-areas:
        'year year'
        'calendar seasons'
        'dice orb';
    }
    .slot-year { grid-area: year; }
    .slot-calendar { grid-area: calendar; }
    .slot-seasons { grid-area: seasons; }
    .slot-dice { grid-area: dice; }
    .slot-orb { grid-area: orb; min-height: 420px; }
  }

  .settings { margin-top: 3rem; }
  .settings summary { cursor: pointer; list-style: none; }
  .settings summary::-webkit-details-marker { display: none; }
  .settings summary:hover h2, .settings summary:focus-visible h2 { text-shadow: var(--lab-text-glow); }
  .settings summary:focus-visible { outline: 1px solid var(--lab-accent); outline-offset: 2px; }
  .chevron { display: inline-block; margin-right: .5rem; transition: transform .2s; }
  .settings[open] .chevron { transform: rotate(90deg); }
  @media (prefers-reduced-motion: reduce) { .chevron { transition: none; } }

  .tabs { display: flex; gap: .4rem; margin-bottom: 1rem; }
  .tabs button {
    padding: .45rem .8rem;
    border: 1px solid var(--lab-line);
    border-radius: .35rem;
    color: var(--lab-muted);
    background: var(--lab-inset);
    font-family: var(--lab-meta-font);
    font-size: .65rem;
    letter-spacing: .1em;
    text-transform: uppercase;
    cursor: pointer;
    transition: color .15s, border-color .15s, box-shadow .15s;
  }
  .tabs button:hover { color: var(--lab-ink); border-color: var(--lab-line-strong); }
  .tabs button[aria-selected='true'] { color: var(--lab-accent); border-color: var(--lab-accent); box-shadow: 0 0 0 1px var(--lab-accent-soft), var(--lab-glow); }
  .tabs button:focus-visible { outline: 1px solid var(--lab-accent); outline-offset: 2px; }
  .lab-section-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: .5rem 1rem;
    border-top: 1px solid var(--lab-line);
    padding: 1rem 0 1.35rem;
    font-family: var(--lab-meta-font);
    font-size: .62rem;
    line-height: 1.6;
    color: var(--lab-muted);
  }
  .lab-section-head h2 { color: var(--lab-accent); font-size: .68rem; font-weight: 500; letter-spacing: .1em; text-transform: uppercase; }
</style>
