<script>
  import ProfilePage from '$lib/ProfilePage.svelte';
  import SkillCard from '$lib/skills/SkillCard.svelte';
  import { skills } from '$lib/model/Skill.js';

  let categories = $state({
    lang: { name: 'Languages', selected: true, items: skills.language },
    framework: { name: 'Frameworks', selected: true, items: skills.framework },
    tooling: { name: 'Tools', selected: true, items: skills.tooling },
    leadership: { name: 'Leadership', selected: true, items: skills.leadership },
    misc: { name: 'Miscellaneous', selected: true, items: skills.misc }
  });

  let selectedCount = $derived(Object.values(categories).filter((c) => c.selected).length);
  let keywords = Object.values(categories).flatMap((c) => c.items).map((s) => s.name).join(', ');
</script>

<ProfilePage title="Skills" description="Engineering, software development, and leadership, collected as trading cards. Select a category and flip a card to explore.">
  <div class="category-selectors" role="group" aria-label="Skill categories">
    {#each Object.values(categories) as category (category.name)}
      <button type="button" class="category-filter" aria-pressed={category.selected} onclick={() => { category.selected = !category.selected; }}>
        <span class="filter-indicator" aria-hidden="true">{category.selected ? '✓' : '+'}</span>
        {category.name}
      </button>
    {/each}
  </div>

  {#if selectedCount > 0}
    <div class="profile-panel skills-panel">
      {#each Object.values(categories) as category, index (category.name)}
        <section class="profile-section" class:hidden={!category.selected} aria-labelledby={`skill-category-${index}`}>
          <div class="profile-section-head">
            <h2 id={`skill-category-${index}`} class="profile-section-title">{String(index + 1).padStart(2, '0')} / {category.name}</h2>
            <span class="profile-section-count">{category.items.length} cards</span>
          </div>
          <div class="skills-grid flex flex-row justify-center flex-wrap gap-4 md:gap-8 py-4">
            {#each category.items as skill (skill.name)}
              <div class="scale-90 md:scale-100">
                <SkillCard {skill} />
              </div>
            {/each}
          </div>
        </section>
      {/each}
    </div>
  {:else}
    <div class="profile-panel empty-state" role="status">Select a category to see its cards.</div>
  {/if}
</ProfilePage>

<svelte:head>
  <title>Skills · Meerman</title>
  <meta name="description" content="Engineering leadership, people management, and software development skills, visualized in a trading card format.">
  <meta name="author" content="Dries Meerman">
  <meta name="keywords" content={`Dries Meerman, Meerman, Software Engineer, Software Engineering, Software Architect, Programmer, ${keywords}`}>
</svelte:head>

<style>
  .category-selectors { display: flex; flex-wrap: wrap; gap: .5rem; margin-bottom: 1.5rem; }
  .category-filter { display: inline-flex; align-items: center; gap: .5rem; padding: .65rem .8rem; border: 1px solid var(--profile-line); border-radius: .3rem; background: var(--profile-inset); color: var(--profile-muted); font-family: var(--profile-meta-font); font-size: .7rem; line-height: 1.5; }
  .category-filter[aria-pressed='true'] { border-color: var(--profile-accent); color: var(--profile-accent); }
  .category-filter:hover { border-color: var(--profile-accent); }
  .category-filter:focus-visible { outline: 2px solid var(--profile-accent); outline-offset: 3px; }
  .filter-indicator { width: 1ch; }
  .skills-panel { padding: 1.5rem; }
  .profile-section-head { padding-bottom: .5rem; }
  .skills-grid { color: #1f2937; }
  :global(.dark) .skills-grid { color: #fff; }
  .empty-state { padding: 1.5rem; color: var(--profile-muted); font-size: .9rem; line-height: 1.75; }
  @media (max-width: 640px) {
    .skills-panel { padding: .85rem .5rem; }
    .profile-section-head { margin-inline: .35rem; gap: .5rem; }
  }
</style>
