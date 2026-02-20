/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        standard: ['Merriweather', 'Georgia', 'serif'],
        lato: ['Lato', 'sans-serif'],
        classic: ['"Times New Roman"', 'Times', 'serif'],
        romance: ['Garamond', '"EB Garamond"', 'Georgia', 'serif'],
      },
      colors: {
        dj: {
          maroon: '#341C23',
          teal: '#2E5747',
          prussian: '#3A6E82',
          red: '#DB7B86',
          mint: '#AFE0BE',
        },
      },
    },
  },
  plugins: [],
}
