/** @type {import('../registry.js').WidgetMeta} */
export const meta = {
  id: 'dice',
  title: 'Dice',
  description: 'Throw a holographic 3D die, optionally after locking in a guess.',
  size: { width: 560, height: 340 },
  options: [
    { key: 'die', label: 'Die', type: 'select', choices: ['d4', 'd6', 'd8', 'd10', 'd12', 'd16', 'd20', 'd100'], default: 'd20', hint: 'Starting die. The options panel can still change it.' },
    { key: 'sides', label: 'Custom sides', type: 'number', default: '', placeholder: '16', hint: 'Any side count from 2 to 999. Overrides the die choice.' },
    { key: 'guess', label: 'Guess mode', type: 'select', choices: ['off', 'on'], default: 'off', hint: 'Lock in a guess before each throw and see HIT or MISS.' },
    { key: 'panel', label: 'Options panel', type: 'select', choices: ['on', 'off'], default: 'on', hint: 'Hide the side panel for a bare die.' }
  ],
  load: () => import('./DiceWidget.svelte')
};
