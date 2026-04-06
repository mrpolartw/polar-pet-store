import { API_ROOT } from '../api/memberApi'
import { getMember, updateMember } from '../api/memberApi'

const createHeaders = (token) => {
  const headers = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

const parseResponseBody = async (response) => {
  if (response.status === 204) return null

  const text = await response.text()   // 只讀一次
  if (!text) return null

  try {
    return JSON.parse(text)            // 再 parse
  } catch {
    return text
  }
}

const requestJson = async (path, options = {}) => {
  const response = await fetch(`${API_ROOT}${path}`, {
    method: options.method || 'GET',
    headers: createHeaders(options.token),
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const body = await parseResponseBody(response)

  if (!response.ok) {
    const message = typeof body === 'string'
      ? body
      : body?.message || body?.data?.message || `HTTP ${response.status}`

    const error = new Error(message)
    error.status = response.status
    error.code = body?.code
    error.body = body
    throw error
  }

  return body
}

export const login = async (username, password) => requestJson('/jwt-auth/v1/token', {
  method: 'POST',
  body: { username, password },
})

export const validate = async (token) => requestJson('/jwt-auth/v1/token/validate', {
  method: 'POST',
  token,
})

export const register = async (userData) => requestJson('/mrpolar/v1/register', {
  method: 'POST',
  body: userData,
})

export const logout = async () => ({ success: true })

export const getMe = async (token) => getMember(token)

export const updateProfile = async (token, data) => updateMember(token, data)

export const changePassword = async (token, oldPassword, newPassword) => requestJson('/mrpolar/v1/change-password', {
  method: 'POST',
  token,
  body: {
    old_password: oldPassword,
    new_password: newPassword,
  },
})

export const requestPasswordReset = async () => {
  throw new Error('Reset password API 尚未接入')
}

export default {
  login,
  validate,
  register,
  logout,
  getMe,
  updateProfile,
  changePassword,
  requestPasswordReset,
}
