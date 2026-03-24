/**
 * @fileoverview 前端表單驗證工具函式
 * @description
 *   所有驗證函式均為「前端格式驗證」，僅作為 UX 輔助。
 *   後端必須獨立實作完整驗證邏輯，前端驗證不可作為安全依據。
 *
 * @returns {string|null} null 表示驗證通過；string 為錯誤訊息
 */

/**
 * @description 驗證 Email 格式（前端 UX 用，不替代後端驗證）
 * @param {string} email
 * @returns {string|null}
 */
function validateEmail(email) {
  const normalized = String(email || '').trim()

  if (!normalized) {
    return 'Email 為必填'
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return 'Email 格式不正確'
  }

  return null
}

/**
 * @description 驗證台灣手機號碼格式（09 開頭，共 10 碼）
 * @param {string} phone
 * @returns {string|null}
 */
function validatePhone(phone) {
  const normalized = String(phone || '').replace(/[-\s]/g, '')

  if (!normalized) {
    return '手機號碼為必填'
  }

  if (!/^09\d{8}$/.test(normalized)) {
    return '手機號碼格式不正確（例：0912345678）'
  }

  return null
}

/**
 * @description 驗證密碼強度（前端 UX 用，不替代後端驗證）
 *   規則：長度 >= 8，含至少一個大寫英文字母，含至少一個數字
 * @param {string} password
 * @returns {string|null}
 */
function validatePassword(password) {
  const normalized = String(password || '')

  if (!normalized) {
    return '密碼為必填'
  }

  if (normalized.length < 8) {
    return '密碼至少需要 8 個字元'
  }

  if (!/[A-Z]/.test(normalized)) {
    return '密碼需包含至少一個大寫英文字母'
  }

  if (!/[0-9]/.test(normalized)) {
    return '密碼需包含至少一個數字'
  }

  return null
}

/**
 * @description 驗證確認密碼是否與密碼一致
 * @param {string} password
 * @param {string} confirmPassword
 * @returns {string|null}
 */
function validatePasswordConfirm(password, confirmPassword) {
  if (!String(confirmPassword || '').trim()) {
    return '請再次輸入密碼'
  }

  if (String(password || '') !== String(confirmPassword || '')) {
    return '兩次輸入的密碼不一致'
  }

  return null
}

/**
 * @description 驗證必填欄位
 * @param {string|number} value
 * @param {string} fieldName - 欄位中文名稱，用於錯誤訊息
 * @returns {string|null}
 */
function validateRequired(value, fieldName) {
  if (value === null || value === undefined) {
    return `${fieldName}為必填`
  }

  if (typeof value === 'string' && !value.trim()) {
    return `${fieldName}為必填`
  }

  return null
}

/**
 * @description 驗證姓名（2-20 字元，不允許特殊符號）
 * @param {string} name
 * @returns {string|null}
 */
function validateName(name) {
  const normalized = String(name || '').trim()

  if (!normalized) {
    return '姓名為必填'
  }

  if (normalized.length < 2) {
    return '姓名至少需要 2 個字元'
  }

  if (normalized.length > 20) {
    return '姓名不可超過 20 個字元'
  }

  return null
}

/**
 * @description 驗證統一編號格式（8 位數字）
 * @param {string} id
 * @returns {string|null}
 */
function validateTaxId(id) {
  const normalized = String(id || '').trim()

  if (!normalized) {
    return null
  }

  if (!/^\d{8}$/.test(normalized)) {
    return '統一編號格式不正確（需為 8 位數字）'
  }

  return null
}

/**
 * @description 驗證手機條碼格式（/XXXXXXX，共 8 碼）
 * @param {string} barcode
 * @returns {string|null}
 */
function validateMobileBarcode(barcode) {
  const normalized = String(barcode || '').trim().toUpperCase()

  if (!normalized) {
    return null
  }

  if (!/^\/[0-9A-Z.+\-]{7}$/.test(normalized)) {
    return '手機載具格式不正確（格式：/XXXXXXX）'
  }

  return null
}

/**
 * @description 信用卡卡號基本格式驗證（僅驗證長度與數字格式）
 * @description ⚠️ 此函式僅作基本 UX 驗證，Luhn 演算法驗證
 *   需搭配金流商 SDK 實作，請勿用本函式做安全判斷
 * @param {string} cardNumber - 移除空格與連字號後的卡號
 * @returns {string|null}
 */
function validateCardNumber(cardNumber) {
  const normalized = String(cardNumber || '').replace(/[\s-]/g, '')

  if (!normalized) {
    return '信用卡卡號為必填'
  }

  if (!/^\d{16}$/.test(normalized)) {
    // TODO: [PAYMENT] Luhn 演算法驗證需搭配金流商 SDK 實作
    return '信用卡卡號格式不正確（需為 16 位數字）'
  }

  return null
}

/**
 * @description 批次驗證工具，一次驗證多個欄位
 * @param {Array<{field: string, value: any, validator: Function, args?: any[]}>} rules
 * @returns {{ isValid: boolean, errors: Object }}
 *
 * 使用範例：
 *   const { isValid, errors } = validateForm([
 *     { field: 'email', value: email, validator: validateEmail },
 *     { field: 'phone', value: phone, validator: validatePhone },
 *     { field: 'name', value: name, validator: validateRequired, args: ['姓名'] },
 *   ]);
 */
function validateForm(rules) {
  const errors = {}

  rules.forEach(({ field, value, validator, args = [] }) => {
    const error = validator(value, ...args)
    if (error) errors[field] = error
  })

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export {
  validateEmail,
  validatePhone,
  validatePassword,
  validatePasswordConfirm,
  validateRequired,
  validateName,
  validateTaxId,
  validateMobileBarcode,
  validateCardNumber,
  validateForm,
}

export default {
  validateEmail,
  validatePhone,
  validatePassword,
  validatePasswordConfirm,
  validateRequired,
  validateName,
  validateTaxId,
  validateMobileBarcode,
  validateCardNumber,
  validateForm,
}
