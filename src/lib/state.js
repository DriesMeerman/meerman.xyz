import { writable } from 'svelte/store';

function getDefaultDarkMode() {
  if (typeof window === 'undefined') return false;
  const storedTheme = localStorage.theme;
  if (storedTheme) return storedTheme === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export const darkMode = writable(getDefaultDarkMode());
export const particlesEnabled = writable(true);

export function toggleDarkMode() {
  darkMode.update((isDark) => {
    if (typeof window !== 'undefined') {
      localStorage.theme = isDark ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', !isDark);
    }
    return !isDark;
  });
}

export function toggleParticles() {
  particlesEnabled.update((b) => !b);
}


