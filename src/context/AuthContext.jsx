/**
 * 會員登入狀態 Context
 */
import React, { createContext, useEffect, useState } from 'react'
import {
  changePassword as changeCustomerPassword,
  createPet,
  getCustomer,
  getMeta,
  updateCustomer,
  updateMeta,
} from '../api/customer'
import { sdk } from '../lib/medusa'

const AuthContext = createContext(null)
const TOKEN_KEY = 'polar_token'

const DEFAULT_META = {
  birthday: '',
  gender: '',
  points: 0,
  total_spent: 0,
  member_since: '',
}

const formatDateValue = (value) => {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toISOString().slice(0, 10)
}

const splitName = (userData = {}) => {
  if (userData.first_name || userData.last_name) {
    return {
      first_name: userData.first_name?.trim() || '',
      last_name: userData.last_name?.trim() || '',
    }
  }
  return {
    first_name: userData.name?.trim() || '',
    last_name: '',
  }
}

const resolveRegisterPassword = (userData = {}) => {
  if (typeof userData.password === 'string' && userData.password) {
    return userData.password
  }
  const inputs = Array.from(
    document.querySelectorAll('input[autocomplete="new-password"]')
  )
  return inputs.find((el) => el.value)?.value || ''
}

const buildDefaultMeta = (meta = {}) => ({
  ...DEFAULT_META,
  ...meta,
  points: Number(meta?.points || 0),
  total_spent: Number(meta?.total_spent || 0),
  birthday: formatDateValue(meta?.birthday),
  member_since: formatDateValue(meta?.member_since),
})

const buildUser = (customer, meta, extras = {}) => {
  const normalizedMeta = buildDefaultMeta(meta)
  const firstName = customer?.first_name || extras.first_name || ''
  const lastName = customer?.last_name || extras.last_name || ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()

  return {
    id: customer?.id || '',
    email: customer?.email || '',
    first_name: firstName,
    last_name: lastName,
    name: extras.name || fullName || customer?.email || '',
    phone: customer?.phone || normalizedMeta.phone || '',
    birthday: normalizedMeta.birthday,
    gender: normalizedMeta.gender || '',
    points: normalizedMeta.points,
    total_spent: normalizedMeta.total_spent,
    member_since: normalizedMeta.member_since || formatDateValue(customer?.created_at),
    addresses: customer?.addresses || [],
    created_at: customer?.created_at || '',
    avatar: null,
    pets: extras.pets || [],
  }
}

const getSafeMeta = async () => {
  try {
    return await getMeta()
  } catch {
    return DEFAULT_META
  }
}

// 設定 token（同步，不 await）
const applyToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token)
  sdk.client.setToken(token)   // ← 同步，不用 await
}

// 清除 token
const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY)
  try { sdk.client.clearToken() } catch { /* 靜默 */ }
}

