import type { StorefrontOrderResponse } from "../../../lib/storefront/storefront-orders"

export interface StoreCreateOrderResponse {
  order: StorefrontOrderResponse
}

export interface StoreListOrdersResponse {
  orders: StorefrontOrderResponse[]
  count: number
  offset: number
  limit: number
}
