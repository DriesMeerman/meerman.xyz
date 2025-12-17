<script>
  let { timeLineItems = [] } = $props();
</script>

<ol class="timeline" style="--rail-left: 6.5rem;">
  {#each timeLineItems as item, i}
    <li class="item relative grid gap-6 py-6 md:grid-cols-[1fr_1fr]">
      <!-- Dot aligned to the rail -->
      <span class="dot" aria-hidden="true"></span>

      <!-- Left column (md+), stacked on small -->
      <div class={`left pr-2 ${i % 2 === 0 ? 'md:text-right' : ''}`}>
        {#if i % 2 === 0}
          <div class="date inline-block px-3 py-1 text-sm text-gray-700 dark:text-gray-300 rounded">
            {item.date}
          </div>
        {:else}
          <div class="content">
            <div class="flex items-center gap-2 md:justify-end">
              {#if item.image}
                <img src={item.image} alt={item.title} class="h-6 w-6 object-contain" />
              {/if}
              <h3 class="text-lg font-semibold text-gray-100">{item.title}</h3>
            </div>
            {#if item.subtitle}<p class="text-sm opacity-80 md:text-right">{item.subtitle}</p>{/if}
            {#if item.description}<p class="mt-2 mb-4 text-base font-normal text-gray-300 dark:text-gray-300 whitespace-pre-line md:text-right">{item.description}</p>{/if}
            {#if item.bullets?.length}
              <ul class="list-disc pl-5 text-sm md:pl-0 md:pr-5 md:list-inside md:text-right">
                {#each item.bullets as b}
                  <li>{b}</li>
                {/each}
              </ul>
            {/if}
            {#if item.attachments?.length}
              <div class="mt-2 flex flex-col gap-2 md:items-end">
                {#each item.attachments as a}
                  <a class="attachment-link flex items-center gap-2" href={a.url} target="_blank">
                    {#if a.image}
                      <img src={a.image} alt="" class="h-10 w-8 object-contain" />
                    {/if}
                    <span class="text-sm">{a.title}</span>
                  </a>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Right column (md+), stacked on small -->
      <div class="right pr-2">
        {#if i % 2 === 0}
          <div class="content">
            <div class="flex items-center gap-2">
              {#if item.image}
                <img src={item.image} alt={item.title} class="h-6 w-6 object-contain" />
              {/if}
              <h3 class="text-lg font-semibold text-gray-100">{item.title}</h3>
            </div>
            {#if item.subtitle}<p class="text-sm opacity-80">{item.subtitle}</p>{/if}
            {#if item.description}<p class="mt-2 mb-4 text-base font-normal text-gray-300 dark:text-gray-300 whitespace-pre-line">{item.description}</p>{/if}
            {#if item.bullets?.length}
              <ul class="list-disc pl-5 text-sm">
                {#each item.bullets as b}
                  <li>{b}</li>
                {/each}
              </ul>
            {/if}
            {#if item.attachments?.length}
              <div class="mt-2 flex flex-col gap-2">
                {#each item.attachments as a}
                  <a class="attachment-link flex items-center gap-2" href={a.url} target="_blank">
                    {#if a.image}
                      <img src={a.image} alt="" class="h-10 w-8 object-contain" />
                    {/if}
                    <span class="text-sm">{a.title}</span>
                  </a>
                {/each}
              </div>
            {/if}
          </div>
        {:else}
          <div class="date inline-block px-3 py-1 text-sm text-gray-700 dark:text-gray-300 rounded">
            {item.date}
          </div>
        {/if}
      </div>
    </li>
  {/each}
</ol>

<style>
  .timeline { position: relative; padding-left: 0; }
  .timeline::before { content:""; position:absolute; top:0; bottom:0; width:2px; left: var(--rail-left); background: linear-gradient(180deg, rgba(148,163,184,.4), rgba(100,116,139,.2)); z-index: 0; }
  @media (min-width: 768px) {
    .timeline::before { left: 50%; transform: translateX(-50%); }
  }
  .item { position: relative; }
  .dot { position:absolute; top: .8rem; width:.6rem; height:.6rem; border-radius:9999px; background: #e5e7eb; border:2px solid rgba(255,255,255,.8); left: var(--rail-left); transform: translateX(0); z-index: 1; }
  @media (min-width: 768px) {
    .dot { left: 50%; transform: translateX(-50%); }
  }
  :global(.dark .dot) { background:#374151; border-color:#0b0f19; }
  /* add rail-side spacing so content and bullets never overlap center rail */
  @media (min-width: 768px) {
    .left { padding-right: 2.5rem; }
    .right { padding-left: 2.5rem; }
  }
  .attachment-link {
    text-decoration: none;
    transition: opacity 0.2s ease;
  }
  .attachment-link:hover {
    opacity: 0.8;
  }
</style>
