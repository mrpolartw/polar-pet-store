import React from 'react'
import { Coins, Crown, RefreshCw, WalletCards } from 'lucide-react'

import { ErrorState, LoadingSpinner } from '../../../components/common'
import {
  formatMembershipCurrency,
  formatMembershipDate,
  formatMembershipPoints,
  getMembershipLevelName,
} from '../../membership/utils'

function SummaryMetric({ label, value, accent = false }) {
  return (
    <div className={`account-membership-metric ${accent ? 'accent' : ''}`}>
      <span className="account-membership-metric-label">{label}</span>
      <strong className="account-membership-metric-value">{value}</strong>
    </div>
  )
}

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
  const joinedDate = formatMembershipDate(summary?.customerSince)

  return (
    <section className="account-membership-panel">
      <div className="account-membership-hero">
        <div className="account-membership-hero-main">
          <div className="account-membership-badge">
            <Crown size={16} />
            <span>{currentLevelName}</span>
          </div>
          <p className="account-membership-caption">目前會員等級</p>
          <strong className="account-membership-highlight">
            {formatMembershipPoints(summary?.availablePoints)}
          </strong>
          <p className="account-membership-subcopy">
            可用點數已自動扣除已折抵、已過期與退款扣回的影響。
          </p>
        </div>

        <div className="account-membership-hero-side">
          <div className="account-membership-side-item">
            <Coins size={16} />
            <span>年度累計消費</span>
            <strong>{formatMembershipCurrency(summary?.yearlySpent)}</strong>
          </div>
          <div className="account-membership-side-item">
            <WalletCards size={16} />
            <span>累計消費</span>
            <strong>{formatMembershipCurrency(summary?.totalSpent)}</strong>
          </div>
          <div className="account-membership-side-item">
            <RefreshCw size={16} />
            <span>加入日期</span>
            <strong>{joinedDate}</strong>
          </div>
        </div>
      </div>

      <div className="account-membership-grid">
        <SummaryMetric
          label="可用點數"
          value={formatMembershipPoints(summary?.pointsSummary?.availablePoints)}
          accent={true}
        />
        <SummaryMetric
          label="總點數"
          value={formatMembershipPoints(summary?.pointsSummary?.totalPoints)}
        />
        <SummaryMetric
          label="已失效點數"
          value={formatMembershipPoints(summary?.pointsSummary?.expiredPoints)}
        />
        <SummaryMetric
          label="已折抵點數"
          value={formatMembershipPoints(summary?.pointsSummary?.redeemedPoints)}
        />
        <SummaryMetric
          label="已退款扣回"
          value={formatMembershipPoints(summary?.pointsSummary?.refundedPoints)}
        />
      </div>
    </section>
  )
}
