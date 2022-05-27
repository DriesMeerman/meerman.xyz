import { writable } from 'svelte/store'

let storedTheme = localStorage.theme
let defaultMode = storedTheme ? storedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;

const darkMode = writable(defaultMode)

function toggleDarkMode() {
	darkMode.update(c => {
        localStorage.theme = c ? 'light' : 'dark'
        return c = !c;
    } );
}

export { darkMode, toggleDarkMode }