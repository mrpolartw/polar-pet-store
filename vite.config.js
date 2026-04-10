import { defineConfig, splitVendorChunkPlugin } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/polar-pet-store/',
  plugins: [
    react(),
    // Splits node_modules into a separate vendor chunk so the app chunk
    // stays small and the vendor chunk is aggressively cached by browsers.
    splitVendorChunkPlugin(),
  ],
  build: {
    // Raise the warning threshold slightly (default 500 kB) since React + Router
    // will comfortably sit around 150 kB gzipped with code splitting.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Fine-grained manual chunk splitting for better caching
        manualChunks(id) {
          // React core — changes almost never, long cache lifetime
          if (id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/scheduler')) {
            return 'react-core'
          }
          // Router — stable, separate chunk
          if (id.includes('node_modules/react-router') ||
              id.includes('node_modules/react-router-dom')) {
            return 'router'
          }
          // Lucide icons — large, rarely changes
          if (id.includes('node_modules/lucide-react')) {
            return 'icons'
          }
        },
      },
    },
  },
})
