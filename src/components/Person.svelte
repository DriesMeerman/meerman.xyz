<script>

import Image from "svelte-image";

export let img;

</script>


<div class="rounded overflow-hidden shadow-lg dark:bg-zinc-500 flex flex-row">
    <div class="lg:w-64 w-48  p-2">
        <Image class="rounded-full" src="{img}" />
    </div>
    <div class="p-2 lg:ml-5 ml-2">
        <slot></slot>
    </div>
</div>
