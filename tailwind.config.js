/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0f1117",
        sidebar: "#161b27",
        card: "#1a2035",
        border: "#2d3748",
        accent: "#14b8a6",
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
        primaryText: "#f1f5f9",
        mutedText: "#94a3b8",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        terminal: "0 24px 70px rgba(0, 0, 0, 0.35)",
      },
    },
  },
  plugins: [],
};
