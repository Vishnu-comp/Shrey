/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        lime: { DEFAULT: '#d1fe17' },
        surface: { DEFAULT: '#0f1113', card: '#1c1e20' },
        muted: '#898a8b',
        gold: { 1: '#8E733A', 2: '#EAD9A3', 3: '#9F8754' },
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
