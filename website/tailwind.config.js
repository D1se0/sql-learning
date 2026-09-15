/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0f1117',
        panel: '#151922',
        edge: '#2c2f3a',
        card: '#1c2230',
        accent: {
          DEFAULT: '#ff4b5c',
          soft: '#ff6f81',
          dark: '#c93343'
        },
        ink: '#e6e6e6',
        grey: '#9aa1b0'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace']
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0,0,0,0.5)',
        glow: '0 0 24px 0 rgba(255,75,92,0.4)',
        'glow-lg': '0 0 60px 0 rgba(255,75,92,0.25)'
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' }
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1200%)' }
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        pulseRing: {
          '0%': { transform: 'scale(0.85)', opacity: '0.6' },
          '100%': { transform: 'scale(1.9)', opacity: '0' }
        },
        gridDrift: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '48px 48px' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      },
      animation: {
        blink: 'blink 1.1s step-end infinite',
        scanline: 'scanline 9s linear infinite',
        floatSlow: 'floatSlow 6s ease-in-out infinite',
        pulseRing: 'pulseRing 2.6s ease-out infinite',
        'grid-drift': 'gridDrift 6s linear infinite',
        shimmer: 'shimmer 3.5s linear infinite'
      }
    }
  },
  plugins: []
}
