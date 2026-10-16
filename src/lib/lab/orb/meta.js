/** @type {import('../registry.js').WidgetMeta} */
export const meta = {
  id: 'orb',
  title: 'Orb',
  description: 'A sphere of tens of thousands of glowing particles that flow into wispy filaments around a hot core, with orbiting lattice rings. Drag to rotate, hover to stir.',
  size: { width: 480, height: 480 },
  options: [
    { key: 'palette', label: 'Palette', type: 'select', choices: ['cyan', 'emerald', 'crimson', 'violet', 'mono'], default: 'cyan', hint: 'Shell colour; the core always contrasts.' },
    { key: 'density', label: 'Density', type: 'select', choices: ['low', 'medium', 'high'], default: 'medium', hint: 'Particle count. Low is kind to older laptops.' },
    { key: 'spin', label: 'Spin', type: 'number', default: '1', placeholder: '1', hint: 'Rotation speed multiplier. 0 holds still, 3 is fast.' },
    { key: 'link', label: 'Window link', type: 'select', choices: ['on', 'off'], default: 'off', hint: 'Open several linked orbs in separate windows and they find each other across the screen.' }
  ],
  load: () => import('./OrbWidget.svelte')
};
