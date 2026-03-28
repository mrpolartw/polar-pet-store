import { createContext, useState, useEffect, useCallback } from 'react'
import { sdk } from '../lib/medusa'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState('')

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
  // 初始化：從 Medusa 取得當前登入的會員資訊
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
        localStorage.removeItem('polar_logged_in')
      } finally {
        setIsLoading(false)
      }
    }
    fetchCurrentCustomer()
  }, [])

  // ──────────────────────────────────────────────
  // 登入
  // ──────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setIsLoading(true)
    setAuthError('')

    try {
      const token = await sdk.auth.login('customer', 'emailpass', { email, password })

      if (!token) {
        setAuthError('帳號或密碼不正確，請再試一次')
        return { success: false }
      }

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
  // 註冊
  // ──────────────────────────────────────────────
  const register = async (userData) => {
    setIsLoading(true)
    setAuthError('')

    try {
      const { email, password, name, phone } = userData
      const nameParts = name?.split(' ') || []
      const firstName = nameParts[0] || name || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      await sdk.auth.register('customer', 'emailpass', { email, password })

      await sdk.store.customer.create({
        email,
        first_name: firstName,
        last_name: lastName,
        phone: phone || '',
      })

      await sdk.auth.login('customer', 'emailpass', { email, password })

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
  }

  // ──────────────────────────────────────────────
  // 登出
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
          pets: newPets,
        },
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
  // 變更密碼
  // ──────────────────────────────────────────────
  const changePassword = async (oldPassword, newPassword) => {
    setIsLoading(true)
    try {
      await sdk.auth.updateProvider('customer', 'emailpass', {
        email: user.email,
        password: newPassword,
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
