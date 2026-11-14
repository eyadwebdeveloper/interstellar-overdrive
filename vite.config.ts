import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The local AURA FastAPI backend. Override with AURA_API_TARGET when it runs elsewhere.
const apiTarget = process.env.AURA_API_TARGET ?? 'http://127.0.0.1:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
    },
  },
  preview: {
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
    },
  },
})
