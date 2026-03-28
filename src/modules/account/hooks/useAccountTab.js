import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const VALID_TABS = [
  'profile',
  'orders',
  'favorites',
  'addresses',
  'pets',
  'security',
  'subscription',
]

const DEFAULT_TAB = 'profile'

/**
 * Account tab 狀態管理 hook
 * 支援 URL hash 同步（#orders、#profile 等）
 * 切換 tab 時更新 URL hash，不觸發頁面重整
 */
export function useAccountTab() {
  const location = useLocation()
  const navigate = useNavigate()

  const getTabFromHash = () => {
    const hash = location.hash.replace('#', '')
    return VALID_TABS.includes(hash) ? hash : DEFAULT_TAB
  }

  const [activeTab, setActiveTab] = useState(getTabFromHash)

  useEffect(() => {
    const hash = location.hash.replace('#', '')
    if (VALID_TABS.includes(hash) && hash !== activeTab) {
      const timer = setTimeout(() => {
        setActiveTab(hash)
      }, 0)

      return () => clearTimeout(timer)
    }

    return undefined
  }, [location.hash, activeTab])

  const switchTab = (tab) => {
    if (!VALID_TABS.includes(tab)) return
    setActiveTab(tab)
    navigate(`#${tab}`, { replace: true })
  }

  return { activeTab, switchTab, VALID_TABS }
}
