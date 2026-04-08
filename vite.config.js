import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/polar-pet-store/', // 設定 GitHub Pages 的 Repository 名稱
  plugins: [react()],
})
