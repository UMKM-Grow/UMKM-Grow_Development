/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-dark': '#2A3C4D',
        'brand-slate': '#5A768A',
        'brand-ice': '#A3C1D6',
        'brand-frost': 'rgba(255, 255, 255, 0.1)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Oswald', 'Anton', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

