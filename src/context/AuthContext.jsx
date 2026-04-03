import { createContext, useState, useEffect, useCallback } from 'react'
import { auth, mrpolar, setToken, getToken, clearToken } from '../lib/woocommerce'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  // ──────────────────────────────────────────────
  // 工具：將 WooCommerce Customer 物件轉換成前台格式
  // ──────────────────────────────────────────────
  const mapWcCustomer = (c) => ({
    id: c.id,
    name: c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.username,
    firstName: c.first_name || '',
    lastName: c.last_name || '',
    email: c.email,
    phone: c.phone || '',
    avatar: c.avatar || null,
    memberSince: c.member_since?.split('T')[0] || '',
    points: c.points || 0,
    pets: c.pets || [],
    gender: c.gender || '',
    birthday: c.birthday || '',
    addresses: (c.addresses || []).map(a => ({
      id: a.id,
      label: a.label || '地址',
      name: a.name || '',
      phone: a.phone || '',
      city: a.city || '',
      district: a.district || '',
      address: a.address || '',
      isDefault: a.is_default || false,
    })),
  })

  // ──────────────────────────────────────────────
  // 初始化：從 WooCommerce 取得當前登入的會員資訊
  // ──────────────────────────────────────────────
  useEffect(() => {
    const wasLoggedIn = localStorage.getItem('polar_logged_in') === '1'
    const hasToken = !!getToken()

    if (!wasLoggedIn || !hasToken) {
      // 旗標存在但 token 不見（分頁已關閉），清除旗標
      if (wasLoggedIn && !hasToken) {
        localStorage.removeItem('polar_logged_in')
      }
      setIsLoading(false)
      return
    }

    const fetchCurrentCustomer = async () => {
      try {
        const customer = await mrpolar.getMe()
        setUser(mapWcCustomer(customer))
      } catch {
        clearToken()
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
      // JWT 插件接受 username 或 email
      const result = await auth.login(email, password)

      if (!result?.token) {
        setAuthError('帳號或密碼不正確，請再試一次')
        return { success: false }
      }

      setToken(result.token)

      const customer = await mrpolar.getMe()
      setUser(mapWcCustomer(customer))
      localStorage.setItem('polar_logged_in', '1')
      return { success: true }
    } catch (err) {
      console.error('Login error:', err)
      const msg = err?.message || ''
      if (
        msg.toLowerCase().includes('incorrect') ||
        msg.toLowerCase().includes('invalid') ||
        err?.code === '[jwt_auth] incorrect_password' ||
        err?.code === '[jwt_auth] invalid_username'
      ) {
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
      const {
        email, password, name, firstName, lastName,
        phone, gender, birthday, pets,
      } = userData

      const first = firstName || (name ? name.split(' ')[0] : '') || ''
      const last  = lastName  || (name ? name.split(' ').slice(1).join(' ') : '') || ''

      // 呼叫自定義公開註冊 endpoint
      await mrpolar.register({
        email,
        password,
        first_name: first,
        last_name:  last,
        phone:    phone    || '',
        gender:   gender   || '',
        birthday: birthday || '',
        pets:     pets     || [],
      })

      // 註冊成功後自動登入
      const result = await auth.login(email, password)
      if (!result?.token) throw new Error('自動登入失敗')

      setToken(result.token)
      const customer = await mrpolar.getMe()
      setUser(mapWcCustomer(customer))
      localStorage.setItem('polar_logged_in', '1')
      return { success: true }
    } catch (err) {
      console.error('Register error:', err)
      const msg = err?.message || ''
      if (
        msg.includes('已被註冊') ||
        err?.code === 'email_exists' ||
        msg.toLowerCase().includes('exists')
      ) {
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
    clearToken()
    setUser(null)
    localStorage.removeItem('polar_logged_in')
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
        payload.last_name  = parts.slice(1).join(' ') || ''
      }
      if (updates.firstName !== undefined) payload.first_name = updates.firstName
      if (updates.lastName  !== undefined) payload.last_name  = updates.lastName
      if (updates.phone     !== undefined) payload.phone      = updates.phone
      if (updates.gender    !== undefined) payload.gender     = updates.gender
      if (updates.birthday  !== undefined) payload.birthday   = updates.birthday

      const customer = await mrpolar.updateMe(payload)
      setUser(mapWcCustomer(customer))
      return { success: true }
    } catch (err) {
      console.error('Update profile error:', err)
      return { success: false, message: err?.message }
    } finally {
      setIsLoading(false)
    }
  }

  // ──────────────────────────────────────────────
  // 更新毛孩資料
  // ──────────────────────────────────────────────
  const updatePets = async (newPets) => {
    setIsLoading(true)
    try {
      const { pets } = await mrpolar.updatePets(newPets)
      setUser(prev => ({ ...prev, pets }))
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
      await mrpolar.changePassword(oldPassword, newPassword)
      // 密碼修改後 token 仍有效，但建議重新登入
      return { success: true }
    } catch (err) {
      console.error('Change password error:', err)
      const msg = err?.message || '更新密碼失敗，請再試一次'
      return { success: false, message: msg }
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
