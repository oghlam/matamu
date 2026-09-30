/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // App background
        app: '#9FC2C5',
        // Surfaces
        surface: '#F8F8F3',
        'surface-2': '#F1F2ED',
        // Text
        'text-primary': '#111311',
        'text-secondary': '#686C68',
        'text-muted': '#949893',
        // Accent
        accent: '#F4A900',
        dark: '#050605',
        // Semantic
        success: '#67B57A',
        warning: '#E8A629',
        danger: '#D96868',
        // Border color (named 'line' to avoid conflict with Tailwind border utility)
        line: 'rgba(20, 25, 22, 0.08)',
      },
      fontFamily: {
        sans: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        shell: '28px',
      },
      boxShadow: {
        card: '0 8px 30px rgba(0,0,0,.06)',
        float: '0 16px 40px rgba(0,0,0,.10)',
      },
      transitionTimingFunction: {
        spatial: 'cubic-bezier(.2,.8,.2,1)',
      },
      animation: {
        'pulse-gps': 'pulse-gps 1.5s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        'pulse-gps': {
          '0%, 100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
          '50%': {
            opacity: '0.8',
            transform: 'scale(1.2)',
          },
        },
        'glow-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 8px rgba(34, 197, 94, 0.6), 0 0 16px rgba(34, 197, 94, 0.4)',
          },
          '50%': {
            boxShadow: '0 0 16px rgba(34, 197, 94, 0.9), 0 0 24px rgba(34, 197, 94, 0.6), 0 0 32px rgba(34, 197, 94, 0.3)',
          },
        },
      },
    },
  },
  plugins: [],
}
