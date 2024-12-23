<script>
import Image from "svelte-image";
import Card from "../Card.svelte";

</script>

<Card class="">
    <div class="p-6 lg:ml-5 ml-2">
        <div class="p w-32 md:w-48 float-left mr-4">
            <Image class="rounded-full" src="assets/avatar.jpg" />
        </div>
        <slot></slot>
    </div>
</Card>
