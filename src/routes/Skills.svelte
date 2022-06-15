<script>
    import Card from "../components/Card.svelte";

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
                items: ['NodeJS',
                    // 'Angularjs',
                    'Vue.js',
                    'Svelte',
                    'Gulp'
                ]
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
            {name: 'Dart', items: ['Flutter']},
            {
                name: 'Java', items: [
                    'Junit',
                    'Spring',
                    'Android'
                ]
            },
            {name: 'Kotlin', items: []},
            {name: 'Haskell', items: []},
        ],
        "Technologies": ['Git', 'Docker', 'Linux', 'Windows', 'MacOS', 'UML', 'Azure DevOps', 'ServiceNow',
            'Gitlab CI/CD', 'Github Actions'].map(toNameItems),
        "Languages": ['Dutch (native)', 'English (fluent)'].map(toNameItems),
        "Processes": ['Scrum (PSM I)', 'DevOps'].map(toNameItems)
    }
</script>

<Card class="px-6 py-3">
    Shown below is an overview of skills I have consisting of programming languages, frameworks and technologies.
    Additionally the languages I speak and processes I've worked with.
    Some information has been omitted due to relevancy. <br>
    Overall I would describe my skill set as that of a Fullstack Engineer with DevOps knowledge.
</Card>

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