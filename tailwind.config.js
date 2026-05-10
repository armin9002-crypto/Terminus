/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "var(--border)",
        background: "var(--bg-primary)",
        card: "var(--bg-card)",
        sidebar: "var(--bg-secondary)",
        accent: "var(--accent)",
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        primaryText: "var(--text-primary)",
        mutedText: "var(--text-muted)",
        secondaryText: "var(--text-secondary)",
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
