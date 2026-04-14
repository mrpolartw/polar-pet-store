import { MedusaError } from "@medusajs/framework/utils"
import type {
  CreateCustomerAddressDTO,
  CustomerAddressDTO,
  UpdateCustomerAddressDTO,
} from "@medusajs/framework/types"

type StoreCustomerAddressPayload = {
  type: "home" | "711"
  label?: string | null
  name: string
  phone: string
  city?: string | null
  district?: string | null
  address?: string | null
  is_default?: boolean
  store_name?: string | null
  store_id?: string | null
}

type StoreCustomerAddressMetadata = {
  type?: "home" | "711"
  label?: string | null
  district?: string | null
  store_name?: string | null
  store_id?: string | null
}

function splitDisplayName(name: string): { first_name: string; last_name: string } {
  const trimmed = name.trim()

  if (!trimmed) {
    return {
      first_name: "",
      last_name: "",
    }
  }

  const [firstName, ...rest] = trimmed.split(/\s+/)

  return {
    first_name: firstName,
    last_name: rest.join(" "),
  }
}

function getAddressMetadata(
  metadata: Record<string, unknown> | null | undefined
): StoreCustomerAddressMetadata {
  if (!metadata || Array.isArray(metadata)) {
    return {}
  }

  return {
    type:
      metadata.type === "711" || metadata.type === "home"
        ? metadata.type
        : "home",
    label: typeof metadata.label === "string" ? metadata.label : null,
    district: typeof metadata.district === "string" ? metadata.district : null,
    store_name:
      typeof metadata.store_name === "string" ? metadata.store_name : null,
    store_id: typeof metadata.store_id === "string" ? metadata.store_id : null,
  }
}

export function normalizeStoreCustomerAddressPayload(input: {
  customerId: string
  payload: StoreCustomerAddressPayload
}): CreateCustomerAddressDTO {
  const payload = input.payload
  const { first_name, last_name } = splitDisplayName(payload.name)
  const type = payload.type

  return {
    customer_id: input.customerId,
    address_name: payload.label?.trim() || (type === "711" ? "7-11 取貨地址" : "常用地址"),
    first_name: first_name || null,
    last_name: last_name || null,
    phone: payload.phone.trim(),
    city: type === "home" ? payload.city?.trim() || null : null,
    province: type === "home" ? payload.district?.trim() || null : null,
    address_1:
      type === "home"
        ? payload.address?.trim() || null
        : payload.store_name?.trim() || null,
    country_code: "tw",
    is_default_shipping: Boolean(payload.is_default),
    is_default_billing: Boolean(payload.is_default),
    metadata: {
      type,
      label: payload.label?.trim() || null,
      district: type === "home" ? payload.district?.trim() || null : null,
      store_name: type === "711" ? payload.store_name?.trim() || null : null,
      store_id: type === "711" ? payload.store_id?.trim() || null : null,
    },
  }
}

export function normalizeStoreCustomerAddressUpdatePayload(
  payload: StoreCustomerAddressPayload
): UpdateCustomerAddressDTO {
  const { first_name, last_name } = splitDisplayName(payload.name)
  const type = payload.type

  return {
    address_name: payload.label?.trim() || (type === "711" ? "7-11 取貨地址" : "常用地址"),
    first_name: first_name || null,
    last_name: last_name || null,
    phone: payload.phone.trim(),
    city: type === "home" ? payload.city?.trim() || null : null,
    province: type === "home" ? payload.district?.trim() || null : null,
    address_1:
      type === "home"
        ? payload.address?.trim() || null
        : payload.store_name?.trim() || null,
    country_code: "tw",
    is_default_shipping: Boolean(payload.is_default),
    is_default_billing: Boolean(payload.is_default),
    metadata: {
      type,
      label: payload.label?.trim() || null,
      district: type === "home" ? payload.district?.trim() || null : null,
      store_name: type === "711" ? payload.store_name?.trim() || null : null,
      store_id: type === "711" ? payload.store_id?.trim() || null : null,
    },
  }
}

export function toStoreCustomerAddress(address: CustomerAddressDTO) {
  const metadata = getAddressMetadata(
    address.metadata as Record<string, unknown> | null | undefined
  )
  const displayName = [address.first_name, address.last_name]
    .filter(Boolean)
    .join(" ")
    .trim()

  return {
    id: address.id,
    type: metadata.type ?? "home",
    label: metadata.label ?? address.address_name ?? "",
    name: displayName,
    phone: address.phone ?? "",
    city: address.city ?? "",
    district: metadata.district ?? address.province ?? "",
    address: address.address_1 ?? "",
    is_default: Boolean(
      address.is_default_shipping || address.is_default_billing
    ),
    store_name: metadata.store_name ?? "",
    store_id: metadata.store_id ?? "",
    created_at: address.created_at ?? null,
    updated_at: address.updated_at ?? null,
  }
}

export async function ensureSingleDefaultAddress(input: {
  customerService: {
    listCustomerAddresses: (filters: Record<string, unknown>) => Promise<CustomerAddressDTO[]>
    updateCustomerAddresses: (
      selector: string | string[] | Record<string, unknown>,
      data: UpdateCustomerAddressDTO
    ) => Promise<CustomerAddressDTO | CustomerAddressDTO[]>
  }
  customerId: string
  nextDefault: boolean
  excludedAddressId?: string
}): Promise<void> {
  if (!input.nextDefault) {
    return
  }

  const addresses = await input.customerService.listCustomerAddresses({
    customer_id: input.customerId,
  })
  const targetIds = addresses
    .filter((address) => address.id !== input.excludedAddressId)
    .filter((address) => address.is_default_shipping || address.is_default_billing)
    .map((address) => address.id)

  if (!targetIds.length) {
    return
  }

  await input.customerService.updateCustomerAddresses(targetIds, {
    is_default_shipping: false,
    is_default_billing: false,
  })
}

export function assertAddressOwnership(
  address: CustomerAddressDTO | null | undefined,
  customerId: string
): asserts address is CustomerAddressDTO {
  if (!address || address.customer_id !== customerId) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "找不到對應的會員地址"
    )
  }
}
