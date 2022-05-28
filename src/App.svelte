<script>
	import {darkMode} from "./state"
	import Menu from './components/Menu.svelte'
	import Person from './components/Person.svelte'
	import Particles from './components/Particles.svelte'

	darkMode.subscribe (enabled => document.documentElement.classList.toggle('dark', enabled));
</script>

<div class="flex flex-col h-full">
	<Menu></Menu>

	<div class="wrapper flex flex-col flex-grow items-center">
		<main class="p-6 w-full sm:w-2/3 dark:text-white">
			<Person img="assets/dries.jpg">
				<div class="max-w-3/4">
					I'm a software engineer interested in solving complex problems.
					Frameworks and programming languages and other techniques are tools not goals in themselves.
					When solving problems I like to be involved, I don't enjoy simply writing code that I'm told to.
					Outside of professional environments I've got interests in technology from gadgets to hardware and software.
					I also enjoy longboarding going to the gym and video games.
				</div>
			</Person>
		</main>

		<div class="particle-background">
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