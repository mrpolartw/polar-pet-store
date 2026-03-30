import { createContext, useCallback, useEffect, useState } from 'react'

import { sdk } from '../lib/medusa'

const AuthContext = createContext(null)
const LOGGED_IN_STORAGE_KEY = 'polar_logged_in'

function splitName(name = '') {
  const trimmedName = String(name || '').trim()

  if (!trimmedName) {
    return { firstName: '', lastName: '' }
  }

  const parts = trimmedName.split(/\s+/)

  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  }
}

function getMetadataValue(metadata, ...keys) {
  for (const key of keys) {
    if (metadata?.[key] !== undefined) {
      return metadata[key]
    }
  }

  return undefined
}

function mapAddress(address) {
  const metadata = address?.metadata || {}
  const isStorePickup = metadata.type === '711' || Boolean(metadata.store_name || metadata.store_id)

  return {
    id: address.id,
    type: isStorePickup ? '711' : 'home',
    label: metadata.label || (isStorePickup ? '超商取貨' : '住家'),
    name: [address.first_name, address.last_name].filter(Boolean).join(' ').trim(),
    phone: address.phone || '',
    city: address.city || '',
    district: address.province || '',
    address: [address.address_1, address.address_2].filter(Boolean).join(' ').trim(),
    isDefault: Boolean(address.is_default_shipping),
    storeName: metadata.store_name || '',
    storeId: metadata.store_id || '',
    metadata,
  }
}

function mapMedusaCustomer(customer) {
  const metadata = customer?.metadata || {}

  return {
    id: customer.id,
    name:
      [customer.first_name, customer.last_name].filter(Boolean).join(' ').trim()
      || customer.email?.split('@')[0]
      || 'Polar Member',
    firstName: customer.first_name || '',
    lastName: customer.last_name || '',
    email: customer.email || '',
    phone: customer.phone || '',
    avatar: getMetadataValue(metadata, 'avatar') || null,
    birthday: getMetadataValue(metadata, 'birthday') || '',
    gender: getMetadataValue(metadata, 'gender') || '',
    lineLinked: Boolean(getMetadataValue(metadata, 'line_linked', 'lineLinked')),
    lineDisplayName: getMetadataValue(metadata, 'line_display_name', 'lineDisplayName') || '',
    lineBoundAt: getMetadataValue(metadata, 'line_bound_at', 'lineBoundAt') || '',
    memberSince: customer.created_at?.split('T')[0] || '',
    points: Number(getMetadataValue(metadata, 'points') || 0),
    pets: getMetadataValue(metadata, 'pets') || [],
    addresses: Array.isArray(customer.addresses) ? customer.addresses.map(mapAddress) : [],
    metadata,
  }
}

function buildProfileUpdatePayload(updates, currentMetadata = {}) {
  const payload = {}
  const metadata = { ...currentMetadata }

  if (updates.name !== undefined) {
    const { firstName, lastName } = splitName(updates.name)
    payload.first_name = firstName
    payload.last_name = lastName
  }

  if (updates.firstName !== undefined) payload.first_name = updates.firstName
  if (updates.lastName !== undefined) payload.last_name = updates.lastName
  if (updates.phone !== undefined) payload.phone = updates.phone

  if (updates.avatar !== undefined) metadata.avatar = updates.avatar
  if (updates.birthday !== undefined) metadata.birthday = updates.birthday
  if (updates.gender !== undefined) metadata.gender = updates.gender
  if (updates.lineLinked !== undefined) metadata.line_linked = updates.lineLinked
  if (updates.lineDisplayName !== undefined) metadata.line_display_name = updates.lineDisplayName
  if (updates.lineBoundAt !== undefined) metadata.line_bound_at = updates.lineBoundAt

  payload.metadata = metadata

  return payload
}

function buildAddressPayload(address) {
  const isStorePickup = address.type === '711'
  const { firstName, lastName } = splitName(address.name)

  return {
    first_name: firstName,
    last_name: lastName,
    phone: address.phone || '',
    address_1: isStorePickup ? '超商取貨' : address.address || '',
    address_2: isStorePickup ? address.storeName || '' : '',
    city: isStorePickup ? '' : address.city || '',
    province: isStorePickup ? '' : address.district || '',
    country_code: 'tw',
    postal_code: '000',
    is_default_shipping: Boolean(address.isDefault),
    metadata: {
      label: address.label || (isStorePickup ? '超商取貨' : '住家'),
      type: isStorePickup ? '711' : 'home',
      store_name: address.storeName || '',
      store_id: address.storeId || '',
    },
  }
}

