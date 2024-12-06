import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          mui: ['@mui/material', '@mui/icons-material']
        }
      }
    }
  },
  server: {
    port: 3000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@mui/material']
  }
})
