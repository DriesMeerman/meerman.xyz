const production = !process.env.ROLLUP_WATCH;
module.exports = {
  darkMode: 'class',
  future: {
    purgeLayersByDefault: true,
    removeDeprecatedGapUtilities: true,
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
  content: [
    "./static/*.html",
    "./src/App.svelte",
    "./src/**/*.svelte"
   ],
};