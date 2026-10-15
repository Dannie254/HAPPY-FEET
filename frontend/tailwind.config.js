/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7ee',
          100: '#fdedd6',
          200: '#fad8ad',
          300: '#f6bc78',
          400: '#f19943',
          500: '#ed7d1b',
          600: '#e05f0f',
          700: '#bc430d',
          800: '#963611',
          900: '#7a2f11',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}