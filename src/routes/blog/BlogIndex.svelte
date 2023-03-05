<script>
    import { onMount, onDestroy } from "svelte";
    import {particlesEnabled} from "../../state";

    onMount(() => particlesEnabled.set(false))
    onDestroy(() => particlesEnabled.set(true))
</script>

<div>
    Blog index
</div>