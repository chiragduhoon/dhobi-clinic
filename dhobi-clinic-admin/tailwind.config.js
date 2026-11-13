/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4fb', 100: '#dbe4f5', 600: '#2563eb', 800: '#1e3a8a', 900: '#172554',
        },
      },
    },
  },
  plugins: [],
};
