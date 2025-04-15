import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: './index.html'
      },
      output: {
        manualChunks: undefined
      }
    }
  },
  optimizeDeps: {
    include: ['three', 'howler']
  },
  server: {
    headers: {
      'Content-Type': 'application/javascript'
    }
  }
}) 