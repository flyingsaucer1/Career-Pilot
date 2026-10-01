import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Legacy palette aliases keep existing feature pages consistent during migration.
        violet: colors.teal,
        stone: colors.slate,
        brand: { ...colors.teal, 600: '#087e74', 700: '#06685f' },
        surface: {
          ...colors.slate,
          750: '#293d4b',
          850: '#1a2f3c',
        },
      },
      backgroundImage: {
        'gradient-radial':   'radial-gradient(var(--tw-gradient-stops))',
        'brand-gradient':    'linear-gradient(135deg, #087e74, #164e63)',
        'surface-gradient':  'linear-gradient(180deg, var(--tw-gradient-stops))',
      },
      animation: {
        'fade-in':        'fadeIn 0.35s ease-out',
        'slide-up':       'slideUp 0.4s ease-out',
        'pulse-slow':     'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer':        'shimmer 1.8s linear infinite',
        'spin-slow':      'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn:   { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:  { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        shimmer:  { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      boxShadow: {
        'glow':           '0 0 20px rgba(8, 126, 116, 0.15)',
        'glow-md':        '0 0 35px rgba(8, 126, 116, 0.12)',
        'glow-lg':        '0 0 60px rgba(8, 126, 116, 0.10)',
        'card':           '0 1px 2px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.025)',
        'card-hover':     '0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.05)',
        'dark-card':      '0 1px 3px rgba(0,0,0,0.50), 0 0 0 1px rgba(255,255,255,0.04)',
        'dark-card-hover':'0 8px 30px rgba(0,0,0,0.60)',
        'inner-glow':     'inset 0 1px 0 rgba(255,255,255,0.08)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
