import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages sirve el repo bajo una subcarpeta, no en la raiz del dominio.
const BASE = "/primer-pedido-joyeria/";

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    // La camara (getUserMedia) exige contexto seguro: sin HTTPS el navegador
    // la bloquea al abrir la app por la IP de la LAN desde el movil.
    basicSsl(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-192.png", "icon-512.png"],
      manifest: {
        name: "Inventario Joyeria",
        short_name: "Inventario",
        description: "Catalogo de pedido con escaner y registro de ventas.",
        lang: "es",
        display: "standalone",
        orientation: "portrait",
        start_url: BASE,
        scope: BASE,
        theme_color: "#8a6a3b",
        background_color: "#faf7f2",
        // Relativos al manifest, que ya vive dentro de BASE: vite-plugin-pwa no
        // prefija la base en los iconos por su cuenta.
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // El patron por defecto NO incluye json/jpg/wasm, que es justo lo que
        // hace falta para el offline: los datos, las fotos y el lector de codigos.
        globPatterns: [
          "**/*.{js,css,html,ico,png,svg,json,jpg,jpeg,wasm,woff2}",
        ],
        // El wasm del lector y el bundle de ExcelJS pasan del limite de 2 MB.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: BASE + "index.html",
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        // Permite probar el service worker sin compilar.
        enabled: true,
        type: "module",
        // El dev server tambien sirve bajo BASE cuando hay base configurada.
        navigateFallback: BASE + "index.html",
      },
    }),
  ],
  // El bundle UMD de ExcelJS espera un objeto global al estilo Node.
  define: {
    global: "globalThis",
  },
  build: {
    // ExcelJS es grande; avisar a partir de 1.5 MB evita ruido en cada build.
    chunkSizeWarningLimit: 1500,
  },
});
