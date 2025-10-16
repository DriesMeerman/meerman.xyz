<script>
  let { timeLineItems = [] } = $props();
</script>

<ol class="timeline" style="--rail-left: 6.5rem;">
  {#each timeLineItems as item}
    <li class="item grid grid-cols-[6.5rem_1fr] gap-6 py-6">
      <div class="date relative pr-6 text-sm text-gray-700 dark:text-gray-300">
        <span class="dot" aria-hidden="true"></span>
        {item.date}
      </div>
      <div class="content pr-2">
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
              <a class="text-sky-400 underline" href={a.url} target="_blank">{a.title}</a>
            {/each}
          </div>
        {/if}
      </div>
    </li>
  {/each}
</ol>

<style>
  .timeline { position: relative; padding-left: 0; }
  .timeline::before { content:""; position:absolute; top:0; bottom:0; width:2px; left: var(--rail-left); background: linear-gradient(180deg, rgba(148,163,184,.4), rgba(100,116,139,.2)); }
  .item { position: relative; }
  .date .dot { position:absolute; right:-1px; top: .35rem; width:.6rem; height:.6rem; border-radius:9999px; background: #e5e7eb; border:2px solid rgba(255,255,255,.8); transform: translateX(50%); }
  :global(.dark .date .dot) { background:#374151; border-color:#0b0f19; }
</style>


