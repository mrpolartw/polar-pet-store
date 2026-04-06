const RAW_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const API_ROOT = /\/wp-json$/i.test(RAW_BASE_URL) ? RAW_BASE_URL : `${RAW_BASE_URL}/wp-json`
const BASE = `${API_ROOT}/mrpolar/v1`

const buildHeaders = (token, headers = {}) => {
  const nextHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  }

  if (token) {
    nextHeaders.Authorization = `Bearer ${token}`
  }

  return nextHeaders
}

const parseResponseBody = async (response) => {
  if (response.status === 204) {
    return null
  }

  try {
    return await response.json()
  } catch {
    const text = await response.text()
    return text || null
  }
}

async function apiFetch(path, token, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method: options.method || 'GET',
    headers: buildHeaders(token, options.headers),
    body: options.body,
  })

  const body = await parseResponseBody(response)

  if (!response.ok) {
    const message = typeof body === 'string'
      ? body
      : body?.message || body?.data?.message || `HTTP ${response.status}`

    const error = new Error(message)
    error.status = response.status
    error.body = body
    throw error
  }

  return body
}

// 會員資料
export const getMember = (token) => apiFetch('/member/me', token)

export const updateMember = (token, data) => apiFetch('/member/me', token, {
  method: 'POST',
  body: JSON.stringify(data),
})

// 地址
export const getAddresses = (token) => apiFetch('/member/me/addresses', token)

export const createAddress = (token, data) => apiFetch('/member/me/addresses', token, {
  method: 'POST',
  body: JSON.stringify(data),
})

export const updateAddress = (token, id, data) => apiFetch(`/member/me/addresses/${id}`, token, {
  method: 'PUT',
  body: JSON.stringify(data),
})

export const deleteAddress = (token, id) => apiFetch(`/member/me/addresses/${id}`, token, {
  method: 'DELETE',
})

// 毛孩
export const getPets = (token) => apiFetch('/member/me/pets', token)

export const createPet = (token, data) => apiFetch('/member/me/pets', token, {
  method: 'POST',
  body: JSON.stringify(data),
})

export const updatePet = (token, id, data) => apiFetch(`/member/me/pets/${id}`, token, {
  method: 'PUT',
  body: JSON.stringify(data),
})

export const deletePet = (token, id) => apiFetch(`/member/me/pets/${id}`, token, {
  method: 'DELETE',
})

// 點數
export const getPoints = (token) => apiFetch('/member/me/points', token)

// 等級
export const getTiers = () => apiFetch('/tiers', null)

export { API_ROOT, BASE, apiFetch }
