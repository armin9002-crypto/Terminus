/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "rgb(var(--line-rgb) / <alpha-value>)",
        background: "rgb(var(--canvas-rgb) / <alpha-value>)",
        card: "rgb(var(--surface-rgb) / <alpha-value>)",
        sidebar: "var(--bg-secondary)",
        accent: "rgb(var(--accent-rgb) / <alpha-value>)",
        success: "rgb(var(--positive-rgb) / <alpha-value>)",
        warning: "rgb(var(--caution-rgb) / <alpha-value>)",
        danger: "rgb(var(--negative-rgb) / <alpha-value>)",
        primaryText: "var(--text-primary)",
        mutedText: "var(--text-muted)",
        secondaryText: "var(--text-secondary)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        terminal: "none",
      },
    },
  },
  plugins: [],
};
