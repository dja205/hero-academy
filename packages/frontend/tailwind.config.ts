import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}', './index.html'],
  theme: {
    extend: {
      colors: {
        'hero-red': '#ef4444',
        'hero-blue': '#3b82f6',
        'hero-purple': '#8b5cf6',
        'hero-green': '#10b981',
        'hero-amber': '#f59e0b',
        'hero-yellow': '#facc15',
        'hero-pink': '#ec4899',
        'city-dark': '#0f172a',
        'city-darker': '#020617',
      },
      fontFamily: {
        hero: ['Bangers', 'cursive'],
        body: ['Inter', 'sans-serif'],
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(239,68,68,0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(239,68,68,0.8)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
