import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@P": path.resolve(__dirname, "./src/pages"),
      "@C": path.resolve(__dirname, "./src/components"),
      "@L": path.resolve(__dirname, "./src/layouts"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [react()],
});
