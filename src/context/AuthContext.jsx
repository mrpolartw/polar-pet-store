import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { buildEmptyMembershipSummary } from '../modules/membership/utils'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [membershipSummary, setMembershipSummary] = useState(
    buildEmptyMembershipSummary()
  )
  const [isMembershipLoading] = useState(false)
  const [membershipError] = useState('')
  const [authStatus, setAuthStatus] = useState(null)

  const refreshMembership = useCallback(async () => {
    return buildEmptyMembershipSummary()
  }, [])

  const refreshAuthStatus = useCallback(async () => {
    return authStatus
  }, [authStatus])

  const login = useCallback(async (email) => {
    setIsLoading(true)
    setAuthError('')

    try {
      const mockUser = {
        id: 'mock-user-001',
        email,
        name: '測試會員',
        first_name: '測試',
        last_name: '會員',
      }
      setUser(mockUser)
      setAuthStatus({ email_verified: true })
      setMembershipSummary(buildEmptyMembershipSummary(mockUser.id))
      return { success: true, user: mockUser }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async () => {
    setIsLoading(true)
    setAuthError('')

    try {
      return { success: true }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setUser(null)
    setAuthStatus(null)
    setAuthError('')
    setMembershipSummary(buildEmptyMembershipSummary())
  }, [])

  const updateProfile = useCallback(async (updates) => {
    setIsLoading(true)

    try {
      setUser((prev) => (prev ? { ...prev, ...updates } : prev))
      return { success: true }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const changePassword = useCallback(async () => {
    setIsLoading(true)

    try {
      return { success: true }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reloadSession = useCallback(async () => {
    return user
  }, [user])

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
