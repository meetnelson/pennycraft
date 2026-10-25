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
        background: '#F8F9FA',
        surface: {
          DEFAULT: '#FFFFFF',
          bg: '#F8F9FA',
          card: '#FFFFFF',
        },
        'text-main': '#2D3134',
        'text-muted': '#64748B',
        primary: {
          DEFAULT: '#2A8C82',
          hover: '#23736B',
        },
        'primary-hover': '#23736B',
        'accent-warm': '#E78358',
        'accent-amber': '#F4B266',
        'border-subtle': '#E2E8F0',
        secondary: '#E2E8F0',
        accent: '#E78358',
        coral: {
          50: '#FDF4EF',
          100: '#FAE5DA',
          200: '#F5CBB6',
          300: '#EFA987',
          400: '#E78358',
          500: '#E78358',
          600: '#C8643B',
          700: '#A64E2B',
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
