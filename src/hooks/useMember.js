import { useState, useEffect, useCallback } from 'react'
import {
  getMe,
  updateMe,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  getPets,
  createPet,
  updatePet,
  deletePet,
  getPoints,
  getTiers,
} from '../api/memberApi'

export function useMember() {
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchMember = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getMe()
      setMember(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMember()
  }, [fetchMember])

  const updateMember = useCallback(async (updates) => {
    setLoading(true)
    setError(null)

    try {
      const data = await updateMe(updates)
      setMember(data)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    member,
    loading,
    error,
    refetch: fetchMember,
    updateMember,
  }
}

export function useAddresses() {
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      setAddresses(await getAddresses())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  const add = useCallback(async (data) => {
    const row = await createAddress(data)
    setAddresses((prev) => {
      const next = row?.is_default || row?.isDefault
        ? prev.map((address) => ({ ...address, is_default: false, isDefault: false }))
        : prev

      return [...next, row]
    })
    return row
  }, [])

  const update = useCallback(async (id, data) => {
    const row = await updateAddress(id, data)
    setAddresses((prev) => prev.map((address) => {
      if (row?.is_default || row?.isDefault) {
        if (Number(address.id) === Number(row.id)) {
          return row
        }

        return { ...address, is_default: false, isDefault: false }
      }

      return Number(address.id) === Number(row.id) ? row : address
    }))
    return row
  }, [])

  const remove = useCallback(async (id) => {
    await deleteAddress(id)
    setAddresses((prev) => prev.filter((address) => Number(address.id) !== Number(id)))
  }, [])

  return {
    addresses,
    loading,
    error,
    refetch: fetch,
    add,
    update,
    remove,
  }
}

export function usePets() {
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      setPets(await getPets())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  const add = useCallback(async (data) => {
    const row = await createPet(data)
    setPets((prev) => [...prev, row])
    return row
  }, [])

  const update = useCallback(async (id, data) => {
    const row = await updatePet(id, data)
    setPets((prev) => prev.map((pet) => (
      Number(pet.id) === Number(row.id) ? row : pet
    )))
    return row
  }, [])

  const remove = useCallback(async (id) => {
    await deletePet(id)
    setPets((prev) => prev.filter((pet) => Number(pet.id) !== Number(id)))
  }, [])

  return {
    pets,
    loading,
    error,
    refetch: fetch,
    add,
    update,
    remove,
  }
}

export function usePoints() {
  const [points, setPoints] = useState({ balance: 0, lifetime: 0, logs: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      setPoints(await getPoints())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  return {
    points,
    loading,
    error,
    refetch: fetch,
  }
}

export function useTiers() {
  const [tiers, setTiers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      setTiers(await getTiers())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  return {
    tiers,
    loading,
    error,
  }
}
