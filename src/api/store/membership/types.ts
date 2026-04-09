import type { GraphResultSet } from "@medusajs/types"

export type MembershipLevelRecord =
  GraphResultSet<"membership_member_level">["data"][number]

export type PointLogRecord =
  GraphResultSet<"membership_point_log">["data"][number]

export type FavoriteRecord =
  GraphResultSet<"membership_favorite">["data"][number]

export type PetRecord = GraphResultSet<"membership_pet">["data"][number]

export type SubscriptionRecord =
  GraphResultSet<"membership_subscription">["data"][number]

export type CustomerMembershipGraph = GraphResultSet<"customer">["data"][number] & {
  membership_member_level?: MembershipLevelRecord | null
}

export type MembershipLevelSummary = Pick<
  MembershipLevelRecord,
  | "id"
  | "name"
  | "sort_order"
  | "reward_rate"
  | "birthday_reward_rate"
  | "upgrade_gift_points"
  | "upgrade_threshold"
  | "auto_upgrade"
  | "can_join_event"
>

export interface StoreCustomerMembershipResponse {
  customer_id: string
  current_level: MembershipLevelSummary | null
  points_balance: number
  available_points: number
  yearly_spent: number
  total_spent: number
  points_summary: MembershipPointsSummary
  recent_point_logs: PointLogRecord[]
}

export interface MembershipPointsSummary {
  total_points: number
  available_points: number
  expired_points: number
  redeemed_points: number
  refunded_points: number
}

export interface StoreCustomerPointsResponse {
  balance: number
  available_balance: number
  points_summary: MembershipPointsSummary
  logs: PointLogRecord[]
  count: number
  offset: number
  limit: number
}

export interface MembershipPointRedemptionPreview {
  customer_id: string
  requested_points: number
  available_points: number
  max_redeemable_points: number
  redeemable_points: number
  redemption_amount: number
  order_subtotal: number
  remaining_amount: number
  is_valid: boolean
  validation_message: string | null
}

export interface StoreCustomerPointRedemptionPreviewResponse {
  preview: MembershipPointRedemptionPreview
}

export interface StoreCustomerPointRedemptionResponse {
  redemption: MembershipPointRedemptionPreview & {
    reference_id: string
    created: boolean
    point_log_id: string | null
    available_points_before: number
    available_points_after: number
  }
}

export interface StoreCustomerFavoritesResponse {
  items: FavoriteRecord[]
  count: number
}

export interface StoreCustomerFavoriteResponse {
  favorite: FavoriteRecord
}

export interface StoreCustomerPetsResponse {
  items: PetRecord[]
  count: number
}

export interface StoreCustomerPetResponse {
  pet: PetRecord
}

export interface StoreCustomerSubscriptionsResponse {
  subscription: SubscriptionRecord | null
  count: number
}

export interface StoreCustomerSubscriptionResponse {
  subscription: SubscriptionRecord
}

export interface StoreDeletedResponse {
  id: string
  object: string
  deleted: boolean
}
