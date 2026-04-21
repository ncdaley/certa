/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#fdfcf8',
          100: '#f9f6ef',
          200: '#f2ede0',
        },
        sage: {
          50: '#f4f7f4',
          100: '#e6ede6',
          200: '#c8d9c7',
          300: '#a3c0a1',
          400: '#78a376',
          500: '#5a8a58',
          600: '#477046',
          700: '#395a38',
        },
        blush: {
          50: '#fdf5f3',
          100: '#fae8e3',
          200: '#f5cfc6',
          300: '#ecada0',
          400: '#e08272',
          500: '#d06052',
        },
        warm: {
          50: '#faf8f5',
          100: '#f5f0e8',
          200: '#e8dfd0',
          300: '#d4c4a8',
          400: '#b8a07a',
          500: '#9a7f57',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
