import React, { createContext, useState } from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('polar_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  const _saveUser = (u) => {
    setUser(u)
    try {
      localStorage.setItem('polar_user', JSON.stringify(u))
      return { success: true }
    } catch {
      return { success: false, message: '無法寫入瀏覽器儲存空間' }
    }
  }

  const login = async (email, password) => {
    setIsLoading(true)
    setAuthError('')
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      if (password.length < 6) {
        setAuthError('密碼至少需要 6 個字元')
        return { success: false }
      }
      const mockUser = {
        id: 1,
        name: email.split('@')[0],
        email,
        phone: '0912-345-678',
        birthday: '1995-06-15',
        avatar: null,
        lineLinked: false,
        lineDisplayName: '',
        lineBoundAt: '',
        memberSince: '2024-01-15',
        points: 3280,
        addresses: [
          {
            id: 1,
            label: '住家',
            name: '王小明',
            phone: '0912-345-678',
            city: '台北市',
            district: '大安區',
            address: '忠孝東路 123 號 5 樓',
            isDefault: true,
          },
        ],
      }
      _saveUser(mockUser)
      return { success: true }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData) => {
    setIsLoading(true)
    setAuthError('')
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      const newUser = {
        id: Date.now(),
        ...userData,
        avatar: null,
        lineLinked: false,
        lineDisplayName: '',
        lineBoundAt: '',
        memberSince: new Date().toISOString().split('T')[0],
        points: 100,
        addresses: [],
      }
      _saveUser(newUser)
      return { success: true }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('polar_user')
  }

  const updateProfile = (updates) => {
    const updated = { ...user, ...updates }
    return _saveUser(updated)
  }

  const changePassword = async (oldPassword) => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 600))
    setIsLoading(false)
    if (oldPassword.length < 6) {
      return { success: false, message: '舊密碼格式不正確' }
    }
    return { success: true }
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
        changePassword,
        isLoggedIn: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
