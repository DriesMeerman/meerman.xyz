<script>
    import { getPictureSources } from '$lib/services/imageService.js';

    let cats = [
        {
            name: 'Henrietta',
            image: getPictureSources('cats/Fenry', 'jpeg', 400),
            description: 'Fenry a feral escape artist, gentle yet chaotic.'
        },
        {
            name: 'Gina',
            image: getPictureSources('cats/Gina', 'jpeg', 400),
            description: 'Juniper breeze, takes great care of her sister and is cuddles you when sick.'
        }
    ]
</script>

<div class="cats-page w-full">
    <h1 class="text-4xl md:text-5xl font-black text-center mb-12 text-neutral-800 dark:text-neutral-100 tracking-tight">
        Our "Coots"
    </h1>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-start justify-items-center">
        {#each cats as cat}
            <div class="group flex flex-col items-center">
                <div class="relative mb-6 transform transition-all duration-500 hover:scale-105">
                    <!-- Glow effect -->
                    <div class="absolute inset-0 bg-gradient-to-tr from-amber-200 to-rose-200 dark:from-amber-700 dark:to-rose-800 rounded-full blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-500"></div>

                    <!-- Circular image container -->
                    <div class="relative w-64 h-64 md:w-72 md:h-72 rounded-full overflow-hidden border-4 border-white dark:border-neutral-700 shadow-xl ring-1 ring-black/5 dark:ring-white/10">
                        <picture>
                            <source srcset={cat.image.avif} type="image/avif" />
                            <source srcset={cat.image.webp} type="image/webp" />
                            <img
                                src={cat.image.fallback}
                                alt={cat.name}
                                loading="lazy"
                                class="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                            />
                        </picture>
                    </div>
                </div>

                <h2 class="text-3xl font-bold text-neutral-800 dark:text-neutral-100 mb-2 relative inline-block">
                    {cat.name}
                    <span class="absolute -bottom-1 left-0 w-full h-1 bg-amber-300 dark:bg-amber-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                </h2>

                {#if cat.description}
                    <p class="text-neutral-500 dark:text-neutral-400 text-center max-w-xs font-medium leading-relaxed">
                        {cat.description}
                    </p>
                {/if}
            </div>
        {/each}
    </div>
</div>
