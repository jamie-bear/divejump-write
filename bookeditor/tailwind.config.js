/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        reedsy: ['"Palatino Linotype"', 'Palatino', 'Georgia', 'serif'],
        classic: ['"Times New Roman"', 'Times', 'serif'],
        romance: ['Garamond', '"EB Garamond"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
