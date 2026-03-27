/**
 * Polar Pet Store — API Base Client
 * 後端 API 串接時，各 service 改為呼叫此模組的 get/post/put/del 方法
 * 目前 VITE_USE_MOCK=true 時，此模組不會被呼叫
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const DEFAULT_TIMEOUT = 15000

/**
 * 統一錯誤格式化
 * @param {Response} res
 */
async function handleResponse(res) {
  if (res.ok) {
    const text = await res.text()
    try {
      return text ? JSON.parse(text) : {}
    } catch {
      return {}
    }
  }

  let errorBody = {}
  try {
    errorBody = await res.json()
  } catch {
    // ignore
  }

  const error = new Error(errorBody?.message ?? `HTTP ${res.status}`)
  error.status = res.status
  error.body = errorBody
  throw error
}

/**
 * 帶 timeout 的 fetch wrapper
 */
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    return res
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeout = new Error('請求超時，請稍後再試')
      timeout.status = 408
      throw timeout
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 取得通用 headers（含 JWT token）
 * @returns {Record<string, string>}
 */
function getHeaders(extra = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...extra,
  }
  // TODO BACKEND: 接入 token 機制（JWT / Cookie）
  // const token = sessionStorage.getItem(CONFIG.SESSION_STORAGE_KEY)
  // if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

const apiClient = {
  /**
   * GET 請求
   * @param {string} path - API 路徑（不含 base URL）
   * @param {RequestInit} [options]
   */
  get: async (path, options = {}) => {
    const res = await fetchWithTimeout(`${BASE_URL}${path}`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include',
      ...options,
    })
    return handleResponse(res)
  },

  /**
   * POST 請求
   * @param {string} path
   * @param {object} body
   * @param {RequestInit} [options]
   */
  post: async (path, body = {}, options = {}) => {
    const res = await fetchWithTimeout(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(body),
      ...options,
    })
    return handleResponse(res)
  },

  /**
   * PUT 請求
   * @param {string} path
   * @param {object} body
   * @param {RequestInit} [options]
   */
  put: async (path, body = {}, options = {}) => {
    const res = await fetchWithTimeout(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(body),
      ...options,
    })
    return handleResponse(res)
  },

  /**
   * DELETE 請求
   * @param {string} path
   * @param {RequestInit} [options]
   */
  del: async (path, options = {}) => {
    const res = await fetchWithTimeout(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
      ...options,
    })
    return handleResponse(res)
  },
}

export default apiClient
