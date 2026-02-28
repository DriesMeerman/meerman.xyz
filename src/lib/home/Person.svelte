<script>
  import Card from '$lib/Card.svelte';
  import { getPictureSources } from '$lib/services/imageService.js';

  const avatar = getPictureSources('avatar', 'jpg', 400);
</script>

<Card class="">
  <div class="p-6 lg:ml-5 ml-2">
    <div class="p w-32 md:w-48 float-left mr-4">
      <picture>
        <source srcset={avatar.avif} type="image/avif" />
        <source srcset={avatar.webp} type="image/webp" />
        <img class="rounded-full" src={avatar.fallback} alt="Avatar" loading="lazy" />
      </picture>
    </div>
    <slot />
  </div>
</Card>

