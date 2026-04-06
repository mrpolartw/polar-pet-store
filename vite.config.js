import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const rawWpOrigin = env.VITE_API_BASE_URL || env.VITE_WP_API_URL || env.VITE_WC_URL || 'http://localhost:8080'
  const wpOrigin = String(rawWpOrigin).replace(/\/wp-json\/?$/i, '')

  return {
    base: '/',
    plugins: [react()],
    server: {
      proxy: {
        '/wp-json': {
          target: wpOrigin,
          changeOrigin: true,
          secure: false,
        },
        '/wp-admin': {
          target: wpOrigin,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
