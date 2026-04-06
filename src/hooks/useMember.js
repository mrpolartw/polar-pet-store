import { useContext, useEffect } from 'react'
import { MemberContext } from '../context/MemberContext'

const useMemberContext = () => {
  const context = useContext(MemberContext)

  if (!context) {
    throw new Error('useMember must be used within MemberProvider.')
  }

  return context
}

export function useMember() {
  const context = useMemberContext()
  const { isLoggedIn, loaded, loading, fetchMember } = context

  useEffect(() => {
    if (!isLoggedIn || loaded.member || loading.member) {
      return
    }

    fetchMember().catch(() => {})
  }, [isLoggedIn, loaded.member, loading.member, fetchMember])

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
  const { isLoggedIn, loaded, loading, fetchAddresses } = context

  useEffect(() => {
    if (!isLoggedIn || loaded.addresses || loading.addresses) {
      return
    }

    fetchAddresses().catch(() => {})
  }, [isLoggedIn, loaded.addresses, loading.addresses, fetchAddresses])

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
  const { isLoggedIn, loaded, loading, fetchPets } = context

  useEffect(() => {
    if (!isLoggedIn || loaded.pets || loading.pets) {
      return
    }

    fetchPets().catch(() => {})
  }, [isLoggedIn, loaded.pets, loading.pets, fetchPets])

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
  const { isLoggedIn, loaded, loading, fetchPoints } = context

  useEffect(() => {
    if (!isLoggedIn || loaded.points || loading.points) {
      return
    }

    fetchPoints().catch(() => {})
  }, [isLoggedIn, loaded.points, loading.points, fetchPoints])

  return {
    points: context.points,
    loading: context.loading.points,
    error: context.error,
    refetch: context.fetchPoints,
  }
}

export function useTiers() {
  const context = useMemberContext()
  const { loaded, loading, fetchTiers } = context

  useEffect(() => {
    if (loaded.tiers || loading.tiers) {
      return
    }

    fetchTiers().catch(() => {})
  }, [loaded.tiers, loading.tiers, fetchTiers])

  return {
    tiers: context.tiers,
    loading: context.loading.tiers,
    error: context.error,
    refetch: context.fetchTiers,
  }
}
