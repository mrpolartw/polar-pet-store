import type { CustomerMembershipLevelSummary } from "./customer-membership-detail"

export const CUSTOMER_LINE_BINDING_STATUSES = ["bound", "unbound"] as const

export type CustomerLineBindingStatus =
  (typeof CUSTOMER_LINE_BINDING_STATUSES)[number]

export interface AdminCustomerMembershipListItem {
  id: string
  company_name: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  has_account: boolean | null
  created_by: string | null
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
  joined_at: string | null
  last_login_at: string | null
  last_ordered_at: string | null
  line_binding_status: CustomerLineBindingStatus | null
  membership_member_level: CustomerMembershipLevelSummary | null
}

export interface AdminCustomerMembershipListResponse {
  customers: AdminCustomerMembershipListItem[]
  count: number
  offset: number
  limit: number
}
