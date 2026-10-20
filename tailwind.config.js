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
        background: '#FAFBFA',
        surface: {
          DEFAULT: '#FFFFFF',
          bg: '#FAFBFA',
          card: '#FFFFFF',
        },
        primary: {
          DEFAULT: '#42685B',
          hover: '#36544a',
        },
        'primary-hover': '#36544a',
        secondary: '#B8C9BD',
        accent: '#E8A184',
        'text-main': '#303C36',
        'text-muted': '#63726A',
        'border-subtle': '#E8ECE9',
        coral: {
          50: '#FDF3F0',
          100: '#F9E3DC',
          200: '#F3C8B8',
          300: '#EDB39E',
          400: '#E8A184',
          500: '#E8A184',
          600: '#C66746',
          700: '#A65033',
        },
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
