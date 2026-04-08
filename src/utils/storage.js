import { CONFIG } from '../constants/config'

/**
 * 安全的 localStorage 包裝器
 * 所有操作包在 try/catch，storage 滿了不會 throw
 */
export const storage = {
  get(key, fallback = null) {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : fallback
    } catch {
      return fallback
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage 已滿，靜默失敗
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key)
    } catch {
      // 靜默失敗
    }
  },

  clear() {
    try {
      localStorage.clear()
    } catch {
      // 靜默失敗
    }
  },
}

/**
 * 購物車專用 storage 操作
 */
export const cartStorage = {
  getItems: () => storage.get(CONFIG.CART_STORAGE_KEY, []),
  setItems: (items) => storage.set(CONFIG.CART_STORAGE_KEY, items),
  clear: () => storage.remove(CONFIG.CART_STORAGE_KEY),
}
