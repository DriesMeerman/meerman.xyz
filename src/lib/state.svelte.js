function getDefaultDarkMode() {
	if (typeof window === 'undefined') return false;
	const storedTheme = localStorage.theme;
	if (storedTheme) return storedTheme === 'dark';
	return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export const darkMode = $state({ current: getDefaultDarkMode() });
export const particlesEnabled = $state({ current: true });

export function toggleDarkMode() {
	darkMode.current = !darkMode.current;
	if (typeof window !== 'undefined') {
		localStorage.theme = darkMode.current ? 'dark' : 'light';
		document.documentElement.classList.toggle('dark', darkMode.current);
	}
}

export function toggleParticles() {
	particlesEnabled.current = !particlesEnabled.current;
}
