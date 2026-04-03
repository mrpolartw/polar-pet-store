/**
 * WooCommerce / MrPolar API 客戶端
 *
 * 認證流程：
 *   1. 登入  → POST /wp-json/jwt-auth/v1/token  → 取得 JWT
 *   2. 後續請求 → Authorization: Bearer <token>
 *   3. JWT 存放於記憶體（module-level），搭配 sessionStorage 保持頁面刷新
 *
 * 安全原則：
 *   - JWT 不存 localStorage（只存 sessionStorage，關閉分頁即清除）
 *   - polar_logged_in 僅存布林旗標於 localStorage
 */

const WC_URL = import.meta.env.VITE_WC_URL || 'http://localhost:8080'

// ──────────────────────────────────────────────
// Token 管理（記憶體優先，sessionStorage 備援）
// ──────────────────────────────────────────────
let _token = null

const TOKEN_KEY = 'polar_wc_token'

export function setToken(token) {
  _token = token
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token)
  } else {
    sessionStorage.removeItem(TOKEN_KEY)
  }
}

export function getToken() {
  if (_token) return _token
  // 頁面刷新後從 sessionStorage 還原
  const stored = sessionStorage.getItem(TOKEN_KEY)
  if (stored) {
    _token = stored
    return _token
  }
  return null
}

export function clearToken() {
  _token = null
  sessionStorage.removeItem(TOKEN_KEY)
}

// ──────────────────────────────────────────────
// 核心 fetch wrapper
// ──────────────────────────────────────────────
async function request(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${WC_URL}${path}`, {
    ...options,
    headers,
  })

  // 401 → token 過期或無效
  if (response.status === 401) {
    clearToken()
    localStorage.removeItem('polar_logged_in')
    const error = new Error('登入已過期，請重新登入')
    error.status = 401
    throw error
  }

  const data = await response.json()

  if (!response.ok) {
    const error = new Error(data.message || `HTTP ${response.status}`)
    error.status = response.status
    error.code = data.code
    error.data = data
    throw error
  }

  return data
}

// ──────────────────────────────────────────────
// 認證 API（使用 JWT Authentication 插件）
// ──────────────────────────────────────────────
export const auth = {
  /**
   * 登入 → 取得 JWT token
   * @returns {{ token, user_email, user_display_name }}
   */
  login: (username, password) =>
    request('/wp-json/jwt-auth/v1/token', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  /**
   * 驗證目前 token 是否有效
   */
  validate: () =>
    request('/wp-json/jwt-auth/v1/token/validate', { method: 'POST' }),
}

// ──────────────────────────────────────────────
// 自定義 MrPolar API（/wp-json/mrpolar/v1/）
// ──────────────────────────────────────────────
export const mrpolar = {
  /**
   * 公開會員註冊
   */
  register: (userData) =>
    request('/wp-json/mrpolar/v1/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  /**
   * 取得當前登入會員資料
   */
  getMe: () => request('/wp-json/mrpolar/v1/me'),

  /**
   * 更新會員基本資料
   */
  updateMe: (data) =>
    request('/wp-json/mrpolar/v1/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  /**
   * 修改密碼
   */
  changePassword: (oldPassword, newPassword) =>
    request('/wp-json/mrpolar/v1/change-password', {
      method: 'POST',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    }),

  /**
   * 更新寵物資料
   */
  updatePets: (pets) =>
    request('/wp-json/mrpolar/v1/customer/pets', {
      method: 'POST',
      body: JSON.stringify({ pets }),
    }),

  /**
   * 取得收件地址列表
   */
  getAddresses: () => request('/wp-json/mrpolar/v1/customer/addresses'),

  /**
   * 新增收件地址
   */
  addAddress: (address) =>
    request('/wp-json/mrpolar/v1/customer/addresses', {
      method: 'POST',
      body: JSON.stringify(address),
    }),

  /**
   * 更新收件地址
   */
  updateAddress: (id, address) =>
    request(`/wp-json/mrpolar/v1/customer/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(address),
    }),

  /**
   * 刪除收件地址
   */
  deleteAddress: (id) =>
    request(`/wp-json/mrpolar/v1/customer/addresses/${id}`, { method: 'DELETE' }),
}

// ──────────────────────────────────────────────
// WooCommerce Store API（/wp-json/wc/store/v1/）
// 購物車、產品（保留供後續使用）
// ──────────────────────────────────────────────
export const store = {
  products: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString()
      return request(`/wp-json/wc/v3/products${qs ? `?${qs}` : ''}`)
    },
    get: (id) => request(`/wp-json/wc/v3/products/${id}`),
  },
}
