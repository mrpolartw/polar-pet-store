import React, { createContext, useCallback, useEffect, useState } from 'react'

import authService from '../services/authService'
import membershipService from '../services/membershipService'
import { buildEmptyMembershipSummary } from '../modules/membership/utils'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [membershipSummary, setMembershipSummary] = useState(
    buildEmptyMembershipSummary()
  )
  const [isMembershipLoading, setIsMembershipLoading] = useState(false)
  const [membershipError, setMembershipError] = useState('')

  const clearMembership = useCallback(() => {
    setMembershipSummary(buildEmptyMembershipSummary())
    setMembershipError('')
    setIsMembershipLoading(false)
  }, [])

  const refreshMembership = useCallback(async (nextUser = user) => {
    if (!nextUser?.id) {
      clearMembership()
      return buildEmptyMembershipSummary()
    }

    setIsMembershipLoading(true)
    setMembershipError('')

    try {
      const summary = await membershipService.getCustomerMembershipSummary()
      setMembershipSummary(summary)
      return summary
    } catch (err) {
      const message = err?.message ?? '會員資料載入失敗，請稍後再試'
      setMembershipError(message)
      const fallback = buildEmptyMembershipSummary(nextUser.id)
      setMembershipSummary(fallback)
      return fallback
    } finally {
      setIsMembershipLoading(false)
    }
  }, [clearMembership, user])

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

  useEffect(() => {
    if (!user?.id) {
      clearMembership()
      return undefined
    }

    let isCancelled = false

    const loadMembership = async () => {
      setIsMembershipLoading(true)
      setMembershipError('')

      try {
        const summary = await membershipService.getCustomerMembershipSummary()

        if (!isCancelled) {
          setMembershipSummary(summary)
        }
      } catch (err) {
        if (!isCancelled) {
          setMembershipSummary(buildEmptyMembershipSummary(user.id))
          setMembershipError(err?.message ?? '會員資料載入失敗，請稍後再試')
        }
      } finally {
        if (!isCancelled) {
          setIsMembershipLoading(false)
        }
      }
    }

    loadMembership()

    return () => {
      isCancelled = true
    }
  }, [clearMembership, user?.id])

  const login = useCallback(async (email, password) => {
    setIsLoading(true)
    setAuthError('')

    try {
      const data = await authService.login(email, password)
      const nextUser = data?.customer ?? data ?? null

      if (!nextUser) {
        throw new Error('登入成功，但未取得會員資料')
      }

      setUser(nextUser)
      await refreshMembership(nextUser)
      return { success: true }
    } catch (err) {
      const message = err?.message ?? '登入失敗，請稍後再試'
      setAuthError(message)
      return { success: false, message }
    } finally {
      setIsLoading(false)
    }
  }, [refreshMembership])

  const register = useCallback(async (userData) => {
    setIsLoading(true)
    setAuthError('')

    try {
      const data = await authService.register(userData)
      const nextUser = data?.customer ?? data ?? null

      if (!nextUser) {
        throw new Error('註冊成功，但未取得會員資料')
      }

      setUser(nextUser)
      await refreshMembership(nextUser)
      return { success: true }
    } catch (err) {
      const message = err?.message ?? '註冊失敗，請稍後再試'
      setAuthError(message)
      return { success: false, message }
    } finally {
      setIsLoading(false)
    }
  }, [refreshMembership])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      // logout failure should not block local sign-out
    } finally {
      setUser(null)
      setAuthError('')
      clearMembership()
    }
  }, [clearMembership])

  const updateProfile = useCallback(async (updates) => {
    setIsLoading(true)

    try {
      const data = await authService.updateProfile(updates)
      const updated = data?.customer ?? data ?? updates
      setUser((prev) => ({ ...prev, ...updated }))
      await refreshMembership({
        ...(user ?? {}),
        ...(updated ?? {}),
      })
      return { success: true }
    } catch (err) {
      return {
        success: false,
        message: err?.message ?? '資料更新失敗，請稍後再試',
      }
    } finally {
      setIsLoading(false)
    }
  }, [refreshMembership, user])

  const changePassword = useCallback(async (oldPassword, newPassword) => {
    setIsLoading(true)

    try {
      await authService.changePassword(oldPassword, newPassword)
      return { success: true }
    } catch (err) {
      return {
        success: false,
        message: err?.message ?? '密碼更新失敗，請稍後再試',
      }
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
        membershipSummary,
        isMembershipLoading,
        membershipError,
        refreshMembership,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
