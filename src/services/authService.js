import { mockAuthHandlers } from '../mocks/mockHandlers'
import apiClient, { buildApiUrl } from '../utils/apiClient'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

if (USE_MOCK && import.meta.env.PROD) {
  console.error('[authService] MOCK MODE IS ACTIVE IN PRODUCTION! Set VITE_USE_MOCK=false')
}

const PATHS = {
  REGISTER: '/store/auth/customer/register',
  LOGIN: '/store/auth/customer/login',
  STATUS: '/store/auth/customer/status',
  LOGOUT: '/auth/session',
  ME: '/store/customers/me/profile',
  UPDATE_PROFILE: '/store/customers/me/profile',
  CHANGE_PASSWORD: '/store/customers/me/password',
  REQUEST_EMAIL_VERIFICATION: '/store/auth/customer/email-verification/request',
  CONFIRM_EMAIL_VERIFICATION: '/store/auth/customer/email-verification/confirm',
  REQUEST_PASSWORD_RESET: '/store/auth/customer/password-reset/request',
  VALIDATE_PASSWORD_RESET: '/store/auth/customer/password-reset/validate',
  CONFIRM_PASSWORD_RESET: '/store/auth/customer/password-reset/confirm',
  LINE_START: '/store/auth/customer/line/start',
  LINE_COMPLETE: '/store/auth/customer/line/complete',
  LINE_BIND_START: '/store/customers/me/line/start',
}

// ─── session hint ────────────────────────────────────────────────────────────
// We store a lightweight flag in sessionStorage so that on a fresh page load
// (no active session) we skip the /me/profile request entirely and avoid the
// browser printing a red 401 in the Network tab for anonymous visitors.
const SESSION_FLAG = 'pps_has_session'

function markSessionActive() {
  try { sessionStorage.setItem(SESSION_FLAG, '1') } catch { /* ignore */ }
}

function clearSessionFlag() {
  try { sessionStorage.removeItem(SESSION_FLAG) } catch { /* ignore */ }
}

function hasSessionFlag() {
  try { return sessionStorage.getItem(SESSION_FLAG) === '1' } catch { return false }
}
// ─────────────────────────────────────────────────────────────────────────────

function isAnonymousState(error) {
  return [400, 401, 403, 404].includes(Number(error?.status))
}

function toCustomerShape(data) {
  return data?.customer ?? data ?? null
}

function buildQuery(searchParams = {}) {
  const params = new URLSearchParams()

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    params.set(key, String(value))
  })

  const query = params.toString()
  return query ? `?${query}` : ''
}

async function fetchCurrentCustomer({ allowAnonymous = false } = {}) {
  try {
    const data = await apiClient.get(PATHS.ME)
    return toCustomerShape(data)
  } catch (error) {
    if (allowAnonymous && isAnonymousState(error)) {
      return null
    }

    throw error
  }
}

export const login = async (email, password) => {
  if (USE_MOCK) return mockAuthHandlers.login(email, password)

  await apiClient.post(PATHS.LOGIN, {
    email,
    password,
  })

  const customer = await fetchCurrentCustomer()
  markSessionActive()
  return customer
}

export const register = async (userData) => {
  if (USE_MOCK) return mockAuthHandlers.register(userData)

  return apiClient.post(PATHS.REGISTER, userData)
}

export const logout = async () => {
  if (USE_MOCK) return mockAuthHandlers.logout()
  clearSessionFlag()
  return apiClient.del(PATHS.LOGOUT)
}

export const getMe = async () => {
  if (USE_MOCK) return mockAuthHandlers.getMe()

  // If there is no session hint, skip the network request entirely.
  // This prevents the 401 red-line in DevTools on every cold page load.
  if (!hasSessionFlag()) {
    return null
  }

  const customer = await fetchCurrentCustomer({ allowAnonymous: true })

  // If the server no longer recognises the session, clear the flag.
  if (!customer) {
    clearSessionFlag()
  }

  return customer
}

export const getAuthStatus = async () => {
  if (USE_MOCK) {
    return {
      email_verified: true,
      email_verified_at: new Date().toISOString(),
      line_linked: false,
      line_display_name: null,
      line_bound_at: null,
    }
  }

  return apiClient.get(PATHS.STATUS)
}

export const updateProfile = async (data) => {
  if (USE_MOCK) return mockAuthHandlers.updateProfile(data)

  const response = await apiClient.post(PATHS.UPDATE_PROFILE, data)
  return toCustomerShape(response)
}

export const changePassword = async (oldPassword, newPassword) => {
  if (USE_MOCK) return mockAuthHandlers.changePassword(oldPassword, newPassword)

  return apiClient.post(PATHS.CHANGE_PASSWORD, {
    old_password: oldPassword,
    new_password: newPassword,
  })
}

export const requestEmailVerification = async (email) => {
  return apiClient.post(PATHS.REQUEST_EMAIL_VERIFICATION, { email })
}

export const confirmEmailVerification = async (token) => {
  return apiClient.post(PATHS.CONFIRM_EMAIL_VERIFICATION, { token })
}

export const requestPasswordReset = async (email) => {
  if (USE_MOCK) return mockAuthHandlers.requestPasswordReset(email)

  return apiClient.post(PATHS.REQUEST_PASSWORD_RESET, { email })
}

export const validatePasswordResetToken = async (token) => {
  return apiClient.post(PATHS.VALIDATE_PASSWORD_RESET, { token })
}

export const confirmPasswordReset = async (token, password) => {
  return apiClient.post(PATHS.CONFIRM_PASSWORD_RESET, { token, password })
}

export const completeLineRegistration = async ({ token, email, name }) => {
  markSessionActive()
  return apiClient.post(PATHS.LINE_COMPLETE, { token, email, name })
}

export const getLineLoginUrl = (redirectTo) => {
  return buildApiUrl(`${PATHS.LINE_START}${buildQuery({ redirect_to: redirectTo })}`)
}

export const getLineBindUrl = (redirectTo) => {
  return buildApiUrl(`${PATHS.LINE_BIND_START}${buildQuery({ redirect_to: redirectTo })}`)
}

export default {
  login,
  register,
  logout,
  getMe,
  getAuthStatus,
  updateProfile,
  changePassword,
  requestEmailVerification,
  confirmEmailVerification,
  requestPasswordReset,
  validatePasswordResetToken,
  confirmPasswordReset,
  getLineLoginUrl,
  getLineBindUrl,
  completeLineRegistration,
}
