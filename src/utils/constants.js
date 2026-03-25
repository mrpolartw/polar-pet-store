export const MEMBER_TIER_THRESHOLD = {
  SILVER: 1000,
  GOLD: 3000,
  DIAMOND: 8000,
}

export const SHIPPING_METHODS = {
  HOME_DELIVERY: 'home_delivery',
  CVS: 'cvs',
}

export const PAYMENT_METHODS = {
  CREDIT: 'credit',
  LINEPAY: 'linepay',
  APPLEPAY: 'applepay',
  TRANSFER: 'transfer',
}

export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REQUIRES_ACTION: 'requires_action',
}

export const ORDER_STATUS_LABEL = {
  pending: '訂單成立',
  processing: '備貨中',
  completed: '已完成',
  cancelled: '已取消',
  requires_action: '需要處理',
  shipped: '運送中',
  delivered: '已送達',
}
