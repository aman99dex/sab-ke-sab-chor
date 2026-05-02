import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
    proxy: {
      '/graphql': 'http://localhost:8000',
      '/uploads': 'http://localhost:8000',
      '/upload': 'http://localhost:8000',
      '/api': 'http://localhost:8000',
    },
  },
})
