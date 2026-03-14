import React, { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

// 會員等級計算
export const getMemberTier = (points) => {
  if (points >= 8000) return { label: 'Polar Diamond', color: '#003153', bg: '#EBF2F8' }
  if (points >= 3000) return { label: 'Polar Gold',    color: '#8B5A2B', bg: '#FDF3E3' }
  if (points >= 1000) return { label: 'Polar Silver',  color: '#6B7280', bg: '#F3F4F6' }
  return                      { label: 'Polar Member',  color: '#8A7E71', bg: '#F3EFE6' }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('polar_user')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  const _saveUser = (u) => {
    setUser(u)
    localStorage.setItem('polar_user', JSON.stringify(u))
  }

  // ── 登入（Mock，未來替換為 API）
  const login = async (email, password) => {
    setIsLoading(true)
    setAuthError('')
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      // 模擬錯誤帳密
      if (password.length < 6) {
        setAuthError('電子郵件或密碼不正確，請再試一次')
        return { success: false }
      }
      const mockUser = {
        id: 1,
        name: email.split('@')[0],
        email,
        phone: '0912-345-678',
        birthday: '1995-06-15',
        avatar: null,
        memberSince: '2024-01-15',
        points: 3280,
        addresses: [
          { id: 1, label: '家', name: '王小明', phone: '0912-345-678', city: '台中市', district: '西屯區', address: '福科路 123 號 5 樓', isDefault: true },
        ],
      }
      _saveUser(mockUser)
      return { success: true }
    } finally {
      setIsLoading(false)
    }
  }

  // ── 註冊（Mock）
  const register = async (userData) => {
    setIsLoading(true)
    setAuthError('')
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      const newUser = {
        id: Date.now(),
        ...userData,
        avatar: null,
        memberSince: new Date().toISOString().split('T')[0],
        points: 100, // 新會員贈點
        addresses: [],
      }
      _saveUser(newUser)
      return { success: true }
    } finally {
      setIsLoading(false)
    }
  }

  // ── 登出
  const logout = () => {
    setUser(null)
    localStorage.removeItem('polar_user')
  }

  // ── 更新個人資料
  const updateProfile = (updates) => {
    const updated = { ...user, ...updates }
    _saveUser(updated)
  }

  // ── 修改密碼（Mock）
  const changePassword = async (oldPassword, newPassword) => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 600))
    setIsLoading(false)
    if (oldPassword.length < 6) {
      return { success: false, message: '舊密碼不正確' }
    }
    return { success: true }
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

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth 必須在 AuthProvider 內使用')
  return context
}
