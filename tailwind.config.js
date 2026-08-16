/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // All palette tokens resolve to CSS variables so a single [data-theme]
        // switch reskins the whole app (dark <-> light) with zero markup changes.
        ink: {
          900: 'rgb(var(--ink-900) / <alpha-value>)',
          800: 'rgb(var(--ink-800) / <alpha-value>)',
          700: 'rgb(var(--ink-700) / <alpha-value>)',
          600: 'rgb(var(--ink-600) / <alpha-value>)',
          500: 'rgb(var(--ink-500) / <alpha-value>)',
        },
        clay: {
          DEFAULT: 'rgb(var(--clay) / <alpha-value>)',
          light: 'rgb(var(--clay-light) / <alpha-value>)',
          dark: 'rgb(var(--clay-dark) / <alpha-value>)',
        },
        neon: {
          violet: '#e5e5e5',
          blue: '#cfcfcf',
          cyan: '#ffffff',
        },
        sand: {
          100: 'rgb(var(--sand-100) / <alpha-value>)',
          200: 'rgb(var(--sand-200) / <alpha-value>)',
          400: 'rgb(var(--sand-400) / <alpha-value>)',
          500: 'rgb(var(--sand-500) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        // Functional hairline only — no neon glow.
        glow: '0 0 0 1px rgba(255,255,255,0.10)',
        'glow-violet': '0 0 0 1px rgba(255,255,255,0.10)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both',
      },
    },
  },
  plugins: [],
}
