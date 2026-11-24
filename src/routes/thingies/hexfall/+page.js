// Hexfall reads its seed and start level from the query string and draws with WebGL, so it renders
// in the browser only. `chrome: false` tells the root layout to leave out the menu and particles.
export const prerender = false;
export const ssr = false;

export const load = () => ({ chrome: false });
