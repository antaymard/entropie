import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  // Shadcn aliasing
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // PlateJS - Très gros éditeur, on le sépare
          if (id.includes("@platejs") || id.includes("platejs")) {
            return "plate-editor";
          }

          // React Flow - Canvas library
          if (id.includes("@xyflow")) {
            return "react-flow";
          }

          // PDF Libraries
          if (id.includes("react-pdf") || id.includes("pdf-lib")) {
            return "pdf-viewer";
          }

          // AI SDKs
          if (
            id.includes("@ai-sdk") ||
            id.includes("ai/") ||
            id.includes("@assistant-ui")
          ) {
            return "ai-sdk";
          }

          // React et React DOM
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "react-vendor";
          }

          // Autres grosses libraries
          if (id.includes("@tanstack")) {
            return "tanstack";
          }

          // Convex
          if (id.includes("convex")) {
            return "convex";
          }

          // Lodash et utilitaires
          if (id.includes("lodash")) {
            return "lodash";
          }

          // Node modules restants (vendors généraux)
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
    // Augmenter la limite pour éviter trop d'avertissements sur les chunks spécialisés
    chunkSizeWarningLimit: 1000,
  },
});
