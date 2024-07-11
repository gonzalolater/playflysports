import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  server: {
    port: 4200
  },
  build: {
    rollupOptions: {
      output: {
        format: "iife"
      }
    }
  }
});
