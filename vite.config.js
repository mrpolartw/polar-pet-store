import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],  // ← 加這行！
  server: {
    proxy: {
      '/store': {
        target: 'http://localhost:9000',
        changeOrigin: true,
        rewrite: (path) => path  // 可選：保持路徑
      },
      '/admin': {  // ← 加 Admin proxy
        target: 'http://localhost:9000',
        changeOrigin: true
      },
      '/auth': {   // ← 加 Auth proxy
        target: 'http://localhost:9000',
        changeOrigin: true
      }
    }
  }
})