<script>
  let { class: klass = '', children } = $props();
</script>

<div class={`rounded-md border dark:border-zinc-600 ${klass}`}>
  {@render children?.()}
</div>


