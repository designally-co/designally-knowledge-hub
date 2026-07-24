import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Branding Explained — bundled build (no CDN, real routing).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, open: true },
});
