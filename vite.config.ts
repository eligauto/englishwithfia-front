import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // En desarrollo, Vite reenvía estas rutas al backend evitando CORS.
      // En producción configurar CORS_ORIGINS en el .env del backend.
      '^/(auth|students|classes|charges|packs|dashboard|health|api)': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