const persistRegisterPets = async (pets = []) => {
  const created = []
  for (const pet of pets) {
    if (!pet?.petName || !pet?.petType || !pet?.petGender) continue
    try {
      const result = await createPet({
        name: pet.petName,
        type: pet.petType,
        gender: pet.petGender,
        breed: pet.petBreed,
        age: pet.petAge ? Number(pet.petAge) : undefined,
        weight: pet.petWeight ? Number(pet.petWeight) : undefined,
        birthday: pet.petBirthday || undefined,
      })
      if (result) created.push(result)
    } catch { continue }
  }
  return created
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  // ── 初始化：有 token 就嘗試還原登入狀態 ──
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY)

      if (!token) {
        if (mounted) setIsLoading(false)
        return
      }

      try {
        sdk.client.setToken(token)   // ← 同步
        const [customer, meta] = await Promise.all([getCustomer(), getSafeMeta()])
        if (mounted) setUser(buildUser(customer, meta))
      } catch {
        clearToken()
        if (mounted) setUser(null)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    initializeAuth()
    return () => { mounted = false }
  }, [])

  // ── 登入 ──
  const login = async (email, password) => {
    setIsLoading(true)
    setAuthError('')

    try {
      const token = await sdk.auth.login('customer', 'emailpass', { email, password })

      if (typeof token !== 'string' || !token) {
        throw new Error('帳號或密碼錯誤，請重新輸入')
      }

      applyToken(token)   // ← 立刻設定 token

      const [customer, meta] = await Promise.all([getCustomer(), getSafeMeta()])
      setUser(buildUser(customer, meta))

      return { success: true }
    } catch (error) {
      const message = error?.message || '帳號或密碼錯誤，請重新輸入'
      setAuthError(message)
      return { success: false, message }
    } finally {
      setIsLoading(false)
    }
  }

  // ── 註冊 ──
  const register = async (userData) => {
  setIsLoading(true)
  setAuthError('')

  try {
    const password = resolveRegisterPassword(userData)
    if (!password) throw new Error('註冊失敗，缺少密碼')

    const names = splitName(userData)
    const backendUrl = import.meta.env.VITE_MEDUSA_BACKEND_URL || "http://localhost:9000"
    const pubKey = import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY

    // Step 1：建立 auth identity，取得 registration token
    const registrationToken = await sdk.auth.register('customer', 'emailpass', {
      email: userData.email,
      password,
    })

    if (typeof registrationToken !== 'string' || !registrationToken) {
      throw new Error('註冊失敗，請稍後再試')
    }

    // Step 2：用 registration token 建立 customer profile
    const createRes = await fetch(`${backendUrl}/store/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${registrationToken}`,
        'x-publishable-api-key': pubKey,
      },
      body: JSON.stringify({
        email: userData.email,
        first_name: names.first_name,
        last_name: names.last_name,
        phone: userData.phone || '',
      }),
    })

    if (!createRes.ok) {
      const errData = await createRes.json().catch(() => ({}))
      throw new Error(errData?.message || '建立會員資料失敗')
    }

    // Step 3：registration token 已失效，重新登入取得正式 session token
    const sessionToken = await sdk.auth.login('customer', 'emailpass', {
      email: userData.email,
      password,
    })

    if (typeof sessionToken !== 'string' || !sessionToken) {
      throw new Error('自動登入失敗，請手動登入')
    }

    // Step 4：設定正式 session token
    applyToken(sessionToken)

    // Step 5：寫入 meta（現在有正式 token，可以呼叫 /me 路由）
    const metaPayload = {}
    if (userData.phone)    metaPayload.phone    = userData.phone
    if (userData.birthday) metaPayload.birthday = userData.birthday
    if (userData.gender)   metaPayload.gender   = userData.gender
    await updateMeta(metaPayload).catch(() => null)

    // Step 6：建立寵物資料
    const createdPets = await persistRegisterPets(userData.pets)

    // Step 7：取得最終 user 資料
    const [customer, meta] = await Promise.all([getCustomer(), getSafeMeta()])

    setUser(buildUser(customer, meta, {
      ...names,
      name: userData.name,
      pets: createdPets,
    }))

    return { success: true }

  } catch (error) {
    clearToken()
    const raw = error?.message || ''
    const message = raw.includes('exists') || raw.includes('already')
      ? '此 Email 已被註冊，請直接登入'
      : raw || '註冊失敗，請稍後再試'
    setAuthError(message)
    return { success: false, message }
  } finally {
    setIsLoading(false)
  }
}

  // ── 登出 ──
  const logout = async () => {
    try { await sdk.auth.logout() } catch { /* 靜默 */ }
    clearToken()
    localStorage.removeItem('polar_cart_id')
    setUser(null)
  }

  // ── 更新個人資料 ──
  const updateProfile = async (updates) => {
    const customerUpdates = {}
    const metaUpdates = {}

    if (updates.first_name !== undefined) customerUpdates.first_name = updates.first_name
    if (updates.last_name  !== undefined) customerUpdates.last_name  = updates.last_name
    if (updates.name !== undefined && !updates.first_name && !updates.last_name)
      customerUpdates.first_name = updates.name
    if (updates.email !== undefined) customerUpdates.email = updates.email
    if (updates.phone !== undefined) {
      customerUpdates.phone = updates.phone
      metaUpdates.phone = updates.phone
    }
    if (updates.birthday !== undefined) metaUpdates.birthday = updates.birthday
    if (updates.gender   !== undefined) metaUpdates.gender   = updates.gender

    if (Object.keys(customerUpdates).length > 0) await updateCustomer(customerUpdates)
    if (Object.keys(metaUpdates).length > 0)     await updateMeta(metaUpdates)

    const [customer, meta] = await Promise.all([getCustomer(), getSafeMeta()])
    const updatedUser = buildUser(customer, meta, { pets: user?.pets || [] })
    setUser(updatedUser)

    return updatedUser
  }

  // ── 修改密碼 ──
  const changePassword = async (_oldPassword, newPassword) => {
    try {
      await changeCustomerPassword(newPassword)
      return { success: true }
    } catch (error) {
      return { success: false, message: error?.message || '密碼更新失敗，請稍後再試' }
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      authError,
      setAuthError,
      login,
      register,
      logout,
      updateProfile,
      changePassword,
      isLoggedIn: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
