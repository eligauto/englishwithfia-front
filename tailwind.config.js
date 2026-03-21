/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'fia-primary': '#556B4A',
        'fia-primary-dark': '#3E5034',
        'fia-primary-light': '#EEF2EC',
        'fia-secondary': '#C4A87A',
        'fia-neutral-dark': '#2C382A',
        'fia-neutral-light': '#F5F3EE',
        'fia-white': '#FFFFFF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

