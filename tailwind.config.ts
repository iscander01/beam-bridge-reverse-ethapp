import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['ProximaNova', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        bg: {
          900: '#041a2c',
          800: '#06233a',
          700: '#0d4d76'
        },
        beam: {
          pink: '#DA68F5',
          blue: '#0BCCF7',
          mint: '#00f6d2'
        }
      },
      boxShadow: {
        glowPink: '0 10px 24px rgba(218, 104, 245, 0.45)',
        glowBlue: '0 10px 24px rgba(11, 204, 247, 0.45)',
        panel: '0 24px 80px rgba(0,0,0,0.65)'
      },
      borderRadius: {
        pill: '999px'
      }
    }
  },
  plugins: [],
} satisfies Config;

