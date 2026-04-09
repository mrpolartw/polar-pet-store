export type JsonRecord = Record<string, unknown>

export interface MembershipLevelSummary {
  id: string
  name: string
  sort_order: number
  reward_rate: number
  birthday_reward_rate: number
  upgrade_gift_points: number
  upgrade_threshold: number
  auto_upgrade: boolean
  can_join_event: boolean
}

export interface MembershipLevel extends MembershipLevelSummary {
  member_count: number
  is_active: boolean
  created_at?: string | null
  updated_at?: string | null
  deleted_at?: string | null
}

export type MembershipLineBindingStatus = "bound" | "unbound"

export interface MembershipCustomer {
  id: string
  company_name: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  metadata: JsonRecord | null
  has_account: boolean | null
  created_by: string | null
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
  joined_at: string | null
  last_login_at: string | null
  last_ordered_at: string | null
  line_binding_status: MembershipLineBindingStatus | null
  membership_member_level?: MembershipLevelSummary | null
}

export interface PointLog {
  id: string
  customer_id: string
  points: number
  balance_after: number
  source:
    | "order"
    | "birthday_bonus"
    | "refund"
    | "admin"
    | "expire"
    | "redeem"
    | "bonus"
    | "upgrade_gift"
  reference_id: string | null
  note: string | null
  expired_at: string | null
  metadata: JsonRecord | null
  created_at?: string | null
  updated_at?: string | null
}

export interface Favorite {
  id: string
  customer_id: string
  product_id: string
  variant_id: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface Pet {
  id: string
  customer_id: string
  name: string
  species: "dog" | "cat" | "bird" | "other" | null
  breed: string | null
  birthday: string | null
  gender: "male" | "female" | "unknown"
  avatar_url: string | null
  metadata: JsonRecord | null
  created_at?: string | null
  updated_at?: string | null
}

export interface Subscription {
  id: string
  customer_id: string
  plan_name: string
  status: "active" | "paused" | "canceled" | "expired"
  started_at: string
  expires_at: string | null
  next_billing_at: string | null
  billing_interval: "monthly" | "yearly" | "one_time" | null
  amount: number | null
  currency_code: string
  metadata: JsonRecord | null
  created_at?: string | null
  updated_at?: string | null
}

export interface AuditLog {
  id: string
  actor_type: "customer" | "admin" | "system"
  actor_id: string
  action: string
  target_type: string | null
  target_id: string | null
  before_state: JsonRecord | null
  after_state: JsonRecord | null
  ip_address: string | null
  metadata: JsonRecord | null
  created_at?: string | null
  updated_at?: string | null
}

export interface MembershipCustomersResponse {
  customers: MembershipCustomer[]
  count: number
  offset: number
  limit: number
}

export interface MembershipCustomerResponse {
  customer: MembershipCustomer
  current_level: MembershipLevelSummary | null
  points_balance: number
  favorites_count: number
  pets_count: number
  active_subscription: Subscription | null
}

export interface MembershipCustomerPointsResponse {
  balance: number
  logs: PointLog[]
  count: number
  offset: number
  limit: number
}

export interface MembershipCustomerPetsResponse {
  pets: Pet[]
  count: number
}

export interface MembershipCustomerFavoritesResponse {
  favorites: Favorite[]
  count: number
}

export interface MembershipCustomerAuditLogsResponse {
  audit_logs: AuditLog[]
  count: number
  offset: number
  limit: number
}

export interface MembershipMemberLevelsResponse {
  member_levels: MembershipLevel[]
  count: number
  offset: number
  limit: number
}

export interface MembershipMemberLevelResponse {
  member_level: MembershipLevel
}

export interface AdjustPointsResponse {
  point_log: PointLog
  balance: number
}

export interface AssignLevelResponse {
  customer_id: string
  member_level: MembershipLevelSummary | null
}

export interface RecalculateLevelResponse {
  customer_id: string
  previous_level: MembershipLevelSummary | null
  current_level: MembershipLevelSummary | null
  changed: boolean
  yearly_spent: number
  total_spent: number
  currency_code: string
  first_order_at: string | null
  cycle_start: string | null
  matched_threshold: number | null
  used_fallback_level: boolean
}

export interface DeleteResponse {
  id: string
  object: string
  deleted: boolean
}

export interface MemberLevelPayload {
  name: string
  sort_order: number
  reward_rate: number
  birthday_reward_rate: number
  upgrade_gift_points: number
  upgrade_threshold: number
  auto_upgrade: boolean
  can_join_event: boolean
  is_active: boolean
}

export type MemberLevelUpdatePayload = Partial<MemberLevelPayload>

export interface AdjustPointsPayload {
  delta: number
  note?: string | null
  source?: "admin"
}

export interface AssignLevelPayload {
  member_level_id: string
}
