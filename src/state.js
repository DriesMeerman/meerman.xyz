import { writable } from 'svelte/store'


let defaultMode = localStorage.theme !== 'light'
const darkMode = writable(defaultMode)
console.log('intialized', defaultMode)

function toggleDarkMode() {
	darkMode.update(c => {
        localStorage.theme = c ? 'light' : 'dark'
        return c = !c;
    } );
}

export { darkMode, toggleDarkMode }