/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        soviet: {
          red: "#8B1A1A",
          "red-bright": "#C0392B",
          "red-light": "#E8534A",
          dark: "#1A1A1A",
          "dark-2": "#242424",
          "dark-3": "#2E2E2E",
          gray: "#3D3D3D",
          "gray-light": "#6B6B6B",
          beige: "#E8DCC8",
          "beige-dark": "#C8B89A",
          cream: "#F5F0E8",
        },
      },
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        body: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
