<script>
  let { skill } = $props();
</script>

<div class="w-48 bg-stone-200 dark:bg-gray-700 rounded-lg p-3 text-sm">
  <div class="w-full h-28 flex items-center justify-center overflow-hidden">
    <img src={skill.image} alt={skill.altText || `${skill.name} logo`} class="max-h-24" />
  </div>
  <div class="mt-2">
    <h3 class="font-semibold">{skill.name}</h3>
    <p class="text-xs opacity-80">{skill.description}</p>
  </div>
</div>


