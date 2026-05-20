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
        sans: ['Poppins', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      colors: {
        bg:       '#eef2fb',
        surface:  '#ffffff',
        surface2: '#f0f4ff',
        border:   'rgba(26,58,140,0.10)',
        border2:  'rgba(26,58,140,0.15)',
        accent:   '#2575fc',
        accent2:  '#06d6a0',
      },
    },
  },
  plugins: [],
}
