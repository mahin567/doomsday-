import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, /api is forwarded to the Django server.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": process.env.API_URL || "http://localhost:8000",
    },
  },
});
