import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import authService from '../services/authService'
import {
  mapMemberToAuthUser,
  serializePet,
  updateMember as updateMemberService,
} from '../services/memberService'
import { MemberProvider } from './MemberContext'

const AuthContext = createContext(null)

const INVALID_LOGIN_MESSAGE = 'Email or password is incorrect.'
const GENERIC_LOGIN_MESSAGE = 'Unable to sign in right now.'
const GENERIC_REGISTER_MESSAGE = 'Unable to complete registration right now.'
const PROFILE_UPDATE_ERROR_MESSAGE = 'Unable to update profile.'
const PASSWORD_CHANGE_ERROR_MESSAGE = 'Unable to change password.'
const AUTH_REQUIRED_MESSAGE = 'Please sign in first.'

const STORAGE_TOKEN_KEY = 'mrpolar_auth_token'
const STORAGE_USER_KEY = 'mrpolar_auth_user'

const readSessionStorage = (key) => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

const writeSessionStorage = (key, value) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    if (value == null || value === '') {
      window.sessionStorage.removeItem(key)
      return
    }

    window.sessionStorage.setItem(key, value)
  } catch {
    // ignore session storage errors
  }
}

const readStoredToken = () => readSessionStorage(STORAGE_TOKEN_KEY)

const readStoredUser = () => {
  const raw = readSessionStorage(STORAGE_USER_KEY)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw)
  } catch {
    writeSessionStorage(STORAGE_USER_KEY, null)
    return null
  }
}

const createBasicUser = (payload = {}) => ({
  id: null,
  memberId: null,
  wpUserId: null,
  name: payload.user_display_name || payload.user_nicename || '',
  firstName: '',
  lastName: '',
  email: payload.user_email || '',
  phone: '',
  gender: '',
  birthday: '',
  avatar: '',
  points: 0,
  pointsLifetime: 0,
  yearlySpending: 0,
  totalSpending: 0,
  tierId: null,
  tierKey: '',
  tierName: '',
  tierColor: '',
  cashbackRate: 0,
  status: 'active',
  registeredAt: '',
  lineLinked: false,
  lineDisplayName: '',
  lineBoundAt: '',
  pets: [],
  addresses: [],
  member: null,
})

