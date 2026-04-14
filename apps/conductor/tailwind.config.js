/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        carbon: {
          50: '#f4f4f6', 100: '#e8e8ec', 200: '#c8c8d0', 300: '#9898a8',
          400: '#686878', 500: '#4a4a58', 600: '#2e2e3a', 700: '#1e1e28',
          800: '#141420', 900: '#0d0f14', 950: '#080a0e',
        },
        amber: {
          400: '#fbbf24', 500: '#f59e0b', 600: '#d97706',
        },
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
      borderRadius: { card: '14px' },
      minHeight: { touch: '44px' },
    },
  },
  plugins: [],
}
