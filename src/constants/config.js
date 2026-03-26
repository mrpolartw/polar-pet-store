/**
 * 全站設定常數
 * 所有 magic number 集中於此，禁止在元件內硬編碼數值
 */
export const CONFIG = {
  /** 免運費門檻（NT$） */
  FREE_SHIPPING_THRESHOLD: 1500,

  /** 運費（NT$） */
  SHIPPING_FEE: 100,

  /** 購物車單一商品最大數量 */
  MAX_CART_QUANTITY: 10,

  /** 聯絡表單上傳檔案大小限制（bytes） */
  MAX_FILE_SIZE: 10 * 1024 * 1024,

  /** 聯絡表單最多上傳檔案數 */
  MAX_UPLOAD_FILES: 3,

  /** 會員頭像上傳大小限制（bytes） */
  MAX_AVATAR_SIZE: 5 * 1024 * 1024,

  /** 優惠碼最短長度 */
  PROMO_CODE_MIN_LENGTH: 4,

  /** 購物車 localStorage key */
  CART_STORAGE_KEY: 'polar_cart',

  /** Session localStorage key */
  SESSION_STORAGE_KEY: 'polar_session',

  /** Cookie 同意 localStorage key */
  COOKIE_CONSENT_KEY: 'polar_cookie_consent',
}
