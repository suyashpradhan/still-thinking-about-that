/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ["'Instrument Serif'", 'Georgia', 'serif'],
        sans: ["'Satoshi'", 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  // The prototype's look is driven by CSS variables + keyframes in
  // src/styles/globals.css and per-component inline styles. Tailwind is kept
  // available for layout but deliberately not used to re-author the visuals.
  plugins: [],
};
