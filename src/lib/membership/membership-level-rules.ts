export interface MembershipLevelRuleCandidate {
  id: string
  sort_order: number
  upgrade_threshold: number
  auto_upgrade: boolean
  is_active: boolean
}

export interface MembershipLevelMatch<TLevel extends MembershipLevelRuleCandidate> {
  level: TLevel | null
  matched_threshold: number | null
  used_fallback_level: boolean
}

function sortDescendingByPriority<TLevel extends MembershipLevelRuleCandidate>(
  levels: TLevel[]
): TLevel[] {
  return [...levels].sort((current, next) => {
    if (next.upgrade_threshold !== current.upgrade_threshold) {
      return next.upgrade_threshold - current.upgrade_threshold
    }

    if (next.sort_order !== current.sort_order) {
      return next.sort_order - current.sort_order
    }

    return next.id.localeCompare(current.id)
  })
}

function sortAscendingByPriority<TLevel extends MembershipLevelRuleCandidate>(
  levels: TLevel[]
): TLevel[] {
  return [...levels].sort((current, next) => {
    if (current.upgrade_threshold !== next.upgrade_threshold) {
      return current.upgrade_threshold - next.upgrade_threshold
    }

    if (current.sort_order !== next.sort_order) {
      return current.sort_order - next.sort_order
    }

    return current.id.localeCompare(next.id)
  })
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
