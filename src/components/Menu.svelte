<script>
    import {darkMode, toggleDarkMode} from "../state"

    let darkModeIconFill;
    let menuItems = [
        {link: "#/skills", text: "Skills"},
        {link: "#/experience", text: "Experience"},
        {link: "#/education", text: "Education"}
    ]

    darkMode.subscribe(enabled => {
        if (enabled) darkModeIconFill = "white"
        else darkModeIconFill = "black";
    })
</script>

<nav class="border-b-2 border-teal-500 dark:border-sky-600 dark:bg-zinc-700 flex items-center justify-between flex-wrap p-3 transition5">
    <div class="flex items-center flex-shrink-0 dark:text-white mr-6">
        <a href="/#/" class="font-semibold text-xl tracking-tight">Meerman</a>
    </div>

    <div class="w-full block flex-grow lg:flex lg:items-center lg:w-auto">
        <div class="text-sm lg:flex-grow">
            {#each menuItems as item}
                <a href="{item.link}"
                   class="block mt-4 lg:inline-block lg:mt-0 text-teal-900 dark:text-white dark:hover:text-sky-600 mr-4 hover:text-teal-600">
                    {item.text}
                </a>
            {/each}
        </div>
        <div>
            <div class="mt-4" on:click={toggleDarkMode} title={$darkMode ? 'Dark' : 'Light'}>
                <svg class="transition5" width="24px" height="24px" viewBox="0 0 24 24" fill="{darkModeIconFill}"
                     xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8V16Z"/>
                    <path fill-rule="evenodd" clip-rule="evenodd"
                          d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM12 4V8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16V20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4Z"/>
                </svg>
            </div>
        </div>
    </div>
</nav>

<style>
    .transition5 {
        transition: all 0.5s;
    }
</style>