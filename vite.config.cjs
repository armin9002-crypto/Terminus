const path = require("node:path");
const react = require("@vitejs/plugin-react");
const { defineConfig } = require("vite");

module.exports = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
