<script>
  let { class: klass = '', children } = $props();
</script>

<div class={`rounded shadow-lg bg-stone-200 dark:bg-zinc-700 bg-opacity-80 dark:bg-opacity-60 backdrop-blur-sm flex ${klass}`}>
  {@render children?.()}
</div>


