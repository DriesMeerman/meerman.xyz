<script>
  import { daysBetween } from '../time.js';
  import { LABELS, dateKey, parseMonth, monthGrid, eventsBetween } from './calendar.js';

  /** @type {import('../registry.js').WidgetProps} */
  let { options, clock, embedded } = $props();

  const t = $derived(options.lang === 'en' ? LABELS.en : LABELS.nl);
  const showEvents = $derived(options.events !== 'off');
  const showWeeks = $derived(options.weeks === 'on');

  // Primitive keys so the grid only rebuilds when the day changes, not on every clock tick.
  const todayKey = $derived(dateKey(clock.now));
  const fixedMonth = $derived(parseMonth(options.month));
  const viewYear = $derived(fixedMonth ? fixedMonth.getFullYear() : clock.now.getFullYear());
  const viewMonth = $derived(fixedMonth ? fixedMonth.getMonth() : clock.now.getMonth());

  const weeks = $derived(monthGrid(viewYear, viewMonth));
  const gridEvents = $derived(eventsBetween(weeks[0].days[0].date, weeks[5].days[6].date));
  const byDay = $derived.by(() => {
    /** @type {Map<string, import('./calendar.js').CalendarEvent[]>} */
    const map = new Map();
    for (const event of gridEvents) map.set(event.key, [...(map.get(event.key) ?? []), event]);
    return map;
  });
  const monthEvents = $derived(gridEvents.filter((event) => event.date.getMonth() === viewMonth));

  const daysInMonth = $derived(new Date(viewYear, viewMonth + 1, 0).getDate());
  const isCurrentMonth = $derived(todayKey.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`));
  const todayDate = $derived(Number(todayKey.slice(8)));
  const progress = $derived.by(() => {
    if (isCurrentMonth) return todayDate / daysInMonth;
    return todayKey > dateKey(new Date(viewYear, viewMonth, 1)) ? 1 : 0;
  });

  /** @param {import('./calendar.js').CalendarEvent[]} events */
  function decorate(events) {
    const today = new Date(`${todayKey}T12:00`);
    let nextFound = false;
    return events.map((event) => {
      const diff = daysBetween(today, event.date);
      const next = diff > 0 && !nextFound;
      if (diff >= 0) nextFound = true;
      const relative = diff === 0 ? t.today : diff === 1 ? t.tomorrow : diff > 1 ? t.inDays(diff) : t.passed;
      return { ...event, diff, next, relative, weekday: t.days[(event.date.getDay() + 6) % 7] };
    });
  }

  const items = $derived(decorate(monthEvents));
  // A short look past the month end so a quiet month does not leave the column empty.
  const later = $derived.by(() => {
    const room = 5 - items.length;
    if (room <= 0) return [];
    const from = new Date(viewYear, viewMonth + 1, 1);
    const upcoming = eventsBetween(from, new Date(viewYear, viewMonth + 4, 0)).slice(0, room);
    const all = decorate([...monthEvents, ...upcoming]);
    return all.slice(monthEvents.length).map((item) => ({ ...item, month: t.months[item.date.getMonth()].slice(0, 3) }));
  });
  const hasUpcoming = $derived(items.some((item) => item.diff >= 0));
  const quiet = $derived(!hasUpcoming && !later.some((item) => item.diff >= 0));

  /** @param {string} name */
  const capital = (name) => name.charAt(0).toUpperCase() + name.slice(1);
</script>

<div class="cal" class:with-events={showEvents} class:embedded>
  <section class="glass month" aria-label="{capital(t.months[viewMonth])} {viewYear}">
    <header class="month-head">
      <h3 class="month-name">{capital(t.months[viewMonth])}<span class="year">{viewYear}</span></h3>
      <span class="readout">
        {#if isCurrentMonth}
          <span class="accent">{String(todayDate).padStart(2, '0')}</span>/{daysInMonth}
        {:else}
          {t.week} {weeks[0].week}-{weeks[5].week}
        {/if}
      </span>
    </header>
    <div class="track" aria-hidden="true">{#if progress > 0}<span style:width="{progress * 100}%"></span>{/if}</div>

    <div class="grid" class:weeks={showWeeks} role="grid">
      <div class="row head" role="row">
        {#if showWeeks}<span class="wk" role="columnheader">{t.week}</span>{/if}
        {#each t.days as day, index (day)}
          <span class="dow" class:weekend={index >= 5} role="columnheader">{day}</span>
        {/each}
      </div>
      {#each weeks as week (week.days[0].key)}
        <div class="row" role="row">
          {#if showWeeks}<span class="wk" role="rowheader">{week.week}</span>{/if}
          {#each week.days as day (day.key)}
            {@const events = byDay.get(day.key) ?? []}
            {@const holiday = events.some((event) => event.kind === 'holiday')}
            <span
              class="day"
              class:out={!day.inMonth}
              class:weekend={day.weekend}
              class:past={day.key < todayKey}
              class:today={day.key === todayKey}
              class:holiday
              role="gridcell"
              title={events.map((event) => event.title).join(', ') || undefined}
              aria-current={day.key === todayKey ? 'date' : undefined}
            >
              <span class="num">{day.date.getDate()}</span>
              {#if events.length}
                <span class="dots" aria-hidden="true">
                  {#each events.slice(0, 3) as event (event.title)}<i class="dot {event.kind}"></i>{/each}
                </span>
              {/if}
            </span>
          {/each}
        </div>
      {/each}
    </div>
  </section>

  {#if showEvents}
    <aside class="glass events" class:has-upcoming={hasUpcoming} class:quiet aria-label={t.events}>
      <header class="events-head">
        <span>{t.events}</span>
        <span class="count">{String(items.length).padStart(2, '0')}</span>
      </header>
      {#if !items.length}
        <p class="empty">{t.none}</p>
      {/if}
      {#if items.length || later.length}
        <ol class="list">
          {#each items as item (item.key + item.title)}
            <li class="item {item.kind}" class:past={item.diff < 0} class:is-today={item.diff === 0} class:next={item.next}>
              <span class="when">
                <b>{item.date.getDate()}</b>
                <small>{item.weekday}</small>
              </span>
              <span class="what">
                <span class="title">{item.title}</span>
                <span class="tags">
                  <span class="chip">{t.kinds[item.kind]}</span>
                  <span class="rel">{item.relative}</span>
                </span>
              </span>
            </li>
          {/each}
          {#if later.length}
            <li class="divider" aria-hidden="true"><span>{t.later}</span></li>
            {#each later as item (item.key + item.title)}
              <li class="item later {item.kind}" class:next={item.next}>
                <span class="when">
                  <b>{item.date.getDate()}</b>
                  <small>{item.month}</small>
                </span>
                <span class="what">
                  <span class="title">{item.title}</span>
                  <span class="tags">
                    <span class="chip">{t.kinds[item.kind]}</span>
                    <span class="rel">{item.relative}</span>
                  </span>
                </span>
              </li>
            {/each}
          {/if}
        </ol>
      {/if}
    </aside>
  {/if}
</div>

<style>
  .cal {
    --glass-bg: linear-gradient(150deg, #ffffffb8, #ffffff59 55%, #eaf6f766);
    --glass-edge: #ffffffcc;
    --glass-shade: 0 14px 34px -22px #0f3a4466, 0 2px 6px -3px #0f3a4426;
    --glass-sheen: linear-gradient(180deg, #ffffff99, #ffffff00 42%);
    --cell-hover: #087b8312;
    --kind-holiday: var(--lab-hot);
    --kind-event: var(--lab-accent);
    --kind-personal: var(--lab-season-summer);

    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: .7rem;
    height: 100%;
    min-height: 0;
    font-family: var(--lab-meta-font);
    font-variant-numeric: tabular-nums;
  }
  :global(.dark) .cal {
    --glass-bg: linear-gradient(150deg, #9fe9f01c, #5fc8d00a 55%, #06121a59);
    --glass-edge: #b8f6fa2e;
    --glass-shade: 0 18px 40px -24px #000000cc, 0 0 28px -12px #34d5dd2e;
    --glass-sheen: linear-gradient(180deg, #ffffff17, #ffffff00 40%);
    --cell-hover: #6ff1f50f;
  }

  @container (min-width: 500px) {
    .cal.with-events { grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); }
  }

  /* Frosted glass card, in the spirit of a home-screen widget. */
  .glass {
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    padding: .8rem .85rem .75rem;
    border: 1px solid var(--lab-line);
    border-radius: 1.15rem;
    background: var(--glass-bg);
    box-shadow: var(--glass-shade), inset 0 1px 0 var(--glass-edge), inset 0 0 0 1px #ffffff0a;
    backdrop-filter: blur(18px) saturate(170%);
    -webkit-backdrop-filter: blur(18px) saturate(170%);
    overflow: hidden;
    isolation: isolate;
  }
  .glass::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: var(--glass-sheen);
    pointer-events: none;
  }

  /* Month header */
  .month-head { display: flex; align-items: baseline; justify-content: space-between; gap: .75rem; padding: 0 .2rem; }
  .month-name {
    display: flex;
    align-items: baseline;
    gap: .55rem;
    min-width: 0;
    color: var(--lab-ink);
    font-family: var(--lab-display-font);
    font-size: clamp(.95rem, 4.2cqi, 1.3rem);
    font-weight: 400;
    line-height: 1.1;
    white-space: nowrap;
  }
  .year { color: var(--lab-accent); font-family: var(--lab-meta-font); font-size: .62em; letter-spacing: .12em; text-shadow: var(--lab-text-glow); }
  .readout { color: var(--lab-muted); font-size: .62rem; letter-spacing: .14em; text-transform: uppercase; white-space: nowrap; }
  .accent { color: var(--lab-accent); text-shadow: var(--lab-text-glow); }

  .track { position: relative; height: 1px; margin: .55rem .2rem .45rem; background: var(--lab-line); }
  .track span {
    position: absolute;
    inset: -0.5px auto -0.5px 0;
    background: linear-gradient(90deg, transparent, var(--lab-accent));
    box-shadow: 0 0 8px var(--lab-accent);
  }
  .track span::after {
    content: '';
    position: absolute;
    right: -2px;
    top: -2px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--lab-accent);
    box-shadow: 0 0 8px var(--lab-accent);
  }

  /* Day grid */
  .grid { display: grid; grid-template-rows: auto repeat(6, minmax(1.75rem, 1fr)); flex: 1; min-height: 0; }
  .row { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); align-items: center; }
  .grid.weeks .row { grid-template-columns: minmax(1.6rem, .7fr) repeat(7, minmax(0, 1fr)); }
  .row.head { padding-bottom: .2rem; }

  .dow, .wk { text-align: center; color: var(--lab-muted); font-size: .58rem; letter-spacing: .12em; text-transform: uppercase; }
  .dow.weekend { color: color-mix(in srgb, var(--lab-muted) 70%, transparent); }
  .wk { align-self: stretch; display: grid; place-items: center; border-right: 1px solid var(--lab-line); color: color-mix(in srgb, var(--lab-accent) 75%, var(--lab-muted)); font-size: .56rem; letter-spacing: .06em; }
  .head .wk { border-right-color: transparent; }

  .day { position: relative; display: grid; place-items: center; height: 100%; min-height: 0; }
  .num {
    display: grid;
    place-items: center;
    width: clamp(1.55rem, 7.5cqi, 2.2rem);
    aspect-ratio: 1;
    border: 1px solid transparent;
    border-radius: 50%;
    color: var(--lab-ink);
    font-size: clamp(.68rem, 2.6cqi, .86rem);
    line-height: 1;
    transition: background-color .2s, border-color .2s;
  }
  .day:hover .num { background: var(--cell-hover); }
  .day.weekend .num { color: color-mix(in srgb, var(--lab-ink) 72%, var(--lab-muted)); }
  .day.past .num { color: color-mix(in srgb, var(--lab-ink) 55%, transparent); }
  .day.holiday .num { color: var(--kind-holiday); }
  .day.out .num { color: color-mix(in srgb, var(--lab-muted) 45%, transparent); }
  .day.out .dots { opacity: .35; }

  .day.today .num {
    border-color: var(--lab-accent);
    background: radial-gradient(circle, var(--lab-accent-soft), transparent 75%), var(--lab-accent-soft);
    color: var(--lab-accent);
    font-weight: 700;
    text-shadow: var(--lab-text-glow);
    box-shadow: 0 0 0 3px var(--lab-accent-soft), 0 0 16px -2px var(--lab-accent);
  }
  .day.today::after {
    content: '';
    position: absolute;
    width: clamp(1.55rem, 7.5cqi, 2.2rem);
    aspect-ratio: 1;
    border-radius: 50%;
    border: 1px solid var(--lab-accent);
    opacity: 0;
    animation: ping 3.2s ease-out infinite;
    pointer-events: none;
  }

  .dots { position: absolute; bottom: 8%; left: 50%; display: flex; gap: 2px; transform: translateX(-50%); }
  .dot { width: 4px; height: 4px; border-radius: 50%; background: var(--kind-event); box-shadow: 0 0 5px var(--kind-event); }
  .dot.holiday { background: var(--kind-holiday); box-shadow: 0 0 5px var(--kind-holiday); }
  .dot.personal { background: var(--kind-personal); box-shadow: 0 0 5px var(--kind-personal); }
  .day.today .dots { bottom: -1px; }

  /* Events column */
  .events { padding: .75rem .7rem .6rem; }
  .events-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 .2rem .5rem;
    border-bottom: 1px solid var(--lab-line);
    color: var(--lab-muted);
    font-size: .6rem;
    letter-spacing: .16em;
    text-transform: uppercase;
  }
  .count { color: var(--lab-accent); text-shadow: var(--lab-text-glow); }

  .list {
    display: flex;
    flex-direction: column;
    gap: .3rem;
    min-height: 0;
    margin: .5rem 0 0;
    padding: 0;
    list-style: none;
    overflow-y: auto;
    scrollbar-width: none;
  }
  .list::-webkit-scrollbar { display: none; }

  .item {
    --kind: var(--kind-event);
    position: relative;
    display: flex;
    align-items: center;
    gap: .55rem;
    padding: .38rem .5rem .38rem .45rem;
    border: 1px solid transparent;
    border-radius: .75rem;
    transition: opacity .2s;
  }
  .item.holiday { --kind: var(--kind-holiday); }
  .item.personal { --kind: var(--kind-personal); }

  .when {
    display: grid;
    place-items: center;
    flex: none;
    width: 2.05rem;
    padding: .2rem 0 .15rem;
    border-radius: .55rem;
    background: color-mix(in srgb, var(--kind) 12%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--kind) 30%, transparent);
    line-height: 1.05;
  }
  .when b { color: var(--kind); font-size: .85rem; font-weight: 600; }
  .when small { color: var(--lab-muted); font-size: .5rem; letter-spacing: .12em; text-transform: uppercase; }

  .what { display: flex; flex-direction: column; gap: .18rem; min-width: 0; }
  .title { overflow: hidden; color: var(--lab-ink); font-family: system-ui, sans-serif; font-size: .74rem; font-weight: 500; line-height: 1.2; text-overflow: ellipsis; white-space: nowrap; }
  .tags { display: flex; flex-wrap: wrap; align-items: center; gap: .2rem .35rem; min-width: 0; }
  .chip {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: .05rem .38rem;
    border: 1px solid color-mix(in srgb, var(--kind) 45%, transparent);
    border-radius: 999px;
    color: var(--kind);
    font-size: .5rem;
    letter-spacing: .1em;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .rel { flex: none; color: var(--lab-muted); font-size: .54rem; letter-spacing: .06em; white-space: nowrap; }

  .item.past { opacity: .45; }
  .item.past .when { background: transparent; }
  .item.next {
    border-color: color-mix(in srgb, var(--kind) 35%, transparent);
    background: linear-gradient(100deg, color-mix(in srgb, var(--kind) 12%, transparent), transparent 80%);
  }
  .item.next .rel { color: var(--kind); }
  .item.is-today {
    border-color: var(--lab-accent);
    background: linear-gradient(100deg, var(--lab-accent-soft), transparent 85%);
    box-shadow: 0 0 18px -6px var(--lab-accent), inset 0 0 12px -6px var(--lab-accent);
  }
  .item.is-today .rel { color: var(--lab-accent); font-weight: 700; letter-spacing: .14em; text-transform: uppercase; text-shadow: var(--lab-text-glow); }
  .item.is-today::before {
    content: '';
    position: absolute;
    left: -1px;
    top: 22%;
    bottom: 22%;
    width: 2px;
    border-radius: 2px;
    background: var(--lab-accent);
    box-shadow: 0 0 8px var(--lab-accent);
  }

  .divider { display: flex; align-items: center; gap: .5rem; margin: .25rem .2rem .05rem; color: var(--lab-muted); font-size: .52rem; letter-spacing: .16em; text-transform: uppercase; }
  .divider::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, var(--lab-line), transparent); }
  .item.later { opacity: .62; }
  .item.later.next { opacity: .85; }
  .item.later .when { background: transparent; }

  .empty { display: grid; place-items: center; padding: .9rem 0 .4rem; color: var(--lab-muted); font-size: .6rem; letter-spacing: .12em; text-align: center; text-transform: uppercase; }

  /* Narrow: events sit under the grid as a compact strip of upcoming days. */
  @container (max-width: 499.98px) {
    .cal.with-events { grid-template-rows: minmax(0, 1fr) auto; }
    .events { padding: .55rem .6rem; }
    .events-head { display: none; }
    .list { display: grid; grid-template-columns: repeat(auto-fill, minmax(10.5rem, 1fr)); grid-auto-rows: 2.6rem; max-height: calc(5.2rem + .3rem); margin: 0; overflow: hidden; }
    .item.past, .divider, .empty, .has-upcoming .item.later, .events.quiet { display: none; }
    .item { min-width: 0; padding: .2rem .45rem .2rem .3rem; }
    .when { width: 1.8rem; }
  }
  @container (max-width: 260px) {
    .events { display: none; }
  }

  @keyframes ping {
    0% { opacity: .7; transform: scale(1); }
    70%, 100% { opacity: 0; transform: scale(1.6); }
  }
  @media (prefers-reduced-motion: reduce) {
    .day.today::after { animation: none; }
    .num, .item { transition: none; }
  }
</style>
