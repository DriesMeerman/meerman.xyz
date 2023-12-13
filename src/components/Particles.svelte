<script>

    import {darkMode} from "../state";

    import * as particleConfig from '../particle.config.json'
    import {particlesJS, setParticleColor} from 'particles.js'

    let cssClass;
    export {cssClass as class};

    setTimeout(() => {
        let config = {...particleConfig}
        new particlesJS('particles', config);

        darkMode.subscribe(enabled => setParticleColor(enabled ? '#01b3b5' : '#000'));
    })
</script>

<div id="particles" class="w-full h-full select-none p-2 {cssClass || ''}"></div>