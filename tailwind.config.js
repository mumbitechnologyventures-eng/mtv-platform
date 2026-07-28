/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Near-black canvas surfaces (SpaceX-grade minimal).
        ink: {
          900: '#000000',
          800: '#0a0a0a',
          700: '#141414',
          600: '#1f1f1f',
          500: '#2e2e2e',
        },
        // Accent token keeps the "clay" name so every component reskins
        // with zero markup changes. In the minimal system the accent IS
        // white — emphasis comes from contrast, not colour.
        clay: {
          DEFAULT: '#ffffff',
          light: '#ffffff',
          dark: '#d4d4d4',
        },
        // Kept for backwards-compat; now a single restrained cool signal
        // used only for tiny status markers, not fields of colour.
        neon: {
          violet: '#e5e5e5',
          blue: '#cfcfcf',
          cyan: '#ffffff',
        },
        // Neutral greyscale text ramp (no blue tint).
        sand: {
          100: '#ffffff',
          200: '#cfcfcf',
          400: '#8a8a8a',
          500: '#5a5a5a',
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
