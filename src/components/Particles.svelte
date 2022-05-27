<script>

    import { onMount } from 'svelte';

    import * as particleConfig from '../particle.config.json'
    import {particlesJS} from 'particles.js'

    let cssClass;
    export {cssClass as class};

    onMount(async () => {
        let config = {...particleConfig}
        new particlesJS('particles', config);
    })
</script>

<div id="particles" class="w-full h-full p-2 {cssClass || ''}"></div>