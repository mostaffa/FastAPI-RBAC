import react from "@vitejs/plugin-react"
import * as path from "node:path"
import { defineConfig } from "vitest/config"
import packageJson from "./package.json" with { type: "json" }

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
        manualChunks: {
          react: ["react", "react-dom", "react-router"],
          mui: ["@mui/material", "@mui/icons-material", "@mui/system"],
          redux: ["react-redux", "@reduxjs/toolkit"],
        },
      },
    },
    manifest: true,
    minify: "terser",
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
})
