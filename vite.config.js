import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: './index.html'
      },
      output: {
        manualChunks: undefined,
        format: 'es'
      }
    }
  },
  server: {
    headers: {
      'Content-Type': 'application/javascript'
    }
  }
}) 