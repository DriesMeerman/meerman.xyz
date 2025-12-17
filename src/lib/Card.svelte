<script>
  let { class: klass = '', children } = $props();
</script>

<div class={`rounded shadow-lg bg-stone-200 dark:bg-zinc-500 bg-opacity-80 dark:bg-opacity-70 flex ${klass}`}>
  {@render children?.()}
</div>


