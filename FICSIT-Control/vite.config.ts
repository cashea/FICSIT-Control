/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { spawn, type ChildProcess } from 'child_process'
import { resolve } from 'path'

/** Spawns scripts/teleport-server.js alongside the Vite dev server. */
function bridgeServer(): Plugin {
  let child: ChildProcess | null = null
  return {
    name: 'bridge-server',
    apply: 'serve',
    configureServer() {
      const script = resolve(__dirname, 'scripts/teleport-server.js')
      child = spawn('node', [script], { stdio: 'inherit' })
      child.on('error', (err) => console.warn(`[bridge] failed to start: ${err.message}`))
      child.on('exit', (code) => { if (code) console.warn(`[bridge] exited with code ${code}`) })
    },
    buildEnd() {
      if (child && !child.killed) { child.kill(); child = null }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), bridgeServer()],
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
