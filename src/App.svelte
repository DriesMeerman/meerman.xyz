<script>
	import Menu from './components/Menu.svelte'
	import {darkMode} from "./state"
	import Person from './components/Person.svelte'


	darkMode.subscribe (enabled => document.documentElement.classList.toggle('dark', enabled));
		
</script>

<div >
	<Menu></Menu>
	<main class="p-6 dark:text-white">
		Content goes here {$darkMode} <br>
		<Person img="assets/dries.jpg">
			<div class="text-black">
				lorem ipsum eetos texten
			</div>
		</Person>
	</main>
</div>

<style>

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>