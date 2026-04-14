const STORE_CUSTOMER_LOGIN_MESSAGES = {
  INVALID_CREDENTIALS:
    '前台會員帳號或密碼錯誤，請確認你使用的是會員帳號，而不是 Medusa 後台管理員帳號。',
  EMAIL_NOT_VERIFIED:
    '此前台會員帳號尚未完成 Email 驗證，請先前往信箱完成驗證。',
  ACCOUNT_INCOMPLETE:
    '此 Email 尚未完成前台會員帳號綁定，請先完成註冊流程，或聯繫客服協助處理。',
  SESSION_HYDRATE_FAILED:
    '前台會員登入已成功，但會員資料讀取失敗。請重新整理頁面；若仍持續發生，請檢查本機 CORS、cookie 與 session 設定。',
}

export function getStoreCustomerLoginErrorMessage({ code, fallbackMessage } = {}) {
  if (code && STORE_CUSTOMER_LOGIN_MESSAGES[code]) {
    return STORE_CUSTOMER_LOGIN_MESSAGES[code]
  }

  if (typeof fallbackMessage === 'string' && fallbackMessage.trim()) {
    return fallbackMessage.trim()
  }

  return '前台會員登入失敗，請稍後再試。'
}

export function getStoreCustomerSessionHydrationMessage() {
  return STORE_CUSTOMER_LOGIN_MESSAGES.SESSION_HYDRATE_FAILED
}

export function logStoreCustomerAuthDiagnostic(title, detail = {}) {
  if (!import.meta.env.DEV) {
    return
  }

  console.warn(`[store-auth] ${title}`, {
    ...detail,
    hint: '前台會員登入走 /store/auth/customer/login；Medusa 後台管理員登入走 /auth/user/emailpass。',
  })
}
