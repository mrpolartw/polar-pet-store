import React from 'react'
import { Coins } from 'lucide-react'

import { EmptyState } from '../../../components/common'
import {
  formatMembershipDate,
  getPointLogDisplayExpiry,
  getPointLogSourceLabel,
} from '../../membership/utils'

function formatPointDelta(points) {
  const numericPoints = Number(points ?? 0)
  const prefix = numericPoints > 0 ? '+' : ''
  return `${prefix}${numericPoints.toLocaleString()} 點`
}

export default function AccountPointHistory({ logs = [] }) {
  if (!logs.length) {
    return (
      <div className="account-point-history-panel">
        <EmptyState
          icon={<Coins size={28} color="var(--color-brand-blue)" />}
          title="目前沒有點數紀錄"
          description="完成訂單、生日加碼、升級贈點與折抵紀錄都會顯示在這裡。"
        />
      </div>
    )
  }

  return (
    <section className="account-point-history-panel">
      <div className="account-point-history-header">
        <div>
          <h3 className="account-point-history-title">近期點數異動</h3>
          <p className="account-point-history-subtitle">
            你最近的點數取得、折抵、退款扣回與到期狀態都會顯示在這裡。
          </p>
        </div>
      </div>

      <div className="account-point-history-list">
        {logs.map((log) => {
          const displayExpiry = getPointLogDisplayExpiry(log)

          return (
            <article key={log.id} className="account-point-history-item">
              <div className="account-point-history-main">
                <div className="account-point-history-meta">
                  <span className="account-point-history-type">
                    {getPointLogSourceLabel(log.source)}
                  </span>
                  <span className="account-point-history-date">
                    {formatMembershipDate(log.createdAt)}
                  </span>
                </div>

                <p className="account-point-history-note">
                  {log.note || '會員點數異動'}
                </p>

                <div className="account-point-history-extra">
                  <span>到期日期：{formatMembershipDate(displayExpiry)}</span>
                  <span>狀態：{log.isExpired ? '已到期' : '有效'}</span>
                </div>
              </div>

              <strong
                className={`account-point-history-delta ${
                  Number(log.points) >= 0 ? 'positive' : 'negative'
                }`}
              >
                {formatPointDelta(log.points)}
              </strong>
            </article>
          )
        })}
      </div>
    </section>
  )
}
