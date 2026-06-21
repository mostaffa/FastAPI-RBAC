import react from "@vitejs/plugin-react"
import browserslist from "browserslist"
import { browserslistToTargets } from "lightningcss"
import * as path from "node:path"
import nodeZlib from "node:zlib"
import { visualizer } from "rollup-plugin-visualizer"
import { compression, defineAlgorithm } from "vite-plugin-compression2"
import { defineConfig } from "vitest/config"
import packageJson from "./package.json" with { type: "json" }

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isAnalyze = mode === "analyze"
  return {
    plugins: [
      react({
        jsxImportSource: "@emotion/react",
      }),
      isAnalyze &&
        visualizer({
          filename: "../backend/app/static/stats.html",
          template: "treemap",
          gzipSize: true,
          brotliSize: true,
          open: false,
        }),
      compression({
        algorithms: [
          defineAlgorithm("gzip", { level: 9 }), // Wide browser support (all browsers)
          defineAlgorithm("brotliCompress", {
            // Better compression (modern browsers)
            params: {
              [nodeZlib.constants.BROTLI_PARAM_QUALITY]: 11,
            },
          }),
        ],
      }),
    ],
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
          target: "http://localhost:4000",
          changeOrigin: true,
          secure: true,
        },
        "/ws": {
          target: "http://localhost:4000",
          changeOrigin: true,
          secure: true,
          ws: true,
        },
      },
    },
    css: {
      transformer: "lightningcss",
      lightningcss: {
        targets: browserslistToTargets(browserslist(">= 0.25%")),
      },
    },
    build: {
      target: "es2022",
      sourcemap: false,
      outDir: "../backend/app/static",
      emptyOutDir: true,
      cssMinify: "lightningcss",
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

            if (id.includes("node_modules/@mui/icons-material")) {
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

            if (
              id.includes("node_modules/@reduxjs") ||
              id.includes("node_modules/react-redux")
            ) {
              return "vendor-redux"
            }

            if (id.includes("node_modules/socket.io-client")) {
              return "vendor-socket"
            }

            return undefined
          },
        },
      },
      cssTarget: "es2022",
      manifest: true,
      minify: "esbuild",
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      reportCompressedSize: false,
      assetsInlineLimit: 4096,
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
