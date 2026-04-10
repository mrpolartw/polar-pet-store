import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/polar-pet-store/',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Fine-grained manual chunk splitting for better long-term caching.
        // splitVendorChunkPlugin was removed in Vite 5; manualChunks is the
        // recommended replacement.
        manualChunks(id) {
          // React core — changes almost never, long cache lifetime
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'react-core'
          }
          // Router — stable, separate chunk
          if (
            id.includes('node_modules/react-router/') ||
            id.includes('node_modules/react-router-dom/')
          ) {
            return 'router'
          }
          // Lucide icons — large, rarely changes
          if (id.includes('node_modules/lucide-react/')) {
            return 'icons'
          }
        },
      },
    },
  },
})
