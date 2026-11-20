/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  // Preflight (Tailwind's reset) is off so the existing styles.css is untouched.
  corePlugins: { preflight: false },
  theme: { extend: {} },
  plugins: [],
};
