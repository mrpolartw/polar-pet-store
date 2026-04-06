import { useContext, useEffect } from 'react'
import { MemberContext } from '../context/MemberContext'

const useMemberContext = () => {
  const context = useContext(MemberContext)

  if (!context) {
    throw new Error('useMember 必須在 MemberProvider 內使用')
  }

  return context
}

export function useMember() {
  const context = useMemberContext()

  useEffect(() => {
    if (!context.isLoggedIn || context.loaded.member || context.loading.member) {
      return
    }

    context.fetchMember().catch(() => {})
  }, [context])

  return {
    member: context.member,
    loading: context.loading.member,
    error: context.error,
    refetch: context.fetchMember,
    updateMember: context.updateMember,
  }
}

export function useAddresses() {
  const context = useMemberContext()

  useEffect(() => {
    if (!context.isLoggedIn || context.loaded.addresses || context.loading.addresses) {
      return
    }

    context.fetchAddresses().catch(() => {})
  }, [context])

  return {
    addresses: context.addresses,
    loading: context.loading.addresses,
    error: context.error,
    refetch: context.fetchAddresses,
    add: context.createAddress,
    update: context.updateAddress,
    remove: context.deleteAddress,
  }
}

export function usePets() {
  const context = useMemberContext()

  useEffect(() => {
    if (!context.isLoggedIn || context.loaded.pets || context.loading.pets) {
      return
    }

    context.fetchPets().catch(() => {})
  }, [context])

  return {
    pets: context.pets,
    loading: context.loading.pets,
    error: context.error,
    refetch: context.fetchPets,
    add: context.createPet,
    update: context.updatePet,
    remove: context.deletePet,
  }
}

export function usePoints() {
  const context = useMemberContext()

  useEffect(() => {
    if (!context.isLoggedIn || context.loaded.points || context.loading.points) {
      return
    }

    context.fetchPoints().catch(() => {})
  }, [context])

  return {
    points: context.points,
    loading: context.loading.points,
    error: context.error,
    refetch: context.fetchPoints,
  }
}

export function useTiers() {
  const context = useMemberContext()

  useEffect(() => {
    if (context.loaded.tiers || context.loading.tiers) {
      return
    }

    context.fetchTiers().catch(() => {})
  }, [context])

  return {
    tiers: context.tiers,
    loading: context.loading.tiers,
    error: context.error,
    refetch: context.fetchTiers,
  }
}
