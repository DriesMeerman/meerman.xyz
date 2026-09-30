<script>
  /**
   * @typedef {{
   *   title: string,
   *   subtitle?: string,
   *   date: string,
   *   image?: string,
   *   description?: string,
   *   bullets?: string[],
   *   attachments?: { title: string, url: string, image?: string }[]
   * }} TimelineItem
   */

  /** @type {{ timeLineItems?: TimelineItem[] }} */
  let { timeLineItems = [] } = $props();
  /** @type {Record<number, boolean>} */
  let detailOpen = $state({});

  /** @param {TimelineItem} item */
  function hasDetails(item) {
    return Boolean(item.description?.trim() || (item.bullets?.length ?? 0) > 3 || item.attachments?.length);
  }

  /** @param {string} bullet */
  function summaryChipLabel(bullet) {
    if (bullet === 'Workplace Service Delivery (contract)') return 'WSD (contract)';
    return bullet;
  }

  /**
   * @param {TimelineItem} item
   * @param {number} index
   */
  function visibleBullets(item, index) {
    const bullets = item.bullets ?? [];
    return detailOpen[index] ? bullets : bullets.slice(0, 3);
  }

  /** @param {string} date */
  function machineDate(date) {
    /** @type {Record<string, string>} */
    const months = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
      Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
    const [year, month] = date.split(/\s+/);
    const monthKey = month ? month.charAt(0).toUpperCase() + month.slice(1).toLowerCase() : '';
    return /^\d{4}$/.test(year) && months[monthKey] ? year + '-' + months[monthKey] : undefined;
  }
</script>

