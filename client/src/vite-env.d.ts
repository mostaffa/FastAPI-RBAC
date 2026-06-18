/// <reference types="vite/client" />

type ImportMetaEnv = {
  readonly VITE_API_URL: string
  readonly VITE_ANALYTICS_ID: string
  // Add any other env variables you define here...
}

type ImportMeta = {
  readonly env: ImportMetaEnv
}
