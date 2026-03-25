import { MEMBER_TIER_THRESHOLD } from '../utils/constants'

export const getMemberTier = (points) => {
  if (points >= MEMBER_TIER_THRESHOLD.DIAMOND) return { label: 'Polar Diamond', color: '#003153', bg: '#EBF2F8' }
  if (points >= MEMBER_TIER_THRESHOLD.GOLD)    return { label: 'Polar Gold',    color: '#8B5A2B', bg: '#FDF3E3' }
  if (points >= MEMBER_TIER_THRESHOLD.SILVER)  return { label: 'Polar Silver',  color: '#6B7280', bg: '#F3F4F6' }
  return { label: 'Polar Member', color: '#8A7E71', bg: '#F3EFE6' }
}
