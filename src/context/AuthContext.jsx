import React, { createContext, useState, useEffect, useCallback } from 'react'

import authService from '../services/authService'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    const checkSession = async () => {
      try {
        // TODO: [BACKEND] 後端實作後，getMe() 會驗證現有 session/token
        // 目前 authService.getMe() 為 TODO placeholder，會 throw error
        // 所以 catch 到 error 時 setUser(null) 是正確行為
        const data = await authService.getMe()
        setUser(data?.customer ?? data ?? null)
      } catch {
        if (import.meta.env.DEV) {
          console.warn('[Auth] Session check failed (後端尚未實作，此為預期行為)')
        }
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  const login = useCallback(async (email, password) => {
    setIsLoading(true)
    setAuthError('')

    try {
      // TODO: [BACKEND] authService.login 需後端 POST /store/auth 實作
      const data = await authService.login(email, password)
      const nextUser = data?.customer ?? data ?? null

      if (!nextUser) {
        throw new Error('登入失敗，請稍後再試')
      }

      setUser(nextUser)
      return { success: true }
    } catch (err) {
      const message = err?.message || '登入失敗，請稍後再試'
      setAuthError(message)
      return { success: false, message }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (userData) => {
    setIsLoading(true)
    setAuthError('')

    try {
      // TODO: [BACKEND] authService.register 需後端 POST /store/customers 實作
      const data = await authService.register(userData)
      const nextUser = data?.customer ?? data ?? null

      if (!nextUser) {
        throw new Error('註冊失敗，請稍後再試')
      }

      setUser(nextUser)
      return { success: true }
    } catch (err) {
      const message = err?.message || '註冊失敗，請稍後再試'
      setAuthError(message)
      return { success: false, message }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      // TODO: [BACKEND] authService.logout 需後端清除 session
      await authService.logout()
    } catch {
      // logout 失敗仍清除前端狀態
    } finally {
      setUser(null)
      setAuthError('')
      // TODO: [AUTH] 清除 sessionStorage token（後端串接後補上）
    }
  }, [])

  const updateProfile = useCallback(async (updates) => {
    setIsLoading(true)

    try {
      // TODO: [BACKEND] authService.updateProfile 需後端 POST /store/customers/me 實作
      const data = await authService.updateProfile(updates)
      const updated = data?.customer ?? data ?? updates
      setUser(prev => ({ ...prev, ...updated }))
      return { success: true }
    } catch (err) {
      return { success: false, message: err?.message || '更新失敗，請稍後再試' }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const changePassword = useCallback(async (oldPassword, newPassword) => {
    setIsLoading(true)

    try {
      // TODO: [BACKEND] authService.changePassword 需後端實作
      await authService.changePassword(oldPassword, newPassword)
      return { success: true }
    } catch (err) {
      return { success: false, message: err?.message || '密碼變更失敗，請稍後再試' }
    } finally {
      setIsLoading(false)
    }
  }, [])

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
