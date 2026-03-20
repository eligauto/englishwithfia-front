/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'fia-primary': '#3B82F6',
        'fia-secondary': '#F59E0B',
        'fia-neutral-dark': '#1E293B',
        'fia-neutral-light': '#F8FAFC',
        'fia-white': '#FFFFFF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

