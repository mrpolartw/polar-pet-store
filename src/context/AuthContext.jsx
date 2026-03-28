import React, { createContext, useState, useEffect } from 'react'
import { sdk } from '../lib/medusa'


import authService from '../services/authService'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true) // 初始化時要 true，等待 session 確認
  const [authError, setAuthError] = useState('')

  // ──────────────────────────────────────────────
  // 初始化：從 Medusa 取得當前登入的會員資訊（如果有的話）
  // ──────────────────────────────────────────────
  useEffect(() => {
    const wasLoggedIn = localStorage.getItem('polar_logged_in') === '1'
    if (!wasLoggedIn) {
      setIsLoading(false)
      return
    }
    const fetchCurrentCustomer = async () => {
      try {
        const { customer } = await sdk.store.customer.retrieve()
        if (customer) {
          setUser(mapMedusaCustomer(customer))
        }
      } catch {
        // Session 已過期，清除登入標記
        localStorage.removeItem('polar_logged_in')
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    const checkSession = async () => {
      try {
        const data = await authService.getMe()
        setUser(data?.customer ?? data ?? null)
      } catch {
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }
    fetchCurrentCustomer()
  }, [])

  // ──────────────────────────────────────────────
  // 工具：將 Medusa Customer 物件轉換成前台格式
  // ──────────────────────────────────────────────
  const mapMedusaCustomer = (c) => ({
    id: c.id,
    name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email.split('@')[0],
    firstName: c.first_name || '',
    lastName: c.last_name || '',
    email: c.email,
    phone: c.phone || '',
    avatar: null,
    memberSince: c.created_at?.split('T')[0] || '',
    points: c.metadata?.points || 0,
    pets: c.metadata?.pets || [],
    metadata: c.metadata || {},
    addresses: (c.addresses || []).map(a => ({
      id: a.id,
      label: a.metadata?.label || '地址',
      name: `${a.first_name || ''} ${a.last_name || ''}`.trim(),
      phone: a.phone || '',
      city: a.city || '',
      district: a.province || '',
      address: `${a.address_1 || ''} ${a.address_2 || ''}`.trim(),
      isDefault: a.is_default_shipping || false,
    })),
  })

  // ──────────────────────────────────────────────
  // 登入：使用 Medusa Customer Auth API
  // ──────────────────────────────────────────────
  const login = async (email, password) => {

    checkSession()
  }, [])

  const login = useCallback(async (email, password) => {
    setIsLoading(true)
    setAuthError('')

    try {
      // Step 1：取得登入 Token
      const token = await sdk.auth.login('customer', 'emailpass', {
        email,
        password,
      })

      if (!token) {
        setAuthError('帳號或密碼不正確，請再試一次')
        return { success: false }
      }

      // Step 2：取得完整會員資料
      const { customer } = await sdk.store.customer.retrieve()
      setUser(mapMedusaCustomer(customer))
      localStorage.setItem('polar_logged_in', '1')
      return { success: true }
    } catch (err) {
      console.error('Login error:', err)
      const msg = err?.response?.json?.message || err?.message || ''
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials')) {
        setAuthError('帳號或密碼不正確，請再試一次')
      } else {
        setAuthError('登入時發生錯誤，請稍後再試')
      }
      return { success: false }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ──────────────────────────────────────────────
  // 註冊：使用 Medusa Customer Register API
  // ──────────────────────────────────────────────
  const register = async (userData) => {
    setIsLoading(true)
    setAuthError('')

    try {
      const { email, password, name, phone } = userData
      const nameParts = name?.split(' ') || []
      const firstName = nameParts[0] || name || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      // Step 1：在 Auth 系統建立憑證（此步驟會回傳 token 並自動設定到 SDK）
      await sdk.auth.register('customer', 'emailpass', {
        email,
        password,
      })

      // Step 2：用 register 回傳的 token，建立真正的 Customer 記錄
      // ⚠️ Medusa v2 Auth register 只建立憑證，Customer 記錄要另外 create
      await sdk.store.customer.create({
        email,
        first_name: firstName,
        last_name: lastName,
        phone: phone || '',
      })

      // Step 3：正式登入取得 session
      await sdk.auth.login('customer', 'emailpass', { email, password })

      // Step 4：取得完整會員資料
      const { customer } = await sdk.store.customer.retrieve()
      setUser(mapMedusaCustomer(customer))
      localStorage.setItem('polar_logged_in', '1')
      return { success: true }
    } catch (err) {
      console.error('Register error:', err)
      const msg = err?.response?.json?.message || err?.message || ''
      if (msg.toLowerCase().includes('exists') || msg.toLowerCase().includes('already')) {
        setAuthError('此電子郵件已被註冊，請直接登入')
      } else {
        setAuthError('註冊時發生錯誤：' + (msg || '請稍後再試'))
      }
      return { success: false }
    } finally {
      setIsLoading(false)
    }
  }, []

  // ──────────────────────────────────────────────
  // 登出：清除 Medusa Session
  // ──────────────────────────────────────────────
  const logout = async () => {
    try {
      await sdk.auth.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setUser(null)
      localStorage.removeItem('polar_logged_in')
    }
  }

  // ──────────────────────────────────────────────
  // 更新個人資料
  // ──────────────────────────────────────────────
  const updateProfile = async (updates) => {
    setIsLoading(true)
    try {
      const payload = {}
      if (updates.name) {
        const parts = updates.name.split(' ')
        payload.first_name = parts[0]
        payload.last_name = parts.slice(1).join(' ') || ''
      }
      if (updates.firstName !== undefined) payload.first_name = updates.firstName
      if (updates.lastName !== undefined) payload.last_name = updates.lastName
      if (updates.phone !== undefined) payload.phone = updates.phone

      const { customer } = await sdk.store.customer.update(payload)
      setUser(mapMedusaCustomer(customer))
      return { success: true }
    } catch (err) {
      console.error('Update profile error:', err)
      return { success: false }
    } finally {
      setIsLoading(false)
    }
  }

  // ──────────────────────────────────────────────
  // 更新毛孩資料 (使用 Metadata)
  // ──────────────────────────────────────────────
  const updatePets = async (newPets) => {
    setIsLoading(true)
    try {
      const payload = {
        metadata: {
          ...(user.metadata || {}),
          pets: newPets
        }
      }
      const { customer } = await sdk.store.customer.update(payload)
      setUser(mapMedusaCustomer(customer))
      return { success: true }
    } catch (err) {
      console.error('Update pets error:', err)
      return { success: false, message: '儲存毛孩資料失敗' }
    } finally {
      setIsLoading(false)
    }
  }

  // ──────────────────────────────────────────────
  // 變更密碼（Medusa 需要先驗舊密碼）
  // ──────────────────────────────────────────────
  const changePassword = async (oldPassword, newPassword) => {
    setIsLoading(true)
    try {
      await sdk.auth.updateProvider('customer', 'emailpass', {
        email: user.email,
        password: newPassword,
        // oldPassword, // 如果 Medusa 版本支援
      })
      return { success: true }
    } catch (err) {
      console.error('Change password error:', err)
      return { success: false, message: '更新密碼失敗，請再試一次' }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        authError,
        setAuthError,
        login,
        register,
        logout,
        updateProfile,
        updatePets,
        changePassword,
        isLoggedIn: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
