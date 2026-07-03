import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Evita CORS en desarrollo: el backend real vive en otro origen
    // (localhost:3001 fuera de Docker, http://backend:3001 dentro).
    proxy: {
      '/api': process.env.VITE_BACKEND_PROXY_TARGET ?? 'http://localhost:3001',
    },
  },
})
