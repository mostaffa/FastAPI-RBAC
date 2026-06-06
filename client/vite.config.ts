import react from "@vitejs/plugin-react-swc"
import * as path from "node:path"
import { defineConfig } from "vitest/config"
import { visualizer } from "rollup-plugin-visualizer"
import packageJson from "./package.json" with { type: "json" }

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isAnalyze = mode === "analyze"

  return {
    plugins: [
      react(),
      isAnalyze &&
        visualizer({
          filename: "../backend/app/static/stats.html",
          template: "treemap",
          gzipSize: true,
          brotliSize: true,
          open: false,
        }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
      },
    },

    server: {
      open: false,
      port: 3000,
      host: "0.0.0.0",
      allowedHosts: ["nest.mostafaothman.com", "ubuntu26"],
      proxy: {
        "/api": {
          target: "http://localhost:4001",
          changeOrigin: true,
          secure: true,
        },
        "/ws": {
          target: "ws://localhost:4001",
          changeOrigin: true,
          secure: true,
          ws: true,
        },
      },
    },

    build: {
      target: "es2022",
      sourcemap: false,
      outDir: "../backend/app/static",
      emptyOutDir: true,
      cssMinify: "esbuild",
      cssCodeSplit: true,
      modulePreload: {
        polyfill: false,
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) {
              return undefined
            }

            if (
              id.includes("node_modules/@mui/icons-material")
            ) {
              return "vendor-mui-icons"
            }

            if (
              id.includes("node_modules/react") ||
              id.includes("node_modules/react-dom") ||
              id.includes("node_modules/react-router")
            ) {
              return "vendor-react"
            }

            if (
              id.includes("node_modules/@mui/x-data-grid") ||
              id.includes("node_modules/@mui/x-date-pickers")
            ) {
              return "vendor-mui-x"
            }

            if (id.includes("node_modules/@reduxjs") || id.includes("node_modules/react-redux")) {
              return "vendor-redux"
            }

            if (id.includes("node_modules/socket.io-client")) {
              return "vendor-socket"
            }

            return undefined
          },
        },
      },
      manifest: true,
      minify: "terser",
      reportCompressedSize: false,
      terserOptions: {
        compress: {
          drop_console: true,
          passes: 2,
        },
      },
      assetsInlineLimit: 0,
    },

    test: {
      root: import.meta.dirname,
      name: packageJson.name,
      environment: "jsdom",

      typecheck: {
        enabled: true,
        tsconfig: path.join(import.meta.dirname, "tsconfig.json"),
      },

      globals: true,
      watch: false,
      setupFiles: ["./src/setupTests.ts"],
    },
  }
})