<ol class="timeline">
  {#each timeLineItems as item, i (item)}
    <li class="timeline-item">
      <span class="timeline-node" aria-hidden="true"></span>
      <article class="entry-card">
        <header>
          <div class="entry-meta">
            <time datetime={machineDate(item.date)}>{item.date}</time>
            <span class="entry-index" aria-hidden="true">ENTRY / {String(i + 1).padStart(2, '0')}</span>
          </div>
          <div class="entry-heading">
            {#if item.image}
              <div class="logo-window">
                <img src={item.image} alt="" class="entry-logo" loading="lazy" />
              </div>
            {/if}
            <div class="entry-name">
              <h3 class="entry-title">{item.title}</h3>
              {#if item.subtitle}
                <p class="entry-subtitle">{item.subtitle}</p>
              {/if}
            </div>
          </div>
          {#if item.bullets?.length}
            <div class="summary-chips" aria-label="Highlights">
              {#each visibleBullets(item, i) as bullet (bullet)}
                <span class="summary-chip">{summaryChipLabel(bullet)}</span>
              {/each}
              {#if item.bullets.length > 3 && !detailOpen[i]}
                <span class="more-chip">+{item.bullets.length - 3} in details</span>
              {/if}
            </div>
          {/if}
        </header>

        {#if hasDetails(item)}
          <details class="entry-details" ontoggle={(event) => (detailOpen[i] = event.currentTarget.open)}>
            <summary>
              <span>Details<span class="summary-context"> for {item.subtitle || item.title}, {item.date}</span></span>
              <span class="detail-toggle" aria-hidden="true"></span>
            </summary>
            <div class="details-body">
              {#if item.description}
                <p class="entry-description">{item.description}</p>
              {/if}
              {#if item.attachments?.length}
                <div class="attachment-list">
                  {#each item.attachments as attachment (attachment.url)}
                    <a class="attachment-link" href={attachment.url} target="_blank" rel="noopener noreferrer">
                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                        <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 2v6h5M9 13h6M9 17h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                      <span>{attachment.title}</span>
                      <span class="attachment-arrow" aria-hidden="true">↗</span>
                    </a>
                  {/each}
                </div>
              {/if}
            </div>
          </details>
        {/if}
      </article>
    </li>
  {/each}
</ol>

<style>
  .timeline {
    list-style: none;
    position: relative;
    margin: 0;
    padding: 0 0 0 2rem;
  }

  .timeline::before {
    content: '';
    position: absolute;
    top: 1.8rem;
    bottom: 2rem;
    left: .3rem;
    width: 1px;
    background: linear-gradient(var(--profile-accent), var(--profile-line));
    opacity: .5;
  }

  .timeline-item { position: relative; padding-bottom: 1.2rem; }
  .timeline-item:last-child { padding-bottom: 0; }

  .timeline-node {
    position: absolute;
    top: 1.65rem;
    left: -1.95rem;
    width: .55rem;
    height: .55rem;
    border: 1px solid var(--profile-accent);
    background: var(--profile-inset);
    transform: rotate(45deg);
  }

  .entry-card {
    position: relative;
    padding: 1.5rem;
    border: 1px solid var(--profile-line);
    border-radius: var(--profile-radius);
    color: var(--profile-ink);
    background: linear-gradient(135deg, #43cbc414, transparent 55%, #8299e410), var(--profile-surface);
    box-shadow: var(--profile-shadow);
    transition: transform 180ms ease, border-color 180ms ease;
  }

  .entry-card::after {
    content: '';
    position: absolute;
    top: 8px;
    right: 8px;
    width: 17px;
    height: 17px;
    border-top: 1px solid var(--profile-accent);
    border-right: 1px solid var(--profile-accent);
    border-radius: 0 .4rem 0 0;
    opacity: .75;
    pointer-events: none;
  }

  .entry-card:hover { border-color: var(--profile-accent); transform: translateY(-1px); }

  .entry-meta {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
    padding-bottom: .85rem;
    border-bottom: 1px solid var(--profile-line);
    color: var(--profile-accent);
    font-family: var(--profile-meta-font);
    font-size: .65rem;
    line-height: 1.6;
    letter-spacing: .07em;
    text-transform: uppercase;
  }

  .entry-index { color: var(--profile-muted); font-size: .57rem; }
  .entry-heading { display: flex; align-items: center; gap: 1rem; }
  .entry-name { min-width: 0; }

  .logo-window {
    width: 4rem;
    height: 4rem;
    flex-shrink: 0;
    padding: .6rem;
    border: 1px solid var(--profile-line);
    border-radius: .45rem;
    background: var(--profile-inset);
    box-shadow: inset 0 1px 3px #00000019;
  }

  .entry-logo { width: 100%; height: 100%; object-fit: contain; }

  .entry-title {
    margin: 0;
    font-family: var(--profile-display-font);
    font-size: 1.05rem;
    font-weight: 400;
    line-height: 1.6;
    overflow-wrap: anywhere;
  }

  .entry-subtitle {
    margin: .25rem 0 0;
    color: var(--profile-muted);
    font-size: .9rem;
    line-height: 1.5;
  }

  .summary-chips { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; margin-top: 1.1rem; }

  .summary-chip {
    max-width: 100%;
    padding: .4rem .55rem;
    border: 1px solid var(--profile-line);
    border-radius: .15rem;
    background: #789b9b16;
    box-shadow: inset 1px 1px 3px #0000000a;
    font-family: var(--profile-meta-font);
    font-size: .61rem;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }

  .more-chip { color: var(--profile-muted); font-family: var(--profile-meta-font); font-size: .61rem; }

  .entry-details {
    margin-top: 1.15rem;
    padding-top: .8rem;
    border-top: 1px solid var(--profile-line);
  }

  .entry-details > summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: .25rem 0;
    color: var(--profile-accent);
    font-size: .78rem;
    font-weight: 600;
    line-height: 1.6;
    list-style: none;
    cursor: pointer;
  }

  .entry-details > summary::-webkit-details-marker { display: none; }
  .detail-toggle::before { content: '+'; font-family: var(--profile-meta-font); font-size: 1rem; font-weight: 400; }
  .entry-details[open] .detail-toggle::before { content: '−'; }

  .summary-context {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .details-body { display: grid; gap: .9rem; padding-top: .85rem; }
  .entry-description { margin: 0; color: var(--profile-muted); font-size: .9rem; line-height: 1.75; white-space: pre-line; }
  .attachment-list { display: flex; flex-wrap: wrap; gap: .6rem; }

  .attachment-link {
    display: inline-flex;
    align-items: center;
    gap: .6rem;
    max-width: 100%;
    padding: .6rem .7rem;
    border: 1px solid var(--profile-line);
    border-radius: .3rem;
    color: var(--profile-ink);
    background: var(--profile-inset);
    font-size: .75rem;
    line-height: 1.5;
    text-decoration: none;
  }

  .attachment-link svg { width: 1rem; height: 1rem; flex-shrink: 0; color: var(--profile-accent); }
  .attachment-link span { overflow-wrap: anywhere; }
  .attachment-arrow { color: var(--profile-accent); }
  .attachment-link:hover { border-color: var(--profile-accent); }

  .entry-details > summary:focus-visible,
  .attachment-link:focus-visible { outline: 2px solid var(--profile-accent); outline-offset: 4px; }

  @media (min-width: 1024px) {
    .timeline { padding-left: 0; }
    .timeline::before { left: 50%; }
    .timeline-item { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); column-gap: 3rem; }
    .timeline-item:nth-child(odd) .entry-card { grid-column: 2; }
    .timeline-item:nth-child(even) .entry-card { grid-column: 1; }
    .timeline-node { left: 50%; transform: translateX(-50%) rotate(45deg); }
    .timeline-item::before {
      content: '';
      position: absolute;
      top: 1.9rem;
      left: 50%;
      width: 1.5rem;
      border-top: 1px solid var(--profile-line);
    }
    .timeline-item:nth-child(even)::before { left: calc(50% - 1.5rem); }
    .entry-card { padding: 1.25rem; }
    .entry-heading { align-items: flex-start; gap: .75rem; }
    .logo-window { width: 3rem; height: 3rem; padding: .45rem; }
    .entry-title { font-size: .95rem; }
  }

  @media (max-width: 640px) {
    .timeline { padding-left: 1.2rem; }
    .timeline::before { left: .2rem; }
    .timeline-node { left: -1.25rem; }
    .entry-card { padding: 1.1rem; }
    .entry-heading { gap: .75rem; }
    .logo-window { width: 3rem; height: 3rem; padding: .45rem; }
    .entry-title { font-size: .85rem; line-height: 1.65; }
    .entry-subtitle { font-size: .8rem; }
  }

  @media (max-width: 380px) {
    .entry-card { padding: .85rem; }
    .entry-heading { flex-direction: column; align-items: flex-start; }
  }

  @media (prefers-reduced-motion: reduce) {
    .entry-card { transition: none; }
    .entry-card:hover { transform: none; }
  }
</style>
