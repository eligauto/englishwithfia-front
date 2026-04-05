/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'app-primary': '#556B4A',
        'app-primary-dark': '#3E5034',
        'app-primary-light': '#EEF2EC',
        'app-secondary': '#C4A87A',
        'app-neutral-dark': '#2C382A',
        'app-neutral-light': '#F5F3EE',
        'app-white': '#FFFFFF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

