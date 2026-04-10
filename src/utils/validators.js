function validateEmail(email) {
  const normalized = String(email || "").trim()

  if (!normalized) {
    return "請輸入 Email"
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return "Email 格式不正確"
  }

  return null
}

function validatePhone(phone) {
  const normalized = String(phone || "").replace(/[-\s]/g, "")

  if (!normalized) {
    return "請輸入手機號碼"
  }

  if (!/^09\d{8}$/.test(normalized)) {
    return "手機號碼格式不正確，請輸入 09 開頭的 10 碼數字"
  }

  return null
}

function validatePassword(password) {
  const normalized = String(password || "")

  if (!normalized) {
    return "請輸入密碼"
  }

  if (normalized.length < 8) {
    return "密碼至少需要 8 碼"
  }

  if (!/[A-Z]/.test(normalized)) {
    return "密碼至少需要 1 個大寫英文字母"
  }

  if (!/[0-9]/.test(normalized)) {
    return "密碼至少需要 1 個數字"
  }

  return null
}

function validatePasswordConfirm(password, confirmPassword) {
  if (!String(confirmPassword || "").trim()) {
    return "請再次輸入密碼"
  }

  if (String(password || "") !== String(confirmPassword || "")) {
    return "兩次輸入的密碼不一致"
  }

  return null
}

function validateRequired(value, fieldName) {
  if (value === null || value === undefined) {
    return `請輸入${fieldName}`
  }

  if (typeof value === "string" && !value.trim()) {
    return `請輸入${fieldName}`
  }

  return null
}

function validateName(name) {
  const normalized = String(name || "").trim()

  if (!normalized) {
    return "請輸入姓名"
  }

  if (normalized.length < 2) {
    return "姓名至少需要 2 個字"
  }

  if (normalized.length > 20) {
    return "姓名長度不可超過 20 個字"
  }

  return null
}

function validateTaxId(id) {
  const normalized = String(id || "").trim()

  if (!normalized) {
    return null
  }

  if (!/^\d{8}$/.test(normalized)) {
    return "統一編號格式不正確，請輸入 8 碼數字"
  }

  return null
}

function validateMobileBarcode(barcode) {
  const normalized = String(barcode || "").trim().toUpperCase()

  if (!normalized) {
    return null
  }

  if (!/^\/[0-9A-Z.+-]{7}$/.test(normalized)) {
    return "手機條碼格式不正確，請輸入 / 開頭加 7 碼英數字"
  }

  return null
}

function validateCardNumber(cardNumber) {
  const normalized = String(cardNumber || "").replace(/[\s-]/g, "")

  if (!normalized) {
    return "請輸入卡號"
  }

  if (!/^\d{16}$/.test(normalized)) {
    return "信用卡卡號格式不正確，請輸入 16 碼數字"
  }

  return null
}

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
