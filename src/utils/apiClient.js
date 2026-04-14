const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const DEFAULT_TIMEOUT = 15000
const PUBLISHABLE_KEY = import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY ?? ''

function buildApiUrl(path) {
  return `${BASE_URL}${path}`
}

function logAuthRequestDiagnostic(url, res, errorBody) {
  if (!import.meta.env.DEV) {
    return
  }

  if (
    !url.includes('/store/auth/customer/login') &&
    !url.includes('/store/customers/me/profile')
  ) {
    return
  }

  const hint = url.includes('/store/auth/customer/login')
    ? '這是前台會員登入 API；Medusa 後台登入使用 /auth/user/emailpass。'
    : '這是前台會員 session hydrate API；若登入後失敗，請優先檢查 CORS、cookie 與 credentials: include。'

  console.warn('[apiClient] 驗證相關請求回傳非成功狀態', {
    url,
    status: res.status,
    response: errorBody,
    hint,
  })
}

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

  logAuthRequestDiagnostic(res.url, res, errorBody)

  const message =
    errorBody?.message ??
    errorBody?.error ??
    errorBody?.details ??
    `HTTP ${res.status}`

  const error = new Error(message)
  error.status = res.status
  error.body = errorBody
  throw error
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT)

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    return res
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeout = new Error('請求逾時，請稍後再試。')
      timeout.status = 408
      throw timeout
    }

    throw err
  } finally {
    clearTimeout(timer)
  }
}

function getHeaders(extra = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...extra,
  }

  if (PUBLISHABLE_KEY) {
    headers['x-publishable-api-key'] = PUBLISHABLE_KEY
  }

  return headers
}

function buildRequestOptions(method, body, options = {}) {
  const {
    headers: extraHeaders = {},
    credentials = 'include',
    ...rest
  } = options

  const requestOptions = {
    method,
    headers: getHeaders(extraHeaders),
    credentials,
    ...rest,
  }

  if (body !== undefined && body !== null) {
    requestOptions.body = JSON.stringify(body)
  }

  return requestOptions
}

const apiClient = {
  buildApiUrl,

  get: async (path, options = {}) => {
    const res = await fetchWithTimeout(
      buildApiUrl(path),
      buildRequestOptions('GET', undefined, options)
    )
    return handleResponse(res)
  },

  post: async (path, body = {}, options = {}) => {
    const res = await fetchWithTimeout(
      buildApiUrl(path),
      buildRequestOptions('POST', body, options)
    )
    return handleResponse(res)
  },

  put: async (path, body = {}, options = {}) => {
    const res = await fetchWithTimeout(
      buildApiUrl(path),
      buildRequestOptions('PUT', body, options)
    )
    return handleResponse(res)
  },

  patch: async (path, body = {}, options = {}) => {
    const res = await fetchWithTimeout(
      buildApiUrl(path),
      buildRequestOptions('PATCH', body, options)
    )
    return handleResponse(res)
  },

  del: async (path, options = {}) => {
    const res = await fetchWithTimeout(
      buildApiUrl(path),
      buildRequestOptions('DELETE', undefined, options)
    )
    return handleResponse(res)
  },
}

export default apiClient
export { buildApiUrl }
