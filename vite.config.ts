import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  server: {
    host: true,            // allows LAN / Docker access
    port: 5173,
    strictPort: false,

    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    target: "esnext",
    sourcemap: false,      // set true if debugging production
    outDir: "dist",
    emptyOutDir: true,
  },
});
