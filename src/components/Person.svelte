<script>
import Image from "svelte-image";
</script>


<div class="rounded shadow-lg bg-stone-200 dark:bg-zinc-500 bg-opacity-30 dark:bg-opacity-30 flex flex-col sm:flex-row">
    <div class="sm:w-full img-max p-2">
        <Image class="rounded-full" src="assets/avatar.jpg" />
    </div>
    <div class="p-2 lg:ml-5 ml-2">
        <slot></slot>
    </div>
</div>

<style>
    .img-max {
        max-width: 16rem;
    }
</style>