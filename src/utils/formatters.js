/**
 * @fileoverview 前端格式化工具函式
 */

/**
 * @description 格式化台幣價格
 * @param {number} number
 * @returns {string} 例：formatPrice(1780) → 'NT$1,780'
 */
export const formatPrice = (number) => {
  if (number === null || number === undefined || Number.isNaN(Number(number))) {
    return 'NT$0'
  }

  return `NT$${Number(number).toLocaleString('zh-TW')}`
}

/**
 * @description 格式化 ISO 日期字串
 * @param {string} isoString
 * @returns {string} 例：'2026-03-24'
 */
export const formatDate = (isoString) => {
  if (!isoString) return '-'

  try {
    const date = new Date(isoString)

    if (Number.isNaN(date.getTime())) {
      return '-'
    }

    return date
      .toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      .replace(/\//g, '-')
  } catch {
    return '-'
  }
}

/**
 * @description 遮蔽姓名中間字
 * @param {string} name
 * @returns {string} 例：'王小明' → '王*明'，'John' → 'J**n'
 */
export const maskName = (name) => {
  const normalized = String(name || '').trim()

  if (!normalized) return '-'
  if (normalized.length < 2) return normalized
  if (normalized.length === 2) return `${normalized[0]}*`

  const first = normalized[0]
  const last = normalized[normalized.length - 1]
  const middle = '*'.repeat(normalized.length - 2)

  return `${first}${middle}${last}`
}

/**
 * @description 遮蔽手機號碼中間部分
 * @param {string} phone
 * @returns {string} 例：'0912345678' → '0912***678'
 */
export const maskPhone = (phone) => {
  if (!phone) return '-'

  const clean = String(phone).replace(/[\s-]/g, '')

  if (clean.length < 7) return clean

  return `${clean.slice(0, 4)}***${clean.slice(-3)}`
}

export default {
  formatPrice,
  formatDate,
  maskName,
  maskPhone,
}
