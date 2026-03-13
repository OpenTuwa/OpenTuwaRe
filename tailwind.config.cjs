module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'tuwa-black': '#0a0a0b',
        'tuwa-gray': '#161618',
        'tuwa-text': '#e5e5e5',
        'tuwa-muted': '#a1a1aa',
        'tuwa-accent': '#3b82f6',
        'tuwa-gold': '#d4af37'
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        heading: ['var(--font-heading)', 'sans-serif']
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        }
      },
      animation: {
        shimmer: 'shimmer 2s infinite'
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms')
  ]
};
