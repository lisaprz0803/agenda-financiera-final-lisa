import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/agenda-financiera-final-lisa/",
  plugins: [react()],
  build: {
    outDir: "docs",
    emptyOutDir: true
  }
});
