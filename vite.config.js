import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/', // 改為根目錄，因為部署在 Cloud Run 根路徑
  plugins: [react()],
})
