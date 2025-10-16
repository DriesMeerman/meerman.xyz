<script>
  let { name, selected } = $props();
</script>

<button class={`px-3 py-1 rounded-full border ${selected ? 'bg-sky-600 text-white' : 'bg-transparent dark:text-white'}`}>
  {name}
</button>


