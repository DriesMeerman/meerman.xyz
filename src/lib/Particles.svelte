<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { darkMode, particlesEnabled } from '$lib/state.svelte.js';
	import { attachWindowInteractions } from '$lib/particles/interactions';
	import { ParticleEngine, defaultEngineConfig } from '$lib/particles/engine';
	import { renderParticles } from '$lib/particles/renderer';

	let { cssClass = '' }: { cssClass?: string } = $props();

	let container: HTMLDivElement;
	let canvas: HTMLCanvasElement;
	let ready = $state(false);
	let color = $derived(darkMode.current ? '#01b3b5' : '#000');
	let enabled = $derived(particlesEnabled.current);

	onMount(() => {
		if (!browser || !container || !canvas) return;

		const context = canvas.getContext('2d');
		if (!context) return;

		const engine = new ParticleEngine();

		const resize = () => {
			const bounds = container.getBoundingClientRect();
			const width = Math.max(1, bounds.width);
			const height = Math.max(1, bounds.height);
			const pixelRatio = Math.min(window.devicePixelRatio || 1, defaultEngineConfig.maxPixelRatio);

			canvas.width = Math.round(width * pixelRatio);
			canvas.height = Math.round(height * pixelRatio);

			engine.resize(width, height, pixelRatio);
		};

		const resizeObserver = new ResizeObserver(resize);
		resizeObserver.observe(container);

		const detachInteractions = attachWindowInteractions(container, {
			onPointerMove: (position) => engine.setPointer(position),
			onPointerLeave: () => engine.clearPointer(),
			onPointerDown: (position) => {
				if (enabled) {
					engine.addParticlesAt(position);
				}
			}
		});

		let frameId = 0;
		let previousTime = performance.now();

		const tick = (time: number) => {
			const deltaSeconds = Math.min((time - previousTime) / 1000, 1 / 20);
			previousTime = time;

			if (enabled) {
				engine.update(deltaSeconds);
				const snapshot = engine.getSnapshot();
				renderParticles(context, snapshot, color, defaultEngineConfig);
				canvas.dataset.particleCount = String(snapshot.particles.length);
			} else {
				engine.clearPointer();
				canvas.dataset.particleCount = '0';
				context.setTransform(1, 0, 0, 1, 0, 0);
				context.clearRect(0, 0, canvas.width, canvas.height);
			}

			frameId = window.requestAnimationFrame(tick);
		};

		resize();
		ready = true;
		frameId = window.requestAnimationFrame(tick);

		return () => {
			ready = false;
			window.cancelAnimationFrame(frameId);
			detachInteractions();
			resizeObserver.disconnect();
		};
	});
</script>

<div bind:this={container} id="particles" class={`absolute inset-0 h-full w-full select-none ${cssClass}`}>
	<canvas
		bind:this={canvas}
		class="particles-canvas"
		data-engine="custom"
		data-ready={ready}
		aria-hidden="true"
	></canvas>
</div>

<style>
	#particles,
	canvas {
		display: block;
		height: 100%;
		width: 100%;
	}
</style>
