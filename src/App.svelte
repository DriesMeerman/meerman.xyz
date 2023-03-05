<script>
	import Router, {location, link} from 'svelte-spa-router';
	import Particles from './components/Particles.svelte'
	import {darkMode, particlesEnabled} from "./state"
	import Menu from './components/Menu.svelte'
	import Home from './routes/Home.svelte'
	import Experience from "./routes/Experience.svelte";
	import Skills from './routes/Skills.svelte'
	import Education from "./routes/Education.svelte";
	import BlogIndex from "./routes/blog/BlogIndex.svelte";


	let showBackground = true;

	darkMode.subscribe (enabled => document.documentElement.classList.toggle('dark', enabled));
	particlesEnabled.subscribe( enabled => showBackground = enabled)

	// export let url = "";


</script>

<div class="flex flex-col h-full">
	<Menu></Menu>
	<div class="wrapper flex flex-col flex-grow items-center">
		<main class="p-6 pt-12 w-full sm:w-2/3 dark:text-white">
			<Router routes={{
				'/': Home,
				'/skills': Skills,
				'/experience': Experience,
				'/education': Education,
				'/blog': BlogIndex
			}} />
		</main>

		<div class="particle-background max-h-screen" class:hidden={!showBackground}>
			<Particles class="h-full border-1"></Particles>
		</div>
	</div>


</div>

<style lang="scss">

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}

	.wrapper {
		position: relative;

		main {
			position: relative;
			z-index: 1;
		}

		.particle-background {
			position: absolute;
			z-index: 0;
			top: 0;
			right: 0;
			bottom: 0;
			left: 0;
		}
	}


</style>