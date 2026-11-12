/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './js/**/*.{js,mjs}',
  ],
  safelist: [
    'bg-brutal-yellow',
    'bg-brutal-pink',
    'bg-brutal-purple',
    'bg-brutal-cyan',
    'bg-brutal-green',
    'bg-brutal-orange',
    'bg-brutal-bg',
    'bg-brutal-black',
    'text-brutal-yellow',
    'text-brutal-pink',
    'text-brutal-purple',
    'text-brutal-cyan',
    'text-brutal-green',
    'text-brutal-orange',
    'shadow-brutal-sm',
    'shadow-brutal',
    'shadow-brutal-lg',
    'shadow-brutal-xl',
    'border-3',
    'border-4',
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Plus Jakarta Sans', 'sans-serif'],
        sans: ['Lexend', 'sans-serif'],
      },
      colors: {
        'brutal-yellow': '#FACC15',
        'brutal-pink': '#F472B6',
        'brutal-purple': '#A855F7',
        'brutal-cyan': '#38BDF8',
        'brutal-green': '#4ADE80',
        'brutal-orange': '#FB923C',
        'brutal-bg': '#FEFCE8',
        'brutal-black': '#000000',
      },
      boxShadow: {
        'brutal-sm': '3px 3px 0px 0px #000000',
        'brutal': '5px 5px 0px 0px #000000',
        'brutal-lg': '8px 8px 0px 0px #000000',
        'brutal-xl': '12px 12px 0px 0px #000000',
      },
      borderWidth: {
        '3': '3px',
        '4': '4px',
      },
    },
  },
  plugins: [],
};
