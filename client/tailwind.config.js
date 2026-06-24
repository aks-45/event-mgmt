/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#002147',
          light: '#003366',
          dark: '#001530',
        },
        gold: {
          DEFAULT: '#D4AF37',
          light: '#E8C547',
          dark: '#B8962E',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        serif: ['Georgia', 'Times New Roman', 'serif'],
      },
      boxShadow: {
        soft: '0 4px 24px -4px rgba(0, 33, 71, 0.08)',
        glow: '0 8px 32px -8px rgba(212, 175, 55, 0.35)',
        card: '0 1px 3px rgba(0,33,71,0.06), 0 12px 32px -12px rgba(0,33,71,0.12)',
        'card-hover': '0 8px 30px -8px rgba(0,33,71,0.18), 0 0 0 1px rgba(212,175,55,0.15)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh-light':
          'radial-gradient(at 40% 20%, rgba(212,175,55,0.12) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(0,33,71,0.08) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(212,175,55,0.08) 0px, transparent 50%)',
        'mesh-dark':
          'radial-gradient(at 40% 20%, rgba(212,175,55,0.08) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(0,51,102,0.4) 0px, transparent 50%)',
        'sidebar': 'linear-gradient(180deg, #002147 0%, #001530 55%, #001a3d 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.45s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.4s ease-out forwards',
        'scale-in': 'scaleIn 0.35s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.4s ease-out forwards',
        shimmer: 'shimmer 2s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
