import type { GraphResultSet } from "@medusajs/types"
import type { AdminCustomerMembershipListItem } from "../../../lib/membership/customer-membership-list"
import type { AdminMemberLevelListItem } from "../../../lib/membership/admin-member-levels"

export type MembershipLevelRecord =
  GraphResultSet<"membership_member_level">["data"][number]

export type PointLogRecord =
  GraphResultSet<"membership_point_log">["data"][number]

export type FavoriteRecord =
  GraphResultSet<"membership_favorite">["data"][number]

export type PetRecord = GraphResultSet<"membership_pet">["data"][number]

export type SubscriptionRecord =
  GraphResultSet<"membership_subscription">["data"][number]

export type AuditLogRecord =
  GraphResultSet<"membership_audit_log">["data"][number]

export type CustomerMembershipGraph = GraphResultSet<"customer">["data"][number] & {
  membership_member_level?: MembershipLevelRecord | null
}

export type MemberLevelSummary = Pick<
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

export interface AdminMemberLevelsListResponse {
  member_levels: AdminMemberLevelListItem[]
  count: number
  offset: number
  limit: number
}

export interface AdminMemberLevelResponse {
  member_level: AdminMemberLevelListItem
}

export interface AdminMembershipCustomersResponse {
  customers: AdminCustomerMembershipListItem[]
  count: number
  offset: number
  limit: number
}

export interface AdminMembershipCustomerResponse {
  customer: CustomerMembershipGraph
  current_level: MemberLevelSummary | null
  points_balance: number
  available_points: number
  points_summary: MembershipPointsSummary
  favorites_count: number
  pets_count: number
  active_subscription: SubscriptionRecord | null
}

export interface MembershipPointsSummary {
  total_points: number
  available_points: number
  expired_points: number
  redeemed_points: number
  refunded_points: number
}

export interface AdminMembershipCustomerPointsResponse {
  balance: number
  available_balance: number
  points_summary: MembershipPointsSummary
  logs: PointLogRecord[]
  count: number
  offset: number
  limit: number
}

export interface AdminMembershipCustomerPetsResponse {
  pets: PetRecord[]
  count: number
}

export interface AdminMembershipCustomerFavoritesResponse {
  favorites: FavoriteRecord[]
  count: number
}

export interface AdminMembershipCustomerAuditLogsResponse {
  audit_logs: AuditLogRecord[]
  count: number
  offset: number
  limit: number
}

export interface AdminAdjustMembershipPointsResponse {
  point_log: PointLogRecord
  balance: number
}

export interface AdminAssignMembershipLevelResponse {
  customer_id: string
  member_level: MemberLevelSummary | null
}

export interface AdminRecalculateMembershipLevelResponse {
  customer_id: string
  previous_level: MemberLevelSummary | null
  current_level: MemberLevelSummary | null
  changed: boolean
  yearly_spent: number
  total_spent: number
  currency_code: string
  first_order_at: string | null
  cycle_start: string | null
  matched_threshold: number | null
  used_fallback_level: boolean
}

export interface AdminDeletedResponse {
  id: string
  object: string
  deleted: boolean
}
