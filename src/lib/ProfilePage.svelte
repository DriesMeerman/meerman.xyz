<script>
  /** @type {{ title: string; description: string; children?: import('svelte').Snippet }} */
  let { title, description, children } = $props();
</script>

<div class="profile-theme profile-page">
  <div class="page-marker">
    <span class="marker-cross" aria-hidden="true">+</span>
    <span>MEERMAN / {title.toUpperCase()}</span>
  </div>
  <header class="page-head">
    <h1>{title}<span aria-hidden="true">.</span></h1>
    <p>{description}</p>
  </header>
  {@render children?.()}
</div>

<style>
  .profile-page { max-width: 1120px; margin: 0 auto; }
  .page-marker { display: flex; gap: .75rem; align-items: center; padding-bottom: 1rem; border-bottom: 1px solid var(--profile-line); font-family: var(--profile-meta-font); font-size: .67rem; line-height: 1.6; letter-spacing: .12em; color: var(--profile-muted); }
  .marker-cross { font-size: 1rem; color: var(--profile-accent); }
  .page-head { padding: 2.5rem 0 2rem; }
  h1 { margin: 0; font-family: var(--profile-display-font); font-size: clamp(1.7rem, 3.1vw, 3rem); line-height: 1.3; letter-spacing: -.045em; }
  h1 span { color: var(--profile-accent); }
  .page-head p { margin-top: 1rem; max-width: 52ch; color: var(--profile-muted); font-size: .95rem; line-height: 1.75; }
  @media (max-width: 380px) {
    .page-marker { font-size: .6rem; letter-spacing: .05em; }
    .page-head { padding-top: 2rem; }
  }
</style>
