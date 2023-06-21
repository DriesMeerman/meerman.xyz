<script>
	import Router, {location, link} from 'svelte-spa-router';
	import Particles from './components/Particles.svelte'
	import {darkMode, particlesEnabled} from "./state"
	import Menu from './components/Menu.svelte'
	import Home from './routes/Home.svelte'
	import Experience from "./routes/Experience.svelte";
	import Skills from './routes/SkillsPage.svelte'
	import Education from "./routes/Education.svelte";
	import BlogIndex from "./routes/blog/BlogIndex.svelte";
	import Article from "./routes/blog/Article.svelte";

	darkMode.subscribe (enabled => document.documentElement.classList.toggle('dark', enabled));
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
				'/blog/:slug': Article,
				'/blog': BlogIndex,
			}} />
		</main>

		<div class="particle-background max-h-screen" class:fade-in={$particlesEnabled} class:fade-out={!$particlesEnabled}>
			<Particles class="h-full border-1"></Particles>
		</div>
	</div>
</div>


<style lang="scss">
	$fade-in-seconds: 3s;
	$fade-out-seconds: 2s;

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

	.fade-in {
		animation: fadeIn $fade-in-seconds;
		-webkit-animation: fadeIn $fade-in-seconds;
		-moz-animation: fadeIn $fade-in-seconds;
		-o-animation: fadeIn $fade-in-seconds;
		-ms-animation: fadeIn $fade-in-seconds;
	}

	.fade-out {
		animation: fadeOut $fade-out-seconds;
		-webkit-animation: fadeOut $fade-out-seconds;
		-moz-animation: fadeOut $fade-out-seconds;
		-o-animation: fadeOut $fade-out-seconds;
		-ms-animation: fadeOut $fade-out-seconds;
		opacity: 0;
	}

	@keyframes fadeOut {
		0% { opacity: 1; }
		100% { opacity: 0; }
	}

	@-moz-keyframes fadeOut {
		0% { opacity: 1; }
		100% { opacity: 0; }
	}

	@-webkit-keyframes fadeOut {
		0% { opacity: 1; }
		100% { opacity: 0; }
	}

	@-o-keyframes fadeOut {
		0% { opacity: 1; }
		100% { opacity: 0; }
	}

	@-ms-keyframes fadeOut {
		0% { opacity: 1; }
		100% { opacity: 0; }
	}

	@keyframes fadeIn {
		0% { opacity: 0; }
		100% { opacity: 1; }
	}

	@-moz-keyframes fadeIn {
		0% { opacity: 0; }
		100% { opacity: 1; }
	}

	@-webkit-keyframes fadeIn {
		0% { opacity: 0; }
		100% { opacity: 1; }
	}

	@-o-keyframes fadeIn {
		0% { opacity: 0; }
		100% { opacity: 1; }
	}

	@-ms-keyframes fadeIn {
		0% { opacity: 0; }
		100% { opacity: 1; }
	}
</style>