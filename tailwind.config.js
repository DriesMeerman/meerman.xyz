/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './src/app.html',
    './src/**/*.svelte',
    './src/**/*.js'
  ],
  theme: {
    extend: {
      spacing: {
        30: '7.5rem'
      },
      colors: {
        teal: {
          DEFAULT: '#14b8a6'
        }
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
};

