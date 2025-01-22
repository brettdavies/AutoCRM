/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'accent-primary': 'var(--accent-primary)',
        'accent-secondary': 'var(--accent-secondary)',
        'error': 'var(--error-color)',
        'success': 'var(--success-color)',
        'warning': 'var(--warning-color)',
      },
    },
  },
  plugins: [],
} 