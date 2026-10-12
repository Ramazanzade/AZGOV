/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
       bg: {
    primary: '#0b0d12',      // demək olar qara, mavi çaları yox
    secondary: '#12151c',
    card: '#161a23',         // neytral card
    hover: '#1e232e',
    elevated: '#1c212b',
  },
  accent: {
    primary: '#00d4aa',      // tək əsas rəng — turquoise (data.az tərz)
    cyan: '#00d4aa',
    purple: '#8b7fd9',       // secondary, az istifadə
    pink: '#e5484d',         // YALNIZ xəbərdarlıq/negative
    blue: '#5b8def',
    green: '#30a46c',
    amber: '#f5a524',
  },
  border: {
    DEFAULT: '#242a36',
    soft: '#1a1f28',
  },
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -5px rgba(34, 211, 238, 0.35)',
        'glow-purple': '0 0 20px -5px rgba(168, 85, 247, 0.35)',
        'glow-pink': '0 0 20px -5px rgba(236, 72, 153, 0.35)',
        'glow-blue': '0 0 20px -5px rgba(59, 130, 246, 0.35)',
        'card': '0 4px 20px -8px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'count-up': 'countUp 1s ease-out',
        'shimmer': 'shimmer 2s infinite linear',
        'pulse-soft': 'pulseSoft 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};