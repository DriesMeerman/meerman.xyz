<script>
  import Card from '$lib/Card.svelte';
  import PillButton from '$lib/skills/PillButton.svelte';
  import SkillCard from '$lib/skills/SkillCard.svelte';
  import { skills } from '$lib/model/Skill.js';

  let categories = $state({
    lang: { name: 'Languages', selected: true, items: skills.language },
    framework: { name: 'Frameworks', selected: true, items: skills.framework },
    tooling: { name: 'Tools', selected: true, items: skills.tooling },
    misc: { name: 'Miscellaneous', selected: true, items: skills.misc }
  });

  let selectedCount = $derived(Object.values(categories).filter((c) => c.selected).length);
  let keywords = Object.values(categories).flatMap((c) => c.items).map((s) => s.name).join(', ');
</script>

<div class="category-selectors flex flex-row flex-wrap mb-4">
  {#each Object.values(categories) as category}
    <div class="m-1">
      <PillButton name={category.name} selected={category.selected} on:click={() => { category.selected = !category.selected; }} />
    </div>
  {/each}
  </div>

{#if selectedCount > 0}
  <Card class="px-2 py-3 mb-4 flex flex-col backdrop-blur-sm">
    {#each Object.values(categories) as category}
      <div class="p-1" class:hidden={!category.selected}>
        <h4 class="h4 ml-2">{category.name}</h4>
        <hr />
        <div class="flex flex-row justify-center flex-wrap md:p-4 md:mx-8  gap-4 md:gap-8 py-4">
          {#each category.items || [] as skill}
            <div class="scale-90 md:scale-100">
              <SkillCard {skill} />
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </Card>
{/if}

<svelte:head>
  <title>Meerman</title>
  <meta name="description" content="A list of hard and soft skills, visualized in a trading card format.">
  <meta name="author" content="Dries Meerman">
  <meta name="keywords" content={`Dries Meerman, Meerman, Software Engineer, Software Engineering, Software Architect, Programmer, ${keywords}`}>
</svelte:head>


