/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __ANTHROPIC_ENV_KEY__: JSON.stringify(!!process.env.ANTHROPIC_API_KEY),
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
