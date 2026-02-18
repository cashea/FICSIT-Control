/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __ANTHROPIC_ENV_KEY__: JSON.stringify(!!process.env.ANTHROPIC_API_KEY),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "vendor-react";
          }
          if (id.includes("node_modules/@xyflow/")) {
            return "vendor-xyflow";
          }
          if (id.includes("node_modules/@dagrejs/") || id.includes("node_modules/dagre")) {
            return "vendor-dagre";
          }
          if (id.includes("node_modules/@nivo/")) {
            return "vendor-nivo";
          }
          if (id.includes("node_modules/d3-") || id.includes("node_modules/d3/")) {
            return "vendor-d3";
          }
          if (id.includes("/src/data/")) {
            return "game-data";
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "node",
  },
  server: {
    proxy: {
      "/api/anthropic": {
        target: "https://api.anthropic.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/anthropic/, ""),
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            const envKey = process.env.ANTHROPIC_API_KEY;
            if (envKey) {
              proxyReq.setHeader("x-api-key", envKey);
            }
          });
        },
      },
    },
  },
})
