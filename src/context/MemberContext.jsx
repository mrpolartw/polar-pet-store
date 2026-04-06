/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchMember as fetchMemberService,
  updateMember as updateMemberService,
  fetchAddresses as fetchAddressesService,
  createAddress as createAddressService,
  updateAddress as updateAddressService,
  deleteAddress as deleteAddressService,
  fetchPets as fetchPetsService,
  createPet as createPetService,
  updatePet as updatePetService,
  deletePet as deletePetService,
  fetchPoints as fetchPointsService,
  fetchTiers as fetchTiersService,
} from '../services/memberService'

const EMPTY_POINTS = { balance: 0, lifetime: 0, logs: [] }
const EMPTY_LOADING = {
  member: false,
  addresses: false,
  pets: false,
  points: false,
  tiers: false,
}
const EMPTY_LOADED = {
  member: false,
  addresses: false,
  pets: false,
  points: false,
  tiers: false,
}

export const MemberContext = createContext(null)

const createUnauthorizedError = () => {
  const error = new Error('請先登入會員帳號')
  error.status = 401
  return error
}

const isUnauthorizedError = (error) => error?.status === 401

export function MemberProvider({ children, auth }) {
  const { token, isLoggedIn, logout, syncUserFromMember } = auth
  const [member, setMember] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [pets, setPets] = useState([])
  const [points, setPoints] = useState(EMPTY_POINTS)
  const [tiers, setTiers] = useState([])
  const [loading, setLoading] = useState(EMPTY_LOADING)
  const [loaded, setLoaded] = useState(EMPTY_LOADED)
  const [error, setError] = useState(null)

  const setLoadingState = useCallback((key, value) => {
    setLoading((prev) => ({ ...prev, [key]: value }))
  }, [])

  const setLoadedState = useCallback((key, value) => {
    setLoaded((prev) => ({ ...prev, [key]: value }))
  }, [])

  const clearPrivateState = useCallback(() => {
    setMember(null)
    setAddresses([])
    setPets([])
    setPoints(EMPTY_POINTS)
    setError(null)
    setLoading((prev) => ({
      ...prev,
      member: false,
      addresses: false,
      pets: false,
      points: false,
    }))
    setLoaded((prev) => ({
      ...prev,
      member: false,
      addresses: false,
      pets: false,
      points: false,
    }))
  }, [])

  const handleError = useCallback(async (nextError) => {
    setError(nextError?.message || '資料讀取失敗')

    if (isUnauthorizedError(nextError)) {
      await logout()

      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }

    throw nextError
  }, [logout])

  const ensureToken = useCallback(() => {
    if (!token) {
      throw createUnauthorizedError()
    }

    return token
  }, [token])

  useEffect(() => {
    if (!isLoggedIn) {
      clearPrivateState()
    }
  }, [clearPrivateState, isLoggedIn])

  const fetchMember = useCallback(async () => {
    const token = ensureToken()
    setLoadingState('member', true)
    setError(null)

    try {
      const nextMember = await fetchMemberService(token)
      setMember(nextMember)
      setLoadedState('member', true)
      syncUserFromMember(nextMember)
      return nextMember
    } catch (nextError) {
      setLoadedState('member', true)
      return handleError(nextError)
    } finally {
      setLoadingState('member', false)
    }
  }, [ensureToken, handleError, setLoadedState, setLoadingState, syncUserFromMember])

  const updateMember = useCallback(async (updates) => {
    const token = ensureToken()
    setLoadingState('member', true)
    setError(null)

    try {
      const nextMember = await updateMemberService(token, updates)
      setMember(nextMember)
      setLoadedState('member', true)
      syncUserFromMember(nextMember)
      return nextMember
    } catch (nextError) {
      return handleError(nextError)
    } finally {
      setLoadingState('member', false)
    }
  }, [ensureToken, handleError, setLoadedState, setLoadingState, syncUserFromMember])

  const fetchAddresses = useCallback(async () => {
    const token = ensureToken()
    setLoadingState('addresses', true)
    setError(null)

    try {
      const nextAddresses = await fetchAddressesService(token)
      setAddresses(nextAddresses)
      setLoadedState('addresses', true)
      return nextAddresses
    } catch (nextError) {
      setLoadedState('addresses', true)
      return handleError(nextError)
    } finally {
      setLoadingState('addresses', false)
    }
  }, [ensureToken, handleError, setLoadedState, setLoadingState])

  const createAddress = useCallback(async (data) => {
    const token = ensureToken()
    setLoadingState('addresses', true)
    setError(null)

    try {
      const createdAddress = await createAddressService(token, data)
      const nextAddresses = await fetchAddressesService(token)
      setAddresses(nextAddresses)
      setLoadedState('addresses', true)
      return createdAddress
    } catch (nextError) {
      return handleError(nextError)
    } finally {
      setLoadingState('addresses', false)
    }
  }, [ensureToken, handleError, setLoadedState, setLoadingState])

  const updateAddress = useCallback(async (id, data) => {
    const token = ensureToken()
    setLoadingState('addresses', true)
    setError(null)

    try {
      const updatedAddress = await updateAddressService(token, id, data)
      const nextAddresses = await fetchAddressesService(token)
      setAddresses(nextAddresses)
      setLoadedState('addresses', true)
      return updatedAddress
    } catch (nextError) {
      return handleError(nextError)
    } finally {
      setLoadingState('addresses', false)
    }
  }, [ensureToken, handleError, setLoadedState, setLoadingState])

  const deleteAddress = useCallback(async (id) => {
    const token = ensureToken()
    setLoadingState('addresses', true)
    setError(null)

    try {
      await deleteAddressService(token, id)
      const nextAddresses = await fetchAddressesService(token)
      setAddresses(nextAddresses)
      setLoadedState('addresses', true)
      return true
    } catch (nextError) {
      return handleError(nextError)
    } finally {
      setLoadingState('addresses', false)
    }
  }, [ensureToken, handleError, setLoadedState, setLoadingState])

  const fetchPets = useCallback(async () => {
    const token = ensureToken()
    setLoadingState('pets', true)
    setError(null)

    try {
      const nextPets = await fetchPetsService(token)
      setPets(nextPets)
      setLoadedState('pets', true)
      return nextPets
    } catch (nextError) {
      setLoadedState('pets', true)
      return handleError(nextError)
    } finally {
      setLoadingState('pets', false)
    }
  }, [ensureToken, handleError, setLoadedState, setLoadingState])

  const createPet = useCallback(async (data) => {
    const token = ensureToken()
    setLoadingState('pets', true)
    setError(null)

    try {
      const createdPet = await createPetService(token, data)
      const nextPets = await fetchPetsService(token)
      setPets(nextPets)
      setLoadedState('pets', true)
      return createdPet
    } catch (nextError) {
      return handleError(nextError)
    } finally {
      setLoadingState('pets', false)
    }
  }, [ensureToken, handleError, setLoadedState, setLoadingState])

  const updatePet = useCallback(async (id, data) => {
    const token = ensureToken()
    setLoadingState('pets', true)
    setError(null)

    try {
      const updatedPet = await updatePetService(token, id, data)
      const nextPets = await fetchPetsService(token)
      setPets(nextPets)
      setLoadedState('pets', true)
      return updatedPet
    } catch (nextError) {
      return handleError(nextError)
    } finally {
      setLoadingState('pets', false)
    }
  }, [ensureToken, handleError, setLoadedState, setLoadingState])

  const deletePet = useCallback(async (id) => {
    const token = ensureToken()
    setLoadingState('pets', true)
    setError(null)

    try {
      await deletePetService(token, id)
      const nextPets = await fetchPetsService(token)
      setPets(nextPets)
      setLoadedState('pets', true)
      return true
    } catch (nextError) {
      return handleError(nextError)
    } finally {
      setLoadingState('pets', false)
    }
  }, [ensureToken, handleError, setLoadedState, setLoadingState])

  const fetchPoints = useCallback(async () => {
    const token = ensureToken()
    setLoadingState('points', true)
    setError(null)

    try {
      const nextPoints = await fetchPointsService(token)
      setPoints(nextPoints)
      setLoadedState('points', true)
      return nextPoints
    } catch (nextError) {
      setLoadedState('points', true)
      return handleError(nextError)
    } finally {
      setLoadingState('points', false)
    }
  }, [ensureToken, handleError, setLoadedState, setLoadingState])

  const fetchTiers = useCallback(async (currentTierKey = member?.tier_key || '') => {
    setLoadingState('tiers', true)

    try {
      const nextTiers = await fetchTiersService(currentTierKey)
      setTiers(nextTiers)
      setLoadedState('tiers', true)
      return nextTiers
    } catch (nextError) {
      setLoadedState('tiers', true)
      setError(nextError?.message || '等級資料讀取失敗')
      throw nextError
    } finally {
      setLoadingState('tiers', false)
    }
  }, [member?.tier_key, setLoadedState, setLoadingState])

  const resetForLogout = useCallback(() => {
    clearPrivateState()
  }, [clearPrivateState])

  const value = useMemo(() => ({
    member,
    addresses,
    pets,
    points,
    tiers,
    loading,
    loaded,
    isLoading: Object.values(loading).some(Boolean),
    error,
    isLoggedIn,
    fetchMember,
    updateMember,
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    fetchPets,
    createPet,
    updatePet,
    deletePet,
    fetchPoints,
    fetchTiers,
    resetForLogout,
  }), [
    member,
    addresses,
    pets,
    points,
    tiers,
    loading,
    loaded,
    error,
    isLoggedIn,
    fetchMember,
    updateMember,
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    fetchPets,
    createPet,
    updatePet,
    deletePet,
    fetchPoints,
    fetchTiers,
    resetForLogout,
  ])

  return (
    <MemberContext.Provider value={value}>
      {children}
    </MemberContext.Provider>
  )
}
