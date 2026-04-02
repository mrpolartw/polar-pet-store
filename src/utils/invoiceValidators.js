/**
 * 台灣電子發票格式驗證工具
 */

/**
 * 手機條碼驗證
 * 格式：/ 開頭，後接 7 位大寫英文、數字、或 + - . 符號
 * 正確範例：/ABC+123、/0AB.DEF
 */
export function validateMobileBarcode(value) {
  if (!value) return '請輸入手機條碼'
  const clean = value.trim().toUpperCase()
  if (!/^\/[A-Z0-9+\-.]{7}$/.test(clean)) {
    return '手機條碼格式錯誤，應為 / 開頭接 7 位英數字（如 /ABC1234）'
  }
  return null
}

/**
 * 統一編號驗證（含檢查碼邏輯）
 * 台灣統編為 8 位數字，最後一碼為檢查碼
 */
export function validateTaxId(value) {
  if (!value) return '請輸入統一編號'
  const clean = value.trim()
  if (!/^\d{8}$/.test(clean)) return '統一編號必須為 8 位數字'

  const weights = [1, 2, 1, 2, 1, 2, 4, 1]
  let sum = 0
  for (let i = 0; i < 8; i++) {
    const product = Number(clean[i]) * weights[i]
    sum += Math.floor(product / 10) + (product % 10)
  }

  const isValid =
    sum % 10 === 0 ||
    (clean[6] === '7' && (sum + 1) % 10 === 0)

  if (!isValid) return '統一編號格式錯誤，請確認號碼是否正確'
  return null
}

/**
 * 愛心碼驗證（捐贈碼）
 * 格式：3～7 位數字
 */
export function validateDonateCode(value) {
  if (!value) return '請輸入捐贈碼'
  if (!/^\d{3,7}$/.test(value.trim())) {
    return '捐贈碼為 3～7 位數字'
  }
  return null
}
