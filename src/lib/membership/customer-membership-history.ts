import type { GraphResultSet } from "@medusajs/types"

type AuditLogRecord = GraphResultSet<"membership_audit_log">["data"][number]

export interface MembershipHistoryItem {
  id: string
  action: string
  label: string
  actor_type: "customer" | "admin" | "system"
  actor_id: string
  created_at: string | null
  metadata: Record<string, unknown> | null
}

const ACTION_LABELS: Record<string, string> = {
  "customer.auth.registered": "會員註冊",
  "customer.auth.email_verified": "Email 驗證完成",
  "customer.membership_level.recalculated": "會員等級重算",
  "customer.membership_level.recalculated_by_system": "會員等級自動重算",
  "customer.membership_level.recalculated_by_admin": "後台手動重算會員等級",
  "customer.points.adjusted": "點數異動",
  "customer.subscription.created": "建立訂閱",
  "customer.subscription.updated": "更新訂閱",
  "customer.subscription.paused": "訂閱已暫停",
  "customer.subscription.resumed": "訂閱已恢復",
  "customer.subscription.canceled": "訂閱已取消",
  "customer.favorite.added": "加入收藏",
  "customer.favorite.removed": "移除收藏",
  "customer.pet.created": "新增毛孩",
  "customer.pet.updated": "更新毛孩資料",
  "customer.pet.deleted": "刪除毛孩資料",
}

export function getMembershipHistoryLabel(action: string): string {
  return ACTION_LABELS[action] ?? action
}

export function normalizeMembershipHistoryItem(
  log: AuditLogRecord
): MembershipHistoryItem {
  return {
    id: log.id,
    action: log.action,
    label: getMembershipHistoryLabel(log.action),
    actor_type: log.actor_type,
    actor_id: log.actor_id,
    created_at: log.created_at ?? null,
    metadata: (log.metadata as Record<string, unknown> | null) ?? null,
  }
}
