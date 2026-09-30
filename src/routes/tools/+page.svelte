<script>
  import ProfilePage from '$lib/ProfilePage.svelte';
  import { tools, unixTools } from '$lib/data/toolData.js';
</script>

<svelte:head>
  <title>Tools · Meerman</title>
  <meta name="description" content="Tools, programs, and Unix utilities that Dries Meerman finds useful and uses on a daily basis." />
</svelte:head>

<ProfilePage title="Tools" description="An overview of tools and programs I find useful and use on a daily basis.">
  <section class="profile-section" aria-labelledby="software-heading">
    <div class="profile-section-head">
      <h2 id="software-heading" class="profile-section-title">01 / Software</h2>
      <span class="profile-section-count">{tools.length} tools</span>
    </div>
    <div class="tools-grid">
      {#each tools as tool (tool.name)}
        <article class="profile-panel tool-card">
          <div class="tool-icon"><img src={tool.icon} alt="" width="80" height="80" /></div>
          <h3>{tool.name}</h3>
        </article>
      {/each}
    </div>
  </section>

  <section class="profile-section" aria-labelledby="unix-heading">
    <div class="profile-section-head">
      <h2 id="unix-heading" class="profile-section-title">02 / Unix tools</h2>
      <span class="profile-section-count">{unixTools.length} utilities</span>
    </div>
    <div class="unix-grid">
      {#each unixTools as tool (tool.name)}
        <article class="profile-panel unix-card">
          <div class="unix-card-head">
            <h3><span class="prompt" aria-hidden="true">$</span><code>{tool.name}</code></h3>
            {#if tool.url}
              <a href={tool.url} target="_blank" rel="external noopener noreferrer" aria-label={tool.url.includes('github') ? `${tool.name} on GitHub` : `Official website for ${tool.name}`}>
                <span aria-hidden="true">↗</span>
              </a>
            {/if}
          </div>
          <p>{tool.description}</p>
        </article>
      {/each}
    </div>
  </section>
  <p class="updated">Last updated: <time datetime="2025-05-14">2025-05-14</time></p>
</ProfilePage>

<style>
  .tools-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 140px), 1fr)); gap: 1rem; }
  .tool-card { display: flex; flex-direction: column; align-items: center; padding: 1.25rem .75rem; text-align: center; }
  .tool-icon { display: grid; place-items: center; width: 100px; height: 100px; border: 1px solid var(--profile-line); border-radius: .4rem; background: var(--profile-inset); }
  .tool-icon img { width: 80px; height: 80px; object-fit: contain; }
  .tool-card h3 { margin-top: 1rem; font-family: var(--profile-display-font); font-size: .8rem; line-height: 1.6; overflow-wrap: anywhere; }
  .unix-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 1rem; }
  .unix-card { min-width: 0; padding: 1.25rem; }
  .unix-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: .75rem; padding-bottom: .75rem; border-bottom: 1px solid var(--profile-line); }
  .unix-card h3 { display: flex; flex: 1; gap: .6rem; min-width: 0; padding: .55rem .7rem; border: 1px solid var(--profile-line); border-radius: .3rem; background: var(--profile-inset); font-size: .85rem; line-height: 1.6; }
  .unix-card code { font-family: var(--profile-meta-font); overflow-wrap: anywhere; }
  .prompt { flex-shrink: 0; color: var(--profile-accent); font-family: var(--profile-meta-font); font-weight: 600; user-select: none; }
  .unix-card a { display: grid; place-items: center; flex-shrink: 0; width: 2rem; height: 2rem; border: 1px solid var(--profile-line); border-radius: .3rem; background: var(--profile-inset); color: var(--profile-accent); text-decoration: none; }
  .unix-card a:hover { border-color: var(--profile-accent); }
  .unix-card a:focus-visible { outline: 2px solid var(--profile-accent); outline-offset: 3px; }
  .unix-card p { margin-top: .85rem; color: var(--profile-muted); font-size: .9rem; line-height: 1.75; overflow-wrap: anywhere; }
  .updated { margin-top: 1.5rem; color: var(--profile-muted); font-family: var(--profile-meta-font); font-size: .65rem; line-height: 1.6; }
  @media (max-width: 640px) { .unix-card { padding: 1rem; } }
</style>
