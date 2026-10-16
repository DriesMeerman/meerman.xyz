<script>
  import '$lib/lab/lab.css';
  import { page } from '$app/state';
  import { darkMode } from '$lib/state.svelte.js';
  import { widgets, findWidget, globalOptions, resolveOptions } from '$lib/lab/registry.js';
  import { LabClock, parseDateOverride } from '$lib/lab/clock.svelte.js';
  import { dayOfYear, isoWeek } from '$lib/lab/time.js';
  import WidgetHost from '$lib/lab/WidgetHost.svelte';
  import EmbedBuilder from '$lib/lab/builder/EmbedBuilder.svelte';

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
      <p>Small instruments for my Obsidian canvases, and a place to play. Every panel can be embedded on its own.</p>
    </header>

    <div class="dashboard">
      {#each ['year', 'calendar', 'seasons', 'dice', 'orb'] as id (id)}
        <div class="slot slot-{id}">
          <WidgetHost widget={widgetById(id)} options={optionsFor(widgetById(id))} {clock} code={code(id)} />
        </div>
      {/each}
    </div>

    <section class="builder-section" aria-labelledby="builder-title">
      <div class="lab-section-head">
        <h2 id="builder-title">06 / Embed builder</h2>
        <span>Configure a widget, copy the link, paste it into a canvas</span>
      </div>
      <EmbedBuilder />
    </section>
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
  .lab-intro p { max-width: 38rem; margin-top: .9rem; color: var(--lab-muted); line-height: 1.6; }

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

  .builder-section { margin-top: 3rem; }
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
