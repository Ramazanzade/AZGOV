/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary:   'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          card:      'var(--bg-card)',
          hover:     'var(--bg-hover)',
          elevated:  'var(--bg-hover)',   // elevated üçün ayrı varsa onu yaz
        },
        accent: {
          cyan:   'var(--accent-cyan)',
          purple: 'var(--accent-purple)',
          pink:   'var(--accent-pink)',
          blue:   'var(--accent-blue)',
          green:  'var(--accent-green, #10b981)',  // yoxdursa fallback
        },
        border: {
          DEFAULT: 'var(--border)',
          soft:    'var(--border)',
        },
        // 🔑 ƏSAS: Tailwind gray-larını CSS dəyişənlərinə bağla
        // Bu, "text-gray-400", "text-gray-100" və s.-nin tema ilə dəyişməsini təmin edir
        gray: {
          50:  'var(--text-primary)',
          100: 'var(--text-primary)',
          200: 'var(--text-primary)',
          300: 'var(--text-secondary)',
          400: 'var(--text-secondary)',
          500: 'var(--text-muted)',
          600: 'var(--text-muted)',
          700: 'var(--text-muted)',
          800: 'var(--bg-hover)',
          900: 'var(--bg-card)',
        },
      },
      boxShadow: {
        'glow-cyan':   '0 0 20px -5px rgba(34, 211, 238, 0.35)',
        'glow-purple': '0 0 20px -5px rgba(168, 85, 247, 0.35)',
        'glow-pink':   '0 0 20px -5px rgba(236, 72, 153, 0.35)',
        'glow-blue':   '0 0 20px -5px rgba(59, 130, 246, 0.35)',
        'card':        '0 4px 20px -8px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'fade-in':   'fadeIn 0.4s ease-out',
        'slide-up':  'slideUp 0.4s ease-out',
        'shimmer':   'shimmer 2s infinite linear',
        'pulse-soft':'pulseSoft 2s infinite',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:   { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        shimmer:   { '0%': { backgroundPosition: '-1000px 0' }, '100%': { backgroundPosition: '1000px 0' } },
        pulseSoft: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
      },
    },
  },
  plugins: [],
};