import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const project = fileURLToPath(new URL(".", import.meta.url));

// Static entry point for GitHub Pages; shares the tested editor with Sites.
export default defineConfig({
  root: fileURLToPath(new URL("./static-app", import.meta.url)),
  base: "./",
  publicDir: fileURLToPath(new URL("./public", import.meta.url)),
  resolve: { alias: { "@": project } },
  plugins: [react()],
  build: {
    outDir: fileURLToPath(new URL("./dist-pages", import.meta.url)),
    emptyOutDir: true,
  },
  server: { host: "0.0.0.0", allowedHosts: ["terminal.local"] },
});
