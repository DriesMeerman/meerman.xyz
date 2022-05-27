<script>

import Image from "svelte-image";

export let img;

</script>


<div class="rounded overflow-hidden shadow-lg bg-teal-50 dark:bg-zinc-500 bg-opacity-30 dark:bg-opacity-30 flex flex-row">
    <div class="w-32 lg:w-64 md:w-48  p-2">
        <Image class="rounded-full" src="{img}" />
    </div>
    <div class="p-2 lg:ml-5 ml-2">
        <slot></slot>
    </div>
</div>