async function retrieveCurrentCustomer() {
  const { customer } = await sdk.store.customer.retrieve({
    fields: '*addresses',
  })

  return customer ? mapMedusaCustomer(customer) : null
}

async function retrieveCurrentMembership() {
  return sdk.client.fetch('/store/me/membership', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [membership, setMembership] = useState(null)
  const [membershipLoading, setMembershipLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  const refreshMembership = useCallback(async () => {
    setMembershipLoading(true)

    try {
      const nextMembership = await retrieveCurrentMembership()
      setMembership(nextMembership || null)
      return nextMembership || null
    } catch (error) {
      if (error?.status !== 401) {
        console.error('Retrieve membership error:', error)
      }

      setMembership(null)
      return null
    } finally {
      setMembershipLoading(false)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    const nextUser = await retrieveCurrentCustomer()
    setUser(nextUser)

    if (nextUser) {
      await refreshMembership()
    } else {
      setMembership(null)
      setMembershipLoading(false)
    }

    return nextUser
  }, [refreshMembership])

  useEffect(() => {
    let isMounted = true

    const hydrateUser = async () => {
      const wasLoggedIn = localStorage.getItem(LOGGED_IN_STORAGE_KEY) === '1'

      if (!wasLoggedIn) {
        setMembership(null)
        setMembershipLoading(false)
        setIsLoading(false)
        return
      }

      try {
        const nextUser = await retrieveCurrentCustomer()

        if (!isMounted) return

        setUser(nextUser)

        if (nextUser) {
          try {
            const nextMembership = await retrieveCurrentMembership()

            if (!isMounted) return

            setMembership(nextMembership || null)
          } catch (error) {
            if (error?.status !== 401) {
              console.error('Retrieve membership error:', error)
            }

            if (!isMounted) return

            setMembership(null)
          }
        } else {
          setMembership(null)
        }
      } catch (error) {
        localStorage.removeItem(LOGGED_IN_STORAGE_KEY)

        if (!isMounted) return

        setUser(null)
        setMembership(null)
      } finally {
        if (isMounted) {
          setMembershipLoading(false)
          setIsLoading(false)
        }
      }
    }

    hydrateUser()

    return () => {
      isMounted = false
    }
  }, [])

  const login = useCallback(
    async (email, password) => {
      setIsLoading(true)
      setAuthError('')

      try {
        const token = await sdk.auth.login('customer', 'emailpass', { email, password })

        if (typeof token !== 'string') {
          setAuthError('登入流程需要額外驗證，請稍後再試。')
          return { success: false }
        }

        const nextUser = await refreshUser()

        if (!nextUser) {
          throw new Error('登入成功，但無法取得會員資料。')
        }

        localStorage.setItem(LOGGED_IN_STORAGE_KEY, '1')
        return { success: true }
      } catch (error) {
        console.error('Login error:', error)
        setAuthError(error?.message || '登入失敗，請確認帳號密碼後再試。')
        return { success: false }
      } finally {
        setIsLoading(false)
      }
    },
    [refreshUser],
  )

  const register = useCallback(
    async (userData) => {
      setIsLoading(true)
      setAuthError('')

      try {
        const { email, password, name, phone } = userData
        const { firstName, lastName } = splitName(name)
        const registrationToken = await sdk.auth.register('customer', 'emailpass', { email, password })

        await sdk.store.customer.create(
          {
            email,
            first_name: firstName,
            last_name: lastName,
            phone: phone || '',
            metadata: {
              points: 0,
              pets: [],
            },
          },
          {},
          registrationToken
            ? { Authorization: `Bearer ${registrationToken}` }
            : undefined,
        )

        const loginResult = await sdk.auth.login('customer', 'emailpass', { email, password })

        if (typeof loginResult !== 'string') {
          throw new Error('註冊成功，但登入流程需要額外驗證。')
        }

        await refreshUser()
        localStorage.setItem(LOGGED_IN_STORAGE_KEY, '1')

        return { success: true }
      } catch (error) {
        console.error('Register error:', error)
        setAuthError(error?.message || '註冊失敗，請稍後再試。')
        return { success: false }
      } finally {
        setIsLoading(false)
      }
    },
    [refreshUser],
  )

  const logout = useCallback(async () => {
    try {
      await sdk.auth.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem(LOGGED_IN_STORAGE_KEY)
      setUser(null)
      setMembership(null)
      setMembershipLoading(false)
      setAuthError('')
    }
  }, [])

  const updateProfile = useCallback(
    async (updates) => {
      setIsLoading(true)

      try {
        const payload = buildProfileUpdatePayload(updates, user?.metadata || {})
        const { customer } = await sdk.store.customer.update(payload, {
          fields: '*addresses',
        })

        setUser(mapMedusaCustomer(customer))
        return { success: true }
      } catch (error) {
        console.error('Update profile error:', error)
        return { success: false, message: error?.message || '更新會員資料失敗。' }
      } finally {
        setIsLoading(false)
      }
    },
    [user?.metadata],
  )

  const updatePets = useCallback(
    async (newPets) => {
      setIsLoading(true)

      try {
        const { customer } = await sdk.store.customer.update(
          {
            metadata: {
              ...(user?.metadata || {}),
              pets: newPets,
            },
          },
          {
            fields: '*addresses',
          },
        )

        setUser(mapMedusaCustomer(customer))
        return { success: true }
      } catch (error) {
        console.error('Update pets error:', error)
        return { success: false, message: error?.message || '更新毛孩資料失敗。' }
      } finally {
        setIsLoading(false)
      }
    },
    [user?.metadata],
  )

  const changePassword = useCallback(async (oldPassword, newPassword) => {
    setIsLoading(true)

    try {
      await sdk.client.fetch('/store/customers/me/password', {
        method: 'POST',
        body: {
          current_password: oldPassword,
          new_password: newPassword,
        },
      })

      return { success: true }
    } catch (error) {
      console.error('Change password error:', error)
      return { success: false, message: error?.message || '更新密碼失敗。' }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createAddress = useCallback(
    async (address) => {
      setIsLoading(true)

      try {
        await sdk.store.customer.createAddress(buildAddressPayload(address))
        await refreshUser()
        return { success: true }
      } catch (error) {
        console.error('Create address error:', error)
        return { success: false, message: error?.message || '新增地址失敗。' }
      } finally {
        setIsLoading(false)
      }
    },
    [refreshUser],
  )

  const updateAddress = useCallback(
    async (addressId, address) => {
      setIsLoading(true)

      try {
        await sdk.store.customer.updateAddress(addressId, buildAddressPayload(address))
        await refreshUser()
        return { success: true }
      } catch (error) {
        console.error('Update address error:', error)
        return { success: false, message: error?.message || '更新地址失敗。' }
      } finally {
        setIsLoading(false)
      }
    },
    [refreshUser],
  )

  const deleteAddress = useCallback(
    async (addressId) => {
      setIsLoading(true)

      try {
        await sdk.store.customer.deleteAddress(addressId)
        await refreshUser()
        return { success: true }
      } catch (error) {
        console.error('Delete address error:', error)
        return { success: false, message: error?.message || '刪除地址失敗。' }
      } finally {
        setIsLoading(false)
      }
    },
    [refreshUser],
  )

  const setDefaultAddress = useCallback(
    async (addressId) => {
      if (!user?.addresses?.length) {
        return { success: false, message: '找不到可設定的地址。' }
      }

      setIsLoading(true)

      try {
        const updates = user.addresses
          .filter((address) => address.isDefault !== (address.id === addressId))
          .map((address) =>
            sdk.store.customer.updateAddress(
              address.id,
              buildAddressPayload({
                ...address,
                isDefault: address.id === addressId,
              }),
            ),
          )

        await Promise.all(updates)
        await refreshUser()

        return { success: true }
      } catch (error) {
        console.error('Set default address error:', error)
        return { success: false, message: error?.message || '設定預設地址失敗。' }
      } finally {
        setIsLoading(false)
      }
    },
    [refreshUser, user?.addresses],
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        membership,
        membershipLoading,
        isLoading,
        authError,
        setAuthError,
        login,
        register,
        logout,
        refreshUser,
        refreshMembership,
        updateProfile,
        updatePets,
        changePassword,
        createAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        isLoggedIn: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
