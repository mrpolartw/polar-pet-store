export interface MembershipLevelPriorityCandidate {
  id: string
  sort_order: number
  upgrade_threshold: number
}

export interface MembershipLevelRuleCandidate
  extends MembershipLevelPriorityCandidate {
  auto_upgrade: boolean
  is_active: boolean
}

export interface MembershipLevelMatch<TLevel extends MembershipLevelRuleCandidate> {
  level: TLevel | null
  matched_threshold: number | null
  used_fallback_level: boolean
}

export function compareMembershipLevelPriority<
  TLevel extends MembershipLevelPriorityCandidate,
>(candidate: TLevel, current: TLevel): number {
  if (candidate.upgrade_threshold !== current.upgrade_threshold) {
    return candidate.upgrade_threshold - current.upgrade_threshold
  }

  if (candidate.sort_order !== current.sort_order) {
    return candidate.sort_order - current.sort_order
  }

  return candidate.id.localeCompare(current.id)
}

function sortDescendingByPriority<TLevel extends MembershipLevelRuleCandidate>(
  levels: TLevel[]
): TLevel[] {
  return [...levels].sort((current, next) =>
    compareMembershipLevelPriority(next, current)
  )
}

function sortAscendingByPriority<TLevel extends MembershipLevelRuleCandidate>(
  levels: TLevel[]
): TLevel[] {
  return [...levels].sort(compareMembershipLevelPriority)
}

export function getAutoUpgradeableMemberLevels<
  TLevel extends MembershipLevelRuleCandidate,
>(levels: TLevel[]): TLevel[] {
  return levels.filter((level) => level.is_active && level.auto_upgrade)
}

export function selectMembershipLevelByYearlySpent<
  TLevel extends MembershipLevelRuleCandidate,
>(
  levels: TLevel[],
  yearlySpent: number
): MembershipLevelMatch<TLevel> {
  const eligibleLevels = getAutoUpgradeableMemberLevels(levels)

  if (!eligibleLevels.length) {
    return {
      level: null,
      matched_threshold: null,
      used_fallback_level: false,
    }
  }

  const matchedLevel =
    sortDescendingByPriority(eligibleLevels).find(
      (level) => yearlySpent >= level.upgrade_threshold
    ) ?? null

  if (matchedLevel) {
    return {
      level: matchedLevel,
      matched_threshold: matchedLevel.upgrade_threshold,
      used_fallback_level: false,
    }
  }

  const fallbackLevel = sortAscendingByPriority(eligibleLevels)[0] ?? null

  return {
    level: fallbackLevel,
    matched_threshold: fallbackLevel?.upgrade_threshold ?? null,
    used_fallback_level: !!fallbackLevel,
  }
}

export function isMembershipLevelUpgrade<
  TLevel extends MembershipLevelPriorityCandidate,
>(
  previousLevel: TLevel | null | undefined,
  nextLevel: TLevel | null | undefined
): boolean {
  if (!previousLevel || !nextLevel) {
    return false
  }

  return compareMembershipLevelPriority(nextLevel, previousLevel) > 0
}
