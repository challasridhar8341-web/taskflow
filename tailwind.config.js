/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
      colors: {
        bg: '#0d0f14',
        surface: '#14171f',
        surface2: '#1c2030',
        border: 'rgba(255,255,255,0.06)',
        border2: 'rgba(255,255,255,0.1)',
        accent: '#6366f1',
        accent2: '#818cf8',
      },
    },
  },
  plugins: [],
}
