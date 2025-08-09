<script>
  let { timeLineItems = [] } = $props();
</script>

<ol class="timeline relative border-l border-gray-200 dark:border-gray-700">
  {#each timeLineItems as item}
    <li class="mb-10 ml-4">
      <div class="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -left-1.5 border border-white dark:border-gray-900 dark:bg-gray-700"></div>
      <time class="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">{item.date}</time>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{item.title}</h3>
      {#if item.subtitle}<p class="text-sm opacity-80">{item.subtitle}</p>{/if}
      {#if item.description}<p class="mb-4 text-base font-normal text-gray-500 dark:text-gray-400 whitespace-pre-line">{item.description}</p>{/if}
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
            <a class="text-sky-600 underline" href={a.url} target="_blank">{a.title}</a>
          {/each}
        </div>
      {/if}
    </li>
  {/each}
</ol>

<style>
  :global(.timeline) { padding: 0 !important; }
  </style>


