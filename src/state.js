import { writable } from 'svelte/store'

let storedTheme = localStorage.theme
let defaultMode = storedTheme ? storedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;

const darkMode = writable(defaultMode)
const particlesEnabled = writable(true)

function toggleDarkMode() {
	darkMode.update(c => {
        localStorage.theme = c ? 'light' : 'dark'
        return c = !c;
    } );
}

function toggleParticles(){
    particlesEnabled.update(b => {
        return b = !b;
    })
}

export {
    darkMode,
    toggleDarkMode,
    particlesEnabled,
    toggleParticles
}