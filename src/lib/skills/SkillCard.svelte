<script>
  import TradingCard from '$lib/TradingCard.svelte';
  let { skill } = $props();
</script>

<div>
  <TradingCard image={skill.image} alt={skill.logoAlt} rarity={skill.rarity}>
    <div class="flex flex-col justify-between h-full">
      <div>
        <h2 class="skill-title">{skill.name}</h2>
        <hr class="max-w-[90%] dark:border-zinc-50 border-zinc-800" />
      </div>
      <div class="rounded-sm flex flex-row">
        {#each skill.attributes as attribute}
          <div class="skill-attribute py-1 px-2 mr-2 mt-1" title={attribute}>{attribute}</div>
        {/each}
      </div>
    </div>
  </TradingCard>
</div>

<style>
  @font-face { font-family: "Bruno Ace"; src: url("/assets/BrunoAce-Regular.woff2") format("woff2"); }
  .skill-title { font-family: "Bruno Ace", cursive; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; }
  .skill-attribute { box-shadow: inset 1px 1px 2px 1px #0000004f; font-weight: 300; text-transform: uppercase; font-size: 8px; }
</style>

