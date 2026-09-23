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
    },
  },
  plugins: [],
}
