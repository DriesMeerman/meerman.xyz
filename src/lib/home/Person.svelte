<script>
  import Card from '$lib/Card.svelte';
  import { getPictureSources } from '$lib/services/imageService.js';

  const avatar = getPictureSources('avatar', 'jpg', 400);
</script>

<Card class="">
  <div class="p-6 lg:ml-5 ml-2">
    <div class="p w-32 md:w-48 float-left mr-4">
      <picture>
        <source srcset={avatar.avifSrcset} sizes="(min-width: 768px) 12rem, 8rem" type="image/avif" />
        <source srcset={avatar.webpSrcset} sizes="(min-width: 768px) 12rem, 8rem" type="image/webp" />
        <img
          class="rounded-full"
          src={avatar.fallback}
          srcset={avatar.fallbackSrcset}
          sizes="(min-width: 768px) 12rem, 8rem"
          width={avatar.width}
          height={avatar.height}
          alt="Avatar"
          loading="lazy"
        />
      </picture>
    </div>
    <slot />
  </div>
</Card>
