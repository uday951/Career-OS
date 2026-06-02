/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Premium Blue & White Theme
        background: '#FFFFFF',
        surface: '#F8FAFF',
        surfaceHover: '#F1F5FF',
        border: '#E0E9FF',

        // Primary — Premium Blue
        primary: '#0052CC',
        primaryHover: '#003DB3',
        primaryLight: '#E8F0FE',
        primaryGlow: 'rgba(0,82,204,0.15)',

        // Accent — Premium Orange
        accent: '#FF9900',
        accentHover: '#E68A00',
        accentLight: '#FFF4E6',
        accentGlow: 'rgba(255,153,0,0.15)',

        // Text Colors
        textMain: '#000000',
        textOrange: '#FF9900',
        textMuted: '#4B5563',
        textDim: '#6B7280',

        // Semantic
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        info: '#0052CC',
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        'glow-violet': '0 0 40px rgba(0,82,204,0.15)',
        'glow-cyan': '0 0 40px rgba(255,153,0,0.1)',
        'glow-success': '0 0 30px rgba(22,163,74,0.15)',
        'card': '0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.05)',
        'card-hover': '0 4px 20px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)',
        'modal': '0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease forwards',
        'fade-in': 'fadeIn 0.3s ease forwards',
        'pulse-slow': 'pulse 3s ease infinite',
        'shimmer': 'shimmer 1.5s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeUp: { '0%': { opacity: 0, transform: 'translateY(12px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        glow: { '0%': { boxShadow: '0 0 20px rgba(0,82,204,0.1)' }, '100%': { boxShadow: '0 0 40px rgba(0,82,204,0.4)' } },
      },
      borderRadius: {
        'xl2': '1.125rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
