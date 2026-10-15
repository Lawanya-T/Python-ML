// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          50: "#f7f1e8",
          100: "#eadfce",
          200: "#d8c5aa",
          300: "#c5aa87",
          400: "#aa8863",
          500: "#8b6a49",
          600: "#765337",
          700: "#5d412c",
          800: "#443021",
          900: "#2b1d15",
        },
        clay: {
          50: "#fbf6ee",
          100: "#efe3d0",
          200: "#dfc9a8",
          300: "#ceb184",
          400: "#b99767",
          500: "#a17e52",
          600: "#816442",
          700: "#634c34",
        },
      },
    },
  },
  plugins: [],
};