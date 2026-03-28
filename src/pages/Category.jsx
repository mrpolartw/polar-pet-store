import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { LoadingSpinner } from '../components/common'
import { ROUTES } from '../constants/routes'

const ROUTE_TO_CATEGORY = {
  '/main-food': 'food',
  '/snacks': 'snacks',
  '/health': 'health',
  '/joints': 'health',
}

export default function Category() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const categoryKey = ROUTE_TO_CATEGORY[location.pathname] || 'all'

    navigate(`${ROUTES.PRODUCTS}?category=${categoryKey}`, { replace: true })
  }, [location.pathname, navigate])

  return <LoadingSpinner size="large" fullPage={true} label="載入中..." />
}
