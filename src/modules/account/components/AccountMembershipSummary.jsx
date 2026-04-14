import React from 'react'
import { Coins, Crown, RefreshCw } from 'lucide-react'

import { ErrorState, LoadingSpinner } from '../../../components/common'
import {
  formatMembershipCurrency,
  formatMembershipDate,
  formatMembershipPoints,
  getMembershipLevelName,
} from '../../membership/utils'

export default function AccountMembershipSummary({
  summary,
  isLoading,
  error,
  onRetry,
}) {
  if (isLoading) {
    return (
      <div className="account-membership-panel">
        <LoadingSpinner size="medium" label="會員資料載入中..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="account-membership-panel">
        <ErrorState message={error} onRetry={onRetry} />
      </div>
    )
  }

  const currentLevelName = getMembershipLevelName(summary?.currentLevel)
  const nextLevelName = summary?.nextLevel?.name ?? null
  const joinedDate = formatMembershipDate(summary?.customerSince)
  const progressPercentage = Number(summary?.levelProgress?.progressPercentage ?? 0)
  const remainingAmount = Number(summary?.levelProgress?.remainingAmount ?? 0)
  const nextThreshold = summary?.levelProgress?.nextThreshold

  return (
    <section className="account-membership-panel">
      <div className="account-membership-hero">
        <div className="account-membership-hero-main">
          <div className="account-membership-badge">
            <Crown size={16} />
            <span>{currentLevelName}</span>
          </div>
          <p className="account-membership-caption">目前可用點數</p>
          <strong className="account-membership-highlight">
            {formatMembershipPoints(summary?.availablePoints)}
          </strong>
          <p className="account-membership-subcopy">
            點數可在結帳時直接折抵消費，最新異動與到期狀態會顯示在下方點數紀錄。
          </p>
        </div>

        <div className="account-membership-hero-side">
          <div className="account-membership-side-item">
            <Coins size={16} />
            <span>年度累積消費</span>
            <strong>{formatMembershipCurrency(summary?.yearlySpent)}</strong>
          </div>
          <div className="account-membership-side-item">
            <RefreshCw size={16} />
            <span>加入日期</span>
            <strong>{joinedDate}</strong>
          </div>
        </div>
      </div>

      <div className="tier-progress-section">
        <div className="tier-progress-label">
          <span>
            {nextLevelName
              ? `升級至 ${nextLevelName} 的消費進度`
              : '目前已達最高會員等級'}
          </span>
          <span>
            {nextThreshold === null
              ? '已完成'
              : remainingAmount > 0
                ? `尚差 ${formatMembershipCurrency(remainingAmount)}`
                : '已達門檻'}
          </span>
        </div>
        <div className="tier-progress-bar" aria-hidden="true">
          <div
            className="tier-progress-fill"
            style={{ width: `${Math.max(0, Math.min(100, progressPercentage))}%` }}
          />
        </div>
        <div className="account-membership-progress-meta">
          <span>本年度累積：{formatMembershipCurrency(summary?.yearlySpent)}</span>
          <span>
            {nextThreshold === null
              ? '已無下一階級'
              : `下一門檻：${formatMembershipCurrency(nextThreshold)}`}
          </span>
        </div>
      </div>
    </section>
  )
}
