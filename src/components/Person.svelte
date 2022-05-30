<script>
import Image from "svelte-image";
import Card from "./Card.svelte";

</script>

<Card class="flex-col lg:flex-row">
    <div class="sm:w-full img-max p-2">
        <Image class="rounded-full" src="assets/avatar.jpg" />
    </div>
    <div class="p-2 lg:ml-5 ml-2">
        <slot></slot>
    </div>
</Card>

<style>
    .img-max {
        max-width: 16rem;
    }
</style>