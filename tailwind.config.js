/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        coral: {
          50: '#FDF5F3',
          100: '#FCE8E3',
          200: '#F9D3CA',
          300: '#F3B4A4',
          400: '#EA947D',
          500: '#E07A5F',
          600: '#CC6044',
          700: '#AB4B33',
        },
        surface: {
          bg: '#F4F7FB',
          card: '#FFFFFF',
        }
      },
      boxShadow: {
        'soft': '0 8px 30px rgb(0, 0, 0, 0.04)',
        'soft-lg': '0 14px 40px rgb(0, 0, 0, 0.06)',
        'soft-sm': '0 2px 12px rgb(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
}
