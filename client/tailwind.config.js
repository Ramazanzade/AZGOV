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
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          card: 'var(--bg-card)',
          hover: 'var(--bg-hover)'
        },
        accent: {
          cyan: 'var(--accent-cyan)',
          purple: 'var(--accent-purple)',
          pink: 'var(--accent-pink)',
          blue: 'var(--accent-blue)'
        },
        border: {
          DEFAULT: 'var(--border)'
        }
      }
    },
  },
  plugins: [],
}