const normalizeRegisterPayload = (userData = {}) => {
  const displayName = String(userData.name || '').trim()
  const nameParts = displayName.split(/\s+/).filter(Boolean)
  const firstName = String(userData.firstName || nameParts[0] || '').trim()
  const lastName = String(userData.lastName || nameParts.slice(1).join(' ') || '').trim()

  return {
    email: String(userData.email || '').trim(),
    password: String(userData.password || ''),
    first_name: firstName,
    last_name: lastName,
    display_name: displayName,
    phone: String(userData.phone || '').trim(),
    gender: String(userData.gender || '').trim(),
    birthday: String(userData.birthday || '').trim(),
    pets: Array.isArray(userData.pets)
      ? userData.pets
        .map((pet) => serializePet(pet))
        .filter((pet) => pet.name || pet.type || pet.breed || pet.birthday)
      : [],
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readStoredUser())
  const [token, setToken] = useState(() => readStoredToken())
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    writeSessionStorage(STORAGE_TOKEN_KEY, token || null)
  }, [token])

  useEffect(() => {
    writeSessionStorage(
      STORAGE_USER_KEY,
      user ? JSON.stringify(user) : null
    )
  }, [user])

  useEffect(() => {
    let isMounted = true

    const validateCurrentToken = async () => {
      if (!token) {
        if (isMounted) {
          setIsLoading(false)
        }
        return
      }

      setIsLoading(true)

      try {
        await authService.validate(token)
      } catch {
        if (isMounted) {
          setToken(null)
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    validateCurrentToken()

    return () => {
      isMounted = false
    }
  }, [token])

  const syncUserFromMember = useCallback((member) => {
    if (!member) {
      return
    }

    setUser((previousUser) => mapMemberToAuthUser(member, previousUser || {}))
  }, [])

  const logout = useCallback(async () => {
    setToken(null)
    setUser(null)
    setAuthError('')
    await authService.logout()
    return { success: true }
  }, [])

  const login = useCallback(async (username, password) => {
    setIsLoading(true)
    setAuthError('')

    try {
      const result = await authService.login(username, password)

      if (!result?.token) {
        throw new Error(INVALID_LOGIN_MESSAGE)
      }

      setToken(result.token)
      setUser(createBasicUser(result))

      return { success: true }
    } catch (error) {
      const message = String(error?.message || '')
      const isInvalidCredentials = error?.status === 403
        || message.toLowerCase().includes('incorrect')
        || message.toLowerCase().includes('invalid')

      const nextMessage = isInvalidCredentials
        ? INVALID_LOGIN_MESSAGE
        : (message || GENERIC_LOGIN_MESSAGE)

      setToken(null)
      setUser(null)
      setAuthError(nextMessage)

      return {
        success: false,
        message: nextMessage,
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (userData) => {
    setIsLoading(true)
    setAuthError('')

    try {
      const payload = normalizeRegisterPayload(userData)

      await authService.register(payload)

      const loginResult = await authService.login(payload.email, payload.password)

      if (!loginResult?.token) {
        throw new Error('Registration succeeded but auto sign-in failed.')
      }

      setToken(loginResult.token)
      setUser(createBasicUser(loginResult))

      return { success: true }
    } catch (error) {
      const message = String(error?.message || '')
      const normalizedMessage = message.toLowerCase().includes('exists')
        ? 'This email is already registered.'
        : (message || GENERIC_REGISTER_MESSAGE)

      setAuthError(normalizedMessage)

      return {
        success: false,
        message: normalizedMessage,
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateProfile = useCallback(async (updates = {}) => {
    const localOnlyUpdates = {}
    const memberUpdates = {}

    if (Object.prototype.hasOwnProperty.call(updates, 'name')) {
      memberUpdates.name = updates.name
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'phone')) {
      memberUpdates.phone = updates.phone
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'gender')) {
      memberUpdates.gender = updates.gender
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'birthday')) {
      memberUpdates.birthday = updates.birthday
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'avatar_url') || Object.prototype.hasOwnProperty.call(updates, 'avatar')) {
      memberUpdates.avatar_url = updates.avatar_url ?? updates.avatar
    }

    ;['lineLinked', 'lineDisplayName', 'lineBoundAt'].forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(updates, field)) {
        localOnlyUpdates[field] = updates[field]
      }
    })

    setIsLoading(true)

    try {
      let nextUser = user ? { ...user } : createBasicUser({})

      if (token && Object.keys(memberUpdates).length > 0) {
        const nextMember = await updateMemberService(token, memberUpdates)
        nextUser = mapMemberToAuthUser(nextMember, nextUser)
      }

      if (Object.keys(localOnlyUpdates).length > 0) {
        nextUser = {
          ...nextUser,
          ...localOnlyUpdates,
        }
      }

      setUser(nextUser)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error?.message || PROFILE_UPDATE_ERROR_MESSAGE,
      }
    } finally {
      setIsLoading(false)
    }
  }, [token, user])

  const updatePets = useCallback(async (newPets) => {
    setUser((previousUser) => ({
      ...(previousUser || createBasicUser({})),
      pets: Array.isArray(newPets) ? newPets : [],
    }))

    return { success: true }
  }, [])

  const changePassword = useCallback(async (oldPassword, newPassword) => {
    if (!token) {
      return {
        success: false,
        message: AUTH_REQUIRED_MESSAGE,
      }
    }

    setIsLoading(true)

    try {
      await authService.changePassword(token, oldPassword, newPassword)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error?.message || PASSWORD_CHANGE_ERROR_MESSAGE,
      }
    } finally {
      setIsLoading(false)
    }
  }, [token])

  const value = useMemo(() => ({
    user,
    token,
    isLoading,
    authError,
    setAuthError,
    login,
    register,
    logout,
    updateProfile,
    updatePets,
    changePassword,
    isLoggedIn: Boolean(token),
  }), [
    user,
    token,
    isLoading,
    authError,
    login,
    register,
    logout,
    updateProfile,
    updatePets,
    changePassword,
  ])

  return (
    <AuthContext.Provider value={value}>
      <MemberProvider
        auth={{
          token,
          isLoggedIn: Boolean(token),
          logout,
          syncUserFromMember,
        }}
      >
        {children}
      </MemberProvider>
    </AuthContext.Provider>
  )
}

export { AuthContext }
