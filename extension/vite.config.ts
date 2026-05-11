import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { copyFileSync, mkdirSync } from "fs";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "copy-manifest-and-background",
      closeBundle() {
        const dist = path.resolve(__dirname, "dist");
        mkdirSync(path.resolve(dist, "src/background"), { recursive: true });
        mkdirSync(path.resolve(dist, "public/icons"), { recursive: true });
        copyFileSync(
          path.resolve(__dirname, "manifest.json"),
          path.resolve(dist, "manifest.json"),
        );
        copyFileSync(
          path.resolve(__dirname, "src/background/service-worker.js"),
          path.resolve(dist, "src/background/service-worker.js"),
        );
        copyFileSync(
          path.resolve(__dirname, "public/icons/icon.svg"),
          path.resolve(dist, "public/icons/icon.svg"),
        );
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@convex/_generated": path.resolve(__dirname, "../convex/_generated"),
    },
  },
build: {
    outDir: "dist",
    emptyOutDir: true,
    copyPublicDir: false,
    rollupOptions: {
      input: {
        sidepanel: path.resolve(__dirname, "src/sidepanel/index.html"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});