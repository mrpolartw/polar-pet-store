const EMPTY_POINTS_SUMMARY = {
  totalPoints: 0,
  availablePoints: 0,
  expiredPoints: 0,
  redeemedPoints: 0,
  refundedPoints: 0,
}

export const POINT_LOG_SOURCE_LABELS = {
  order: '訂單回饋',
  birthday_bonus: '生日加碼',
  upgrade_gift: '升等贈點',
  admin: '後台調整',
  refund: '退款扣回',
  redeem: '點數折抵',
  expire: '點數到期',
  bonus: '活動贈點',
}

export function buildEmptyMembershipSummary(customerId = '') {
  return {
    customerId,
    currentLevel: null,
    pointsBalance: 0,
    availablePoints: 0,
    yearlySpent: 0,
    totalSpent: 0,
    pointsSummary: { ...EMPTY_POINTS_SUMMARY },
    recentPointLogs: [],
  }
}

export function getPointLogSourceLabel(source) {
  return POINT_LOG_SOURCE_LABELS[source] ?? '點數異動'
}

export function normalizeMembershipPointLog(log) {
  if (!log) {
    return null
  }

  const expiredAt = log.expired_at ?? null
  const createdAt = log.created_at ?? null
  const points = Number(log.points ?? 0)
  const isExpired = Boolean(
    expiredAt &&
      points > 0 &&
      new Date(expiredAt).getTime() < Date.now()
  )

  return {
    id: log.id ?? '',
    source: log.source ?? '',
    sourceLabel: getPointLogSourceLabel(log.source),
    points,
    note: log.note ?? '',
    referenceId: log.reference_id ?? '',
    expiredAt,
    createdAt,
    metadata: log.metadata ?? null,
    isExpired,
  }
}

export function normalizeMembershipSummaryResponse(payload) {
  const fallback = buildEmptyMembershipSummary(payload?.customer_id ?? '')
  const pointsSummary = payload?.points_summary ?? {}

  return {
    ...fallback,
    customerId: payload?.customer_id ?? fallback.customerId,
    currentLevel: payload?.current_level ?? null,
    pointsBalance: Number(
      payload?.points_balance ?? payload?.available_points ?? 0
    ),
    availablePoints: Number(
      payload?.available_points ??
        pointsSummary?.available_points ??
        payload?.points_balance ??
        0
    ),
    yearlySpent: Number(payload?.yearly_spent ?? 0),
    totalSpent: Number(payload?.total_spent ?? 0),
    pointsSummary: {
      totalPoints: Number(pointsSummary?.total_points ?? 0),
      availablePoints: Number(pointsSummary?.available_points ?? 0),
      expiredPoints: Number(pointsSummary?.expired_points ?? 0),
      redeemedPoints: Number(pointsSummary?.redeemed_points ?? 0),
      refundedPoints: Number(pointsSummary?.refunded_points ?? 0),
    },
    recentPointLogs: Array.isArray(payload?.recent_point_logs)
      ? payload.recent_point_logs
          .map(normalizeMembershipPointLog)
          .filter(Boolean)
      : [],
  }
}

export function formatMembershipCurrency(value) {
  return `NT$ ${Number(value ?? 0).toLocaleString()}`
}

export function formatMembershipPoints(value) {
  return `${Number(value ?? 0).toLocaleString()} 點`
}

export function formatMembershipDate(value) {
  if (!value) {
    return '--'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '--'
  }

  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function getMembershipLevelName(level) {
  return level?.name ?? '尚未設定會員等級'
}
