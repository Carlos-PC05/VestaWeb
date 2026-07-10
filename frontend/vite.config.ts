import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // La SPA habla con el backend a través de este proxy (mismo origen, sin
    // CORS). En Docker el backend no está en localhost: se apunta con
    // VITE_API_PROXY (ver docker-compose.yml).
    proxy: {
      '/api': process.env.VITE_API_PROXY ?? 'http://localhost:3001',
    },
  },
})
