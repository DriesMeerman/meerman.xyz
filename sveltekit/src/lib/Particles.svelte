<script>
  import { darkMode } from '$lib/state';
  import { browser } from '$app/environment';
  import * as particleConfig from '../particle.config.json';
  let cssClass = $state();
  export { cssClass as class };
  $effect(() => {
    if (!browser) return;
    let unsub = null;
    (async () => {
      const mod = await import('particles.js');
      const config = { ...particleConfig };
      // eslint-disable-next-line no-new
      new mod.particlesJS('particles', config);
      unsub = darkMode.subscribe((enabled) => mod.setParticleColor(enabled ? '#01b3b5' : '#000'));
    })();
    return () => { if (unsub) unsub(); };
  });
</script>

<div id="particles" class={`w-full h-full select-none p-2 ${cssClass || ''}`}></div>


