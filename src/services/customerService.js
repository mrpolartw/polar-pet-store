import apiClient from '../utils/apiClient'

function normalizeAddress(address) {
  return {
    id: address?.id ?? '',
    type: address?.type ?? 'home',
    label: address?.label ?? '',
    name: address?.name ?? '',
    phone: address?.phone ?? '',
    city: address?.city ?? '',
    district: address?.district ?? '',
    address: address?.address ?? '',
    isDefault: Boolean(address?.is_default),
    storeName: address?.store_name ?? '',
    storeId: address?.store_id ?? '',
    createdAt: address?.created_at ?? null,
    updatedAt: address?.updated_at ?? null,
  }
}

export const getAddresses = async () => {
  const data = await apiClient.get('/store/customers/me/addresses')

  return {
    addresses: Array.isArray(data?.items) ? data.items.map(normalizeAddress) : [],
    count: Number(data?.count ?? 0),
  }
}

export const createAddress = async (payload) => {
  const data = await apiClient.post('/store/customers/me/addresses', payload)

  return {
    address: normalizeAddress(data?.address),
  }
}

export const updateAddress = async (addressId, payload) => {
  const data = await apiClient.patch(
    `/store/customers/me/addresses/${addressId}`,
    payload
  )

  return {
    address: normalizeAddress(data?.address),
  }
}

export const deleteAddress = async (addressId) => {
  return apiClient.del(`/store/customers/me/addresses/${addressId}`)
}

const customerService = {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
}

export default customerService
