<script>
  import { getPictureSourcesFromUrl } from '$lib/services/imageService.js';
  /** @typedef {'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'} Rarity */

  /** @type {{ image: string; alt?: string; backText?: string; rarity?: Rarity; children?: import('svelte').Snippet }} */
  let { image, alt = 'an image', backText = '', rarity = 'common', children } = $props();
  let showBackSide = $state(false);
  let hideOverflow = $state(true);
  $effect(() => {
    if (showBackSide) hideOverflow = false;
    else setTimeout(() => (hideOverflow = true), 600);
  });
  const colors = {
    purple: 'from-purple-500/25 to-pink-500/25',
    green: 'from-green-500/25 to-blue-500/25',
    yellow: 'from-yellow-500/25 to-red-500/25',
    pink: 'from-pink-500/25 to-purple-500/25',
    blue: 'from-cyan-500/25 to-blue-500/25',
    red: 'from-amber-500/25 to-red-500/25',
    gray: 'from-gray-500/25 to-pink-300/25'
  };
  /** @type {Record<Rarity, string>} */
  const colorRarity = { common: colors.gray, uncommon: colors.green, rare: colors.blue, epic: colors.purple, legendary: colors.red };
  const fallbackRarity = colorRarity.common;
  let activeRarityClass = $derived(colorRarity[rarity] ?? fallbackRarity);
  let hasShine = $derived(rarity === 'epic' || rarity === 'legendary');
  let pictureSources = $derived(getPictureSourcesFromUrl(image));

  /** @param {KeyboardEvent} event */
  function cardKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') { showBackSide = !showBackSide; event.preventDefault(); }
  }
</script>

<div class={`skill-card flex flex-col h-48 w-30 md:h-64 md:w-40 border-solid border-teal rounded-lg bg-gradient-to-r ${showBackSide ? 'show-back-side' : ''} ${hideOverflow ? 'overflow-hidden' : ''} ${activeRarityClass}`}
     role="button" tabindex="0" onclick={() => (showBackSide = !showBackSide)} onkeydown={cardKeydown}>
  <div class={`${hasShine && hideOverflow ? 'shine' : ''} overflow-visible`}></div>
  <div class="front h-full w-full">
    <div class="card-image w-32 h-20 md:w-36 md:h-28 border-solid border-2 border-white/10 mx-3 mt-2 self-center p-4 rounded-lg">
      {#if pictureSources}
        <picture>
          <source srcset={pictureSources.avif} type="image/avif" />
          <source srcset={pictureSources.webp} type="image/webp" />
          <img {alt} class="image object-contain h-full w-full aspect-square" src={pictureSources.fallback} loading="lazy" />
        </picture>
      {:else}
        <img {alt} class="image object-contain h-full w-full aspect-square" src={image} loading="lazy" />
      {/if}
    </div>
    <div class="p-3 h-full">{@render children?.()}</div>
  </div>
  <div class="back card-body-text h-full w-full flex flex-col p-4 mt-auto">{backText}</div>
</div>

<style>
  .show-back-side .shine { display: none; }
  :global(.dark .shine) { background: -webkit-linear-gradient(top, transparent, rgba(200,200,200,.1), transparent) !important; }
  .shine { width: 1000px; height: 100px; margin-left: -100px; transform: rotate(30deg); background: -webkit-linear-gradient(top, transparent, rgba(231,229,228,.375), transparent); position: absolute; animation: shine 6s ease-in-out 8; }
  @keyframes shine { 0%,100% { margin-top: -100px; } 50% { margin-top: 800px; } }
  .show-back-side { transition: all ease .8s; transform: rotateY(180deg); }
  .skill-card { position: relative; transform-style: preserve-3d; transition: transform .6s; perspective: 1000px; }
  .skill-card .back { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; transform: rotateY(180deg); }
  .skill-card .front { transform: rotateY(0deg); backface-visibility: hidden; display: flex; flex-direction: column; }
  .card-body-text { font-size: 10px; font-family: monospace, Courier; }
  .card-image { box-shadow: inset 1px 1px 2px 1px #0000004f; background: #e5edf473; }
  :global(.dark .card-image) { box-shadow: inset 1px 1px 2px 1px #0000004f; background: #77889973 !important; }
  .skill-card { transition: all ease .8s; box-shadow: 1px 1px 3px 0px rgb(23 76 76 / 70%); }
  .skill-card:hover { transition: all ease .8s; box-shadow: 0px 1px 2px 0px rgba(0,255,255,.7), 1px 2px 4px 0px rgba(0,255,255,.7), 2px 4px 12px 0px rgba(0,255,255,.7); cursor: pointer; }
</style>
