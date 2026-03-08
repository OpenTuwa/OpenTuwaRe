module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // <--- This looks for classes inside your JSX files
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
        sans: ['Inter', 'sans-serif'],
        heading: ['Plus Jakarta Sans', 'sans-serif']
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms')
  ]
};
