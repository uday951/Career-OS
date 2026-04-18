/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#060810',
        surface: 'rgba(255,255,255,0.03)',
        surfaceHover: 'rgba(255,255,255,0.06)',
        border: 'rgba(255,255,255,0.08)',

        // Primary — electric violet
        primary: '#7C3AED',
        primaryHover: '#8B5CF6',
        primaryGlow: 'rgba(124,58,237,0.35)',

        // Accent — cyan
        accent: '#06B6D4',
        accentGlow: 'rgba(6,182,212,0.25)',

        // Semantic
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',

        textMain: '#F1F5F9',
        textMuted: '#64748B',
        textDim: '#334155',
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        'glow-violet': '0 0 40px rgba(124,58,237,0.25)',
        'glow-cyan': '0 0 40px rgba(6,182,212,0.2)',
        'glow-success': '0 0 30px rgba(16,185,129,0.2)',
        'card': '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)',
        'card-hover': '0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
        'modal': '0 25px 60px rgba(0,0,0,0.8)',
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
        glow: { '0%': { boxShadow: '0 0 20px rgba(124,58,237,0.1)' }, '100%': { boxShadow: '0 0 40px rgba(124,58,237,0.4)' } },
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
