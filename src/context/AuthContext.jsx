import React, { createContext, useCallback, useEffect, useMemo, useState } from "react"

import authService from "../services/authService"
import membershipService from "../services/membershipService"
import { buildEmptyMembershipSummary } from "../modules/membership/utils"

const AuthContext = createContext(null)

function decorateCustomer(customer, authStatus) {
  if (!customer) {
    return null
  }

  return {
    ...customer,
    name:
      customer?.name ||
      `${customer?.first_name ?? ""} ${customer?.last_name ?? ""}`.trim() ||
      customer?.email ||
      "會員",
    emailVerified: Boolean(authStatus?.email_verified),
    emailVerifiedAt: authStatus?.email_verified_at ?? null,
    lineLinked: Boolean(authStatus?.line_linked),
    lineDisplayName: authStatus?.line_display_name ?? null,
    lineBoundAt: authStatus?.line_bound_at ?? null,
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState("")
  const [membershipSummary, setMembershipSummary] = useState(
    buildEmptyMembershipSummary()
  )
  const [isMembershipLoading, setIsMembershipLoading] = useState(false)
  const [membershipError, setMembershipError] = useState("")
  const [authStatus, setAuthStatus] = useState(null)

  const clearMembership = useCallback(() => {
    setMembershipSummary(buildEmptyMembershipSummary())
    setMembershipError("")
    setIsMembershipLoading(false)
  }, [])

  const refreshMembership = useCallback(
    async (nextUser = user) => {
      if (!nextUser?.id) {
        clearMembership()
        return buildEmptyMembershipSummary()
      }

      setIsMembershipLoading(true)
      setMembershipError("")

      try {
        const summary = await membershipService.getCustomerMembershipSummary()
        setMembershipSummary(summary)
        return summary
      } catch (err) {
        const message = err?.message ?? "會員資料讀取失敗，請稍後再試。"
        setMembershipError(message)
        const fallback = buildEmptyMembershipSummary(nextUser.id)
        setMembershipSummary(fallback)
        return fallback
      } finally {
        setIsMembershipLoading(false)
      }
    },
    [clearMembership, user]
  )

  const refreshAuthStatus = useCallback(async () => {
    try {
      const status = await authService.getAuthStatus()
      setAuthStatus(status)
      return status
    } catch {
      setAuthStatus(null)
      return null
    }
  }, [])

  const hydrateSession = useCallback(async () => {
    const currentCustomer = await authService.getMe()

    if (!currentCustomer?.id) {
      setUser(null)
      setAuthStatus(null)
      clearMembership()
      return null
    }

    const nextAuthStatus = await refreshAuthStatus()
    const nextUser = decorateCustomer(currentCustomer, nextAuthStatus)
    setUser(nextUser)
    return nextUser
  }, [clearMembership, refreshAuthStatus])

  useEffect(() => {
    let isMounted = true

    const checkSession = async () => {
      try {
        const nextUser = await hydrateSession()

        if (isMounted && nextUser?.id) {
          await refreshMembership(nextUser)
        }
      } catch {
        if (isMounted) {
          setUser(null)
          setAuthStatus(null)
          clearMembership()
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    checkSession()

    return () => {
      isMounted = false
    }
  }, [clearMembership, hydrateSession, refreshMembership])

  const login = useCallback(
    async (email, password) => {
      setIsLoading(true)
      setAuthError("")

      try {
        await authService.login(email, password)
        const nextUser = await hydrateSession()

        if (!nextUser) {
          throw new Error("登入成功，但讀取會員資料失敗。")
        }

        await refreshMembership(nextUser)
        return { success: true, user: nextUser }
      } catch (err) {
        const message = err?.body?.message ?? err?.message ?? "登入失敗，請稍後再試。"
        const code = err?.body?.code ?? null
        const nextEmail = err?.body?.email ?? email

        setAuthError(message)

        return {
          success: false,
          code,
          message,
          email: nextEmail,
        }
      } finally {
        setIsLoading(false)
      }
    },
    [hydrateSession, refreshMembership]
  )

  const register = useCallback(async (userData) => {
    setIsLoading(true)
    setAuthError("")

    try {
      const response = await authService.register(userData)
      return {
        success: true,
        ...response,
      }
    } catch (err) {
      const message = err?.body?.message ?? err?.message ?? "註冊失敗，請稍後再試。"
      setAuthError(message)
      return { success: false, message }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      // ignore logout failure and always clear local state
    } finally {
      setUser(null)
      setAuthStatus(null)
      setAuthError("")
      clearMembership()
    }
  }, [clearMembership])

  const updateProfile = useCallback(
    async (updates) => {
      setIsLoading(true)

      try {
        const current = await authService.updateProfile(updates)
        const nextUser = decorateCustomer(current, authStatus)
        setUser(nextUser)
        await refreshMembership(nextUser)
        return { success: true, customer: nextUser }
      } catch (err) {
        return {
          success: false,
          message: err?.body?.message ?? err?.message ?? "會員資料更新失敗，請稍後再試。",
        }
      } finally {
        setIsLoading(false)
      }
    },
    [authStatus, refreshMembership]
  )

  const changePassword = useCallback(async (oldPassword, newPassword) => {
    setIsLoading(true)

    try {
      await authService.changePassword(oldPassword, newPassword)
      return { success: true }
    } catch (err) {
      return {
        success: false,
        message: err?.body?.message ?? err?.message ?? "密碼更新失敗，請稍後再試。",
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reloadSession = useCallback(async () => {
    const nextUser = await hydrateSession()

    if (nextUser?.id) {
      await refreshMembership(nextUser)
    }

    return nextUser
  }, [hydrateSession, refreshMembership])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      authError,
      authStatus,
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
      refreshAuthStatus,
      reloadSession,
    }),
    [
      authError,
      authStatus,
      changePassword,
      isLoading,
      isMembershipLoading,
      login,
      logout,
      membershipError,
      membershipSummary,
      refreshAuthStatus,
      refreshMembership,
      register,
      reloadSession,
      updateProfile,
      user,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext }
