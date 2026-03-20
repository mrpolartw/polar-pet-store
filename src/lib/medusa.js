/**
 * Medusa JS SDK 實例
 * 所有透過官方 SDK 的 API 呼叫統一從此匯出
 */
import Medusa from "@medusajs/js-sdk"

export const sdk = new Medusa({
  baseUrl: import.meta.env.VITE_MEDUSA_BACKEND_URL || "http://localhost:9000",
  publishableKey: import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY,
  debug: import.meta.env.DEV,
  auth: {
    type: "jwt",
    jwtTokenStorageMethod: "local",
    jwtTokenStorageKey: "polar_token",
  },
})
