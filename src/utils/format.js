/**
 * 共用格式化工具
 * 統一處理前端金額顯示格式
 */
export const formatPrice = (amount) =>
  "NT$" + Math.round(Number(amount) || 0).toLocaleString("zh-TW")
