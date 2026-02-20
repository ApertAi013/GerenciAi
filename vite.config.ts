import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    port: 3000,
    hmr: true,
    proxy: {
      '/api': {
        target: 'https://gerenciai-backend-798546007335.us-east1.run.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
