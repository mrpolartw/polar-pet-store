/**
 * 自訂 API 呼叫工具
 * 用於呼叫後端自訂 Store 路由（/store/customers/me/*）
 */

const BASE_URL = import.meta.env.VITE_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUB_KEY = import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY

const buildHeaders = (customHeaders = {}) => {
  // ← 每次呼叫時才讀取，確保 token 是最新的
  const token = localStorage.getItem("polar_token")

  const headers = {
    "Content-Type": "application/json",
    "x-publishable-api-key": PUB_KEY,
    ...customHeaders,
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

const parseJson = async (response) => {
  try {
    return await response.json()
  } catch {
    return null
  }
}

const request = async (path, options = {}) => {
  const url = path.startsWith("http")
    ? path                  // 已是完整 URL，直接用
    : `${BASE_URL}${path}`  // 相對路徑，加上 BASE_URL

  const response = await fetch(url, {
    ...options,
    headers: buildHeaders(options.headers),
  })

  if (response.status === 204) return null

  if (!response.ok) {
    const errorPayload = await parseJson(response)
    const message = errorPayload?.message || errorPayload?.error || "系統發生錯誤，請稍後再試"
    throw new Error(message)
  }

  return await parseJson(response)
}

export const get  = (path)        => request(path, { method: "GET" })
export const post = (path, body)  => request(path, { method: "POST",   body: JSON.stringify(body) })
export const put  = (path, body)  => request(path, { method: "PUT",    body: JSON.stringify(body) })
export const del  = (path)        => request(path, { method: "DELETE" })
