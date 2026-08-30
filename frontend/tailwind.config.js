/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          500: '#7c3aed',
          600: '#7c3aed', // Purple brand color from mockup
          700: '#6d28d9',
          900: '#4c1d95',
        }
      }
    },
  },
  plugins: [],
}
