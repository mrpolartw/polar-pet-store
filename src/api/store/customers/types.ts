export interface StoreCustomerAddressRecord {
  id: string
  type: "home" | "711"
  label: string
  name: string
  phone: string
  city: string
  district: string
  address: string
  is_default: boolean
  store_name: string
  store_id: string
  created_at: string | null
  updated_at: string | null
}

export interface StoreCustomerAddressesResponse {
  items: StoreCustomerAddressRecord[]
  count: number
}

export interface StoreCustomerAddressResponse {
  address: StoreCustomerAddressRecord
}
