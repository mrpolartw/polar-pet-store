import React, { createContext, useCallback, useEffect, useState } from 'react'

import authService from '../services/authService'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
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

    checkSession()
  }, [])

  const login = useCallback(async (email, password) => {
    setIsLoading(true)
    setAuthError('')

    try {
      // TODO: [BACKEND] authService.login -> POST /store/auth
      const data = await authService.login(email, password)
      const nextUser = data?.customer ?? data ?? null

      if (!nextUser) {
        throw new Error('帳號或密碼錯誤，請重新確認')
      }

      setUser(nextUser)
      return { success: true }
    } catch (err) {
      const message = err?.message ?? '帳號或密碼錯誤，請重新確認'
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
      // TODO: [BACKEND] authService.register -> POST /store/customers
      const data = await authService.register(userData)
      const nextUser = data?.customer ?? data ?? null

      if (!nextUser) {
        throw new Error('註冊失敗，請稍後再試')
      }

      setUser(nextUser)
      return { success: true }
    } catch (err) {
      const message = err?.message ?? '註冊失敗，請稍後再試'
      setAuthError(message)
      return { success: false, message }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      // TODO: [BACKEND] authService.logout -> clear session
      await authService.logout()
    } catch {
      // logout failure should not block local sign-out
    } finally {
      setUser(null)
      setAuthError('')
    }
  }, [])

  const updateProfile = useCallback(async (updates) => {
    setIsLoading(true)

    try {
      // TODO: [BACKEND] authService.updateProfile -> POST /store/customers/me
      const data = await authService.updateProfile(updates)
      const updated = data?.customer ?? data ?? updates
      setUser((prev) => ({ ...prev, ...updated }))
      return { success: true }
    } catch (err) {
      return { success: false, message: err?.message ?? '個人資料更新失敗，請稍後再試' }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const changePassword = useCallback(async (oldPassword, newPassword) => {
    setIsLoading(true)

    try {
      // TODO: [BACKEND] authService.changePassword
      await authService.changePassword(oldPassword, newPassword)
      return { success: true }
    } catch (err) {
      return { success: false, message: err?.message ?? '密碼更新失敗，請確認舊密碼是否正確' }
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
