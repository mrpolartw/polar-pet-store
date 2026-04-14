import type { GraphResultSet } from "@medusajs/types"
import type { CustomerMembershipLevelSummary } from "./customer-membership-detail"

type MembershipLevelRecord =
  GraphResultSet<"membership_member_level">["data"][number]

export interface CustomerMembershipProgressSummary {
  current_threshold: number
  next_threshold: number | null
  progress_amount: number
  remaining_amount: number
  progress_percentage: number
}

export interface CustomerMembershipProgressResult {
  next_level: CustomerMembershipLevelSummary | null
  progress: CustomerMembershipProgressSummary
}

function toMembershipLevelSummary(
  level: MembershipLevelRecord | null | undefined
): CustomerMembershipLevelSummary | null {
  if (!level) {
    return null
  }

  return {
    id: level.id,
    name: level.name,
    sort_order: level.sort_order,
    reward_rate: level.reward_rate,
    birthday_reward_rate: level.birthday_reward_rate,
    upgrade_gift_points: level.upgrade_gift_points,
    upgrade_threshold: level.upgrade_threshold,
    auto_upgrade: level.auto_upgrade,
    can_join_event: level.can_join_event,
  }
}

function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.min(100, value))
}

export function buildCustomerMembershipProgress(input: {
  currentLevel: CustomerMembershipLevelSummary | null
  yearlySpent: number
  levels: MembershipLevelRecord[]
}): CustomerMembershipProgressResult {
  const currentThreshold = Number(input.currentLevel?.upgrade_threshold ?? 0)
  const orderedLevels = [...input.levels]
    .filter((level) => level.is_active && level.auto_upgrade)
    .sort((current, next) => {
      if (current.upgrade_threshold !== next.upgrade_threshold) {
        return current.upgrade_threshold - next.upgrade_threshold
      }

      if (current.sort_order !== next.sort_order) {
        return current.sort_order - next.sort_order
      }

      return current.id.localeCompare(next.id)
    })

  const nextLevelRecord =
    orderedLevels.find((level) => {
      if (level.upgrade_threshold <= currentThreshold) {
        return false
      }

      if (input.currentLevel?.id) {
        return level.id !== input.currentLevel.id
      }

      return true
    }) ?? null

  if (!nextLevelRecord) {
    return {
      next_level: null,
      progress: {
        current_threshold: currentThreshold,
        next_threshold: null,
        progress_amount: Math.max(0, Number(input.yearlySpent ?? 0)),
        remaining_amount: 0,
        progress_percentage: 100,
      },
    }
  }

  const yearlySpent = Math.max(0, Number(input.yearlySpent ?? 0))
  const nextThreshold = Number(nextLevelRecord.upgrade_threshold ?? 0)
  const span = Math.max(nextThreshold - currentThreshold, 0)
  const rawProgress = Math.max(yearlySpent - currentThreshold, 0)
  const remainingAmount = Math.max(nextThreshold - yearlySpent, 0)
  const progressPercentage =
    span === 0 ? 100 : clampPercentage((rawProgress / span) * 100)

  return {
    next_level: toMembershipLevelSummary(nextLevelRecord),
    progress: {
      current_threshold: currentThreshold,
      next_threshold: nextThreshold,
      progress_amount: Math.min(rawProgress, span || rawProgress),
      remaining_amount: remainingAmount,
      progress_percentage: progressPercentage,
    },
  }
}
