<script>
	import {darkMode} from "./state"
	import Menu from './components/Menu.svelte'
	import Person from './components/Person.svelte'
	import Particles from './components/Particles.svelte'
	import Card from "./components/Card.svelte";

	darkMode.subscribe (enabled => document.documentElement.classList.toggle('dark', enabled));

	const toNameItems = label => {
		return {name: label, items: []}
	}

	let skills = {
		"Programming": [
			{
				name: 'Swift',
				items: ['SwiftUI / UIKit', 'Alamofire']
			},
			{name: 'HTML', items: []},
			{name: '(S)CSS', items: []},
			{
				name: 'Javascript',
				items: ['NodeJS', 'Angularjs', 'Vue.js', 'Svelte', 'Gulp']
			},
			{name: 'SQL', items: []},
			{
				name: 'Python',
				items: ['Scikit-learn',
					// 'pandas',
					'flask',
					// 'Jupyter-notebook'
				]
			},
			{name: 'Java', items: [
					'Junit',
						'Spring',
						'Android'
				]},
			{name: 'Kotlin', items: []},
			{name: 'Haskell', items: []},
		],
		"Technologies": ['Git', 'Docker', 'Linux', 'Windows', 'MacOS', 'UML', 'Azure DevOps', 'ServiceNow' ].map(toNameItems),
		"Languages": ['Dutch (native)', 'English (fluent)'].map(toNameItems),
		"Processes": ['Scrum (PSM I)', 'DevOps'].map(toNameItems)
	}
</script>

<div class="flex flex-col h-full">
	<Menu></Menu>

	<div class="wrapper flex flex-col flex-grow items-center">
		<main class="p-6 w-full sm:w-2/3 dark:text-white">
			<Person img="assets/dries.jpg" class="my-8">
				<div class="max-w-3/4 p-2">
					I'm a software engineer interested in solving complex problems.
					Frameworks and programming languages and other techniques are tools not goals in themselves.
					When solving problems I like to be involved, I don't enjoy simply writing code that I'm told to.
					Outside of professional environments I've got interests in technology from gadgets to hardware and software.
					I also enjoy longboarding, video games and going to the gym.
					Due to my wide interest I've got experience with quite a few technologies.
				</div>
			</Person>

			<Card class="my-8 grid grid-cols-1 md:grid-cols-2 px-6 pb-6 backdrop-blur-md">
				{#each Object.entries(skills) as [skill, content]}
					<div class="pt-3">
						<h2 class="text-xl leading-tight mb-2 font-thin">{skill}</h2>
						<ul class="list-inside list-disc">
							{#each content as {name, items}}
								<li>{name}</li>
								{#if items.length > 0}
								<ul class="list-inside list-[circle] ml-4">
									{#each items as child}
										<li>{child}</li>
									{/each}
								</ul>
								{/if}
							{/each}
						</ul>
					</div>
				{/each}
			</Card>
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