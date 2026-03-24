import React from 'react'

import LoadingSpinner from './LoadingSpinner'

/**
 * @description 全頁 Loading，用於 React.lazy Suspense fallback
 */
export default function PageLoader() {
  return (
    <LoadingSpinner
      size="large"
      fullPage={true}
      label="載入中..."
      style={{ minHeight: '60vh' }}
    />
  )
}
