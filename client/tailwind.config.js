/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0a0e1a',
          secondary: '#111827',
          card: '#1a1f35',
          hover: '#232942'
        },
        accent: {
          cyan: '#22d3ee',
          purple: '#a855f7',
          pink: '#ec4899',
          blue: '#3b82f6'
        },
        border: {
          DEFAULT: '#2a3050'
        }
      }
    },
  },
  plugins: [],
}