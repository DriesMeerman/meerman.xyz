<script>
  let { timeLineItems = [] } = $props();
  let detailOpen = $state({});

  /** @param {{ description?: string, bullets?: string[], attachments?: { title?: string, url?: string, image?: string }[] }} item */
  function hasDetails(item) {
    return Boolean(item.description?.trim() || item.bullets?.length || item.attachments?.length);
  }

  /** @param {string} bullet */
  function summaryChipLabel(bullet) {
    if (bullet === 'Workplace Service Delivery (contract)') return 'WSD (contract)';
    return bullet;
  }

  function visibleBullets(item, index) {
    const bullets = item.bullets ?? [];
    if (bullets.length <= 3 || detailOpen[index]) return bullets;
    return bullets.slice(0, 3);
  }
</script>

<ol class="timeline-v2" style="--rail-left: 1.15rem;">
  {#each timeLineItems as item, i}
    <li class={`timeline-item ${i % 2 === 0 ? 'right-side' : 'left-side'}`}>
      <span class="timeline-node" aria-hidden="true"></span>
      <article class="entry-card">
        <header class="entry-header">
          <div class="entry-heading">
            {#if item.image}
              <img src={item.image} alt={item.title} class="entry-logo" loading="lazy" />
            {/if}
            <div>
              <p class="entry-date">{item.date}</p>
              <h3 class="entry-title">{item.title}</h3>
              {#if item.subtitle}
                <p class="entry-subtitle">{item.subtitle}</p>
              {/if}
            </div>
          </div>
          {#if item.bullets?.length}
            <div class="summary-chips" aria-label="Highlights">
              {#each visibleBullets(item, i) as bullet}
                <span class="summary-chip" title={bullet}>{summaryChipLabel(bullet)}</span>
              {/each}
              {#if item.bullets.length > 3 && !detailOpen[i]}
                <span class="summary-chip more-chip">.. more</span>
              {/if}
            </div>
          {/if}
        </header>

        {#if hasDetails(item)}
          <details class="entry-details" ontoggle={(event) => (detailOpen[i] = event.currentTarget.open)}>
            <summary>Details</summary>
            <div class="details-body">
              {#if item.description}
                <p class="entry-description">{item.description}</p>
              {/if}

              {#if item.attachments?.length}
                <div class="attachment-list">
                  {#each item.attachments as a}
                    <a class="attachment-link" href={a.url} target="_blank" rel="noopener noreferrer">
                      <span class="attachment-icon" aria-hidden="true">
                        {#if a.image}
                          <img src={a.image} alt="" loading="lazy" />
                        {:else}
                          <svg viewBox="0 0 24 24" fill="none">
                            <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="1.4" />
                            <path d="M14 2v6h6" stroke="currentColor" stroke-width="1.4" />
                            <path d="M12 12v5m0 0 2-2m-2 2-2-2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
                          </svg>
                        {/if}
                      </span>
                      <span class="attachment-title">{a.title}</span>
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
  .timeline-v2 {
    --rail-color: linear-gradient(180deg, rgba(20, 184, 166, 0.55), rgba(59, 130, 246, 0.2));
    list-style: none;
    position: relative;
    margin: 0;
    padding: 0 0 0 2.75rem;
  }

  .timeline-v2::before {
    content: "";
    position: absolute;
    top: 0.35rem;
    bottom: 0.35rem;
    left: var(--rail-left);
    width: 2px;
    border-radius: 999px;
    background: var(--rail-color);
  }

  .timeline-item {
    position: relative;
    padding: 0 0 1.2rem;
    opacity: 0;
    animation: entryIn 240ms ease forwards;
  }

  .timeline-item:nth-child(2) { animation-delay: 40ms; }
  .timeline-item:nth-child(3) { animation-delay: 80ms; }
  .timeline-item:nth-child(4) { animation-delay: 120ms; }

  .timeline-node {
    position: absolute;
    top: 1rem;
    left: calc(var(--rail-left) - 0.33rem);
    width: 0.72rem;
    height: 0.72rem;
    border-radius: 999px;
    background: rgba(250, 252, 255, 0.9);
    border: 2px solid rgba(20, 184, 166, 0.68);
    box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.14);
    transition: transform 180ms ease, box-shadow 180ms ease;
  }

  .entry-card {
    border-radius: 0.95rem;
    border: 1px solid rgba(148, 163, 184, 0.38);
    background:
      linear-gradient(155deg, rgba(255, 255, 255, 0.8), rgba(241, 245, 249, 0.62)),
      rgba(255, 255, 255, 0.46);
    backdrop-filter: blur(9px);
    -webkit-backdrop-filter: blur(9px);
    padding: 1rem 1rem 0.9rem;
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.09);
    transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
  }

  .timeline-item:hover .entry-card {
    transform: translateY(-1px);
    border-color: rgba(20, 184, 166, 0.45);
    box-shadow: 0 10px 24px rgba(14, 116, 144, 0.14);
  }

  .timeline-item:hover .timeline-node {
    transform: scale(1.05);
    box-shadow: 0 0 0 5px rgba(20, 184, 166, 0.17);
  }

  .entry-header {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
  }

  .entry-heading {
    display: flex;
    align-items: flex-start;
    gap: 0.7rem;
  }

  .entry-logo {
    width: 1.75rem;
    height: 1.75rem;
    margin-top: 0.15rem;
    object-fit: contain;
    opacity: 0.94;
  }

  .entry-date {
    margin: 0;
    font-size: 0.74rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #0f766e;
  }

  .entry-title {
    margin: 0.1rem 0 0;
    font-size: 1.05rem;
    line-height: 1.25;
    color: #0f172a;
    font-weight: 700;
  }

  .entry-subtitle {
    margin: 0.2rem 0 0;
    color: #334155;
    font-size: 0.9rem;
  }

  .summary-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .summary-chip {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: #334155;
    border: 1px solid rgba(148, 163, 184, 0.48);
    background: rgba(248, 250, 252, 0.76);
    border-radius: 999px;
    padding: 0.2rem 0.5rem;
    max-width: min(24rem, 100%);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .entry-details {
    margin-top: 0.75rem;
    border-top: 1px solid rgba(148, 163, 184, 0.32);
    padding-top: 0.55rem;
  }

  .entry-details > summary {
    cursor: pointer;
    list-style: none;
    font-size: 0.8rem;
    color: #0f766e;
    font-weight: 600;
    width: fit-content;
    border-radius: 999px;
    padding: 0.2rem 0.5rem;
    background: rgba(240, 253, 250, 0.76);
    transition: color 150ms ease, background-color 150ms ease;
  }

  .entry-details > summary::-webkit-details-marker { display: none; }

  .entry-details > summary:hover,
  .entry-details > summary:focus-visible {
    color: #0c4a6e;
    background: rgba(186, 230, 253, 0.6);
    outline: none;
  }

  .details-body {
    margin-top: 0.75rem;
    display: grid;
    gap: 0.7rem;
  }

  .entry-description {
    margin: 0;
    color: #334155;
    white-space: pre-line;
    line-height: 1.5;
  }

  .attachment-list {
    display: grid;
    gap: 0.45rem;
  }

  .attachment-link {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    gap: 0.5rem;
    color: #334155;
    border-radius: 0.6rem;
    border: 1px solid rgba(148, 163, 184, 0.35);
    background: rgba(248, 250, 252, 0.66);
    padding: 0.35rem 0.55rem;
    text-decoration: none;
    transition: border-color 180ms ease, background-color 180ms ease, color 180ms ease;
  }

  .attachment-link:hover,
  .attachment-link:focus-visible {
    border-color: rgba(20, 184, 166, 0.48);
    background: rgba(240, 253, 250, 0.8);
    color: #0f172a;
    outline: none;
  }

  .attachment-icon {
    width: 1rem;
    height: 1rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    opacity: 0.8;
    color: #475569;
  }

  .attachment-icon img,
  .attachment-icon svg {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .attachment-title {
    font-size: 0.8rem;
    line-height: 1.2;
  }

  @media (min-width: 768px) {
    .timeline-v2 {
      padding-left: 0;
    }

    .timeline-v2::before {
      left: 50%;
      transform: translateX(-50%);
    }

    .timeline-item {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      padding-bottom: 1.4rem;
    }

    .timeline-item.right-side .entry-card {
      grid-column: 2;
      margin-left: 2.2rem;
    }

    .timeline-item.left-side .entry-card {
      grid-column: 1;
      margin-right: 2.2rem;
    }

    .timeline-node {
      left: 50%;
      transform: translateX(-50%);
    }

    .timeline-item:hover .timeline-node {
      transform: translateX(-50%) scale(1.05);
    }
  }

  :global(.dark .timeline-v2) {
    --rail-color: linear-gradient(180deg, rgba(56, 189, 248, 0.7), rgba(2, 132, 199, 0.22));
  }

  :global(.dark .entry-card) {
    border-color: rgba(148, 163, 184, 0.27);
    background:
      linear-gradient(155deg, rgba(39, 39, 42, 0.76), rgba(63, 63, 70, 0.54)),
      rgba(39, 39, 42, 0.5);
    box-shadow: 0 6px 18px rgba(2, 6, 23, 0.26);
  }

  :global(.dark .timeline-item:hover .entry-card) {
    border-color: rgba(56, 189, 248, 0.38);
    box-shadow: 0 10px 24px rgba(2, 6, 23, 0.32);
  }

  :global(.dark .timeline-node) {
    background: rgba(39, 39, 42, 0.92);
    border-color: rgba(56, 189, 248, 0.72);
    box-shadow: 0 0 0 4px rgba(2, 132, 199, 0.24);
  }

  :global(.dark .entry-date) { color: #67e8f9; }
  :global(.dark .entry-title) { color: #f8fafc; }
  :global(.dark .entry-subtitle),
  :global(.dark .entry-description) { color: #cbd5e1; }

  :global(.dark .summary-chip) {
    color: #e2e8f0;
    border-color: rgba(148, 163, 184, 0.34);
    background: rgba(63, 63, 70, 0.62);
  }

  :global(.dark .entry-details) { border-top-color: rgba(148, 163, 184, 0.25); }

  :global(.dark .entry-details > summary) {
    color: #67e8f9;
    background: rgba(8, 47, 73, 0.45);
  }

  :global(.dark .entry-details > summary:hover),
  :global(.dark .entry-details > summary:focus-visible) {
    color: #bae6fd;
    background: rgba(7, 89, 133, 0.44);
  }

  :global(.dark .attachment-link) {
    color: #d8e0ec;
    border-color: rgba(148, 163, 184, 0.3);
    background: rgba(39, 39, 42, 0.66);
  }

  :global(.dark .attachment-link:hover),
  :global(.dark .attachment-link:focus-visible) {
    color: #f8fafc;
    border-color: rgba(56, 189, 248, 0.48);
    background: rgba(15, 23, 42, 0.72);
  }

  :global(.dark .attachment-icon) { color: #94a3b8; }

  @media (prefers-reduced-motion: reduce) {
    .timeline-item {
      opacity: 1;
      animation: none;
    }

    .entry-card,
    .timeline-node,
    .attachment-link,
    .entry-details > summary {
      transition: none;
    }
  }

  @keyframes entryIn {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
