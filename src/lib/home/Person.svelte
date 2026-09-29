<script>
  import { getPictureSources } from '$lib/services/imageService.js';

  /** @type {{ heading: import('svelte').Snippet; children?: import('svelte').Snippet }} */
  let { heading, children } = $props();

  const avatar = getPictureSources('avatar', 'jpg', 400);
</script>

<section class="profile-hero" aria-labelledby="person-title">
  <header class="hero-heading">{@render heading()}</header>
  <div class="hero-body">{@render children?.()}</div>
  <figure class="portrait-card profile-panel">
    <div class="portrait-topline" aria-hidden="true"><span>PROFILE / 01</span><span>[ DM ]</span></div>
    <div class="portrait-window">
      <picture>
        <source srcset={avatar.avifSrcset} sizes="(min-width: 1024px) 240px, (min-width: 640px) 108px, 90px" type="image/avif" />
        <source srcset={avatar.webpSrcset} sizes="(min-width: 1024px) 240px, (min-width: 640px) 108px, 90px" type="image/webp" />
        <img
          src={avatar.fallback}
          srcset={avatar.fallbackSrcset}
          sizes="(min-width: 1024px) 240px, (min-width: 640px) 108px, 90px"
          width={avatar.width}
          height={avatar.height}
          alt="Portrait of Dries Meerman"
          loading="eager"
          fetchpriority="high"
        />
      </picture>
    </div>
    <figcaption>Amsterdam · The Netherlands</figcaption>
  </figure>
</section>

<style>
  .profile-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 132px;
    gap: 1.25rem 1.5rem;
    align-items: start;
    padding: 2.5rem 0;
  }

  .hero-heading { grid-column: 1; grid-row: 1; min-width: 0; }
  .hero-body { grid-column: 1 / -1; grid-row: 2; min-width: 0; }
  .portrait-card { grid-column: 2; grid-row: 1; margin: 0; padding: .55rem; width: 100%; }
  .portrait-topline { display: none; }
  .portrait-window { padding: .25rem; border: 1px solid var(--profile-line); border-radius: .35rem; background: var(--profile-inset); box-shadow: inset 1px 1px 3px #00000019; }
  picture { display: block; }
  img { display: block; width: 100%; height: auto; aspect-ratio: 1; border-radius: .15rem; }

  figcaption {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }

  @media (min-width: 1024px) {
    .profile-hero { grid-template-columns: minmax(0, 1fr) 280px; gap: 1rem 2.5rem; padding: 3rem 0; }
    .hero-body { grid-column: 1; align-self: start; }
    .portrait-card { grid-row: 1 / span 2; align-self: center; padding: .85rem; }
    .portrait-window { padding: .45rem; }
    .portrait-topline { display: flex; justify-content: space-between; gap: .75rem; margin-bottom: .85rem; color: var(--profile-muted); font-family: var(--profile-meta-font); font-size: .58rem; line-height: 1.6; letter-spacing: .08em; }
    figcaption { position: static; width: auto; height: auto; overflow: visible; clip-path: none; margin-top: .85rem; color: var(--profile-muted); font-family: var(--profile-meta-font); font-size: .58rem; line-height: 1.6; letter-spacing: .05em; text-transform: uppercase; }
  }

  @media (max-width: 640px) {
    .profile-hero { grid-template-columns: minmax(0, 1fr) 110px; column-gap: 1rem; padding: 2rem 0; }
  }

  @media (max-width: 380px) {
    .profile-hero { grid-template-columns: minmax(0, 1fr) 96px; column-gap: .75rem; }
    .portrait-card { padding: .4rem; }
  }
</style>
