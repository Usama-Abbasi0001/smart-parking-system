/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070F2B',
          900: '#0B192C',
          800: '#1B2430',
          700: '#1E3E62',
          600: '#2A4365',
        },
        royal: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#4F46E5',
          600: '#3730A3',
          700: '#2563EB',
          800: '#1D4ED8',
          900: '#1E40AF',
        },
        park: {
          available: '#10B981',
          occupied: '#EF4444',
          reserved: '#F59E0B',
          selected: '#3B82F6',
          maintenance: '#6B7280',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 10px 25px -3px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}
