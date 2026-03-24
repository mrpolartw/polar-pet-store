/**
 * @fileoverview 開發測試用假資料
 * @description 僅在 VITE_USE_MOCK=true 時使用，不影響正式環境
 */

export const MOCK_USERS = [
  {
    id: 'mock-user-001',
    email: 'test@polar.com',
    password: 'Test1234', // 前端比對用（僅開發）
    name: '測試用戶',
    phone: '0912-345-678',
    birthday: '1995-06-15',
    gender: 'female',
    avatar: null,
    lineLinked: false,
    lineDisplayName: '',
    lineBoundAt: '',
    memberSince: '2024-01-15',
    points: 3280,
    addresses: [
      {
        id: 'addr-001',
        label: '家',
        name: '測試用戶',
        phone: '0912-345-678',
        city: '台北市',
        district: '大安區',
        address: '復興南路一段 123 號 5 樓',
        type: 'home',
        isDefault: true,
      },
    ],
  },
  {
    id: 'mock-user-002',
    email: 'vip@polar.com',
    password: 'Vip12345', // 前端比對用（僅開發）
    name: 'VIP 鑽石會員',
    phone: '0987-654-321',
    birthday: '1990-01-01',
    gender: 'male',
    avatar: null,
    lineLinked: true,
    lineDisplayName: 'Polar VIP',
    lineBoundAt: '2024-06-01',
    memberSince: '2023-01-01',
    points: 12500,
    addresses: [],
  },
];

export const MOCK_CART_ITEMS = [
  {
    id: 'cart-item-001',
    variantId: 'variant-001',
    name: 'Polar 關節保健肉條',
    specs: '15g × 30 入',
    price: 890,
    quantity: 2,
    image: '/src/png/joint-care-product.svg',
    shippingMethods: ['home', '7-ELEVEN'],
  },
  {
    id: 'cart-item-002',
    variantId: 'variant-002',
    name: 'Polar 腸胃保健肉泥',
    specs: '15g × 14 入',
    price: 650,
    quantity: 1,
    image: '/src/png/Cat-Dog-paste.svg',
    shippingMethods: ['home', '7-ELEVEN'],
  },
];

export const MOCK_PROMO_CODES = {
  POLAR2026: { valid: true, discountAmount: 200, label: '新春優惠 -NT$200' },
  NEWMEMBER: { valid: true, discountAmount: 100, label: '新會員優惠 -NT$100' },
};

export const MOCK_ORDERS = {
  'PL-20260001': {
    id: 'PL-20260001',
    status: 'delivered',
    createdAt: '2026-03-10T14:32:00',
    items: MOCK_CART_ITEMS,
    subtotal: 2430,
    shippingFee: 100,
    discount: 200,
    total: 2330,
    shippingMethod: 'home',
    paymentMethod: 'credit',
    recipient: { name: '測試用戶', phone: '0912-345-678' },
  },
  'PL-20260002': {
    id: 'PL-20260002',
    status: 'shipped',
    createdAt: '2026-03-14T10:20:00',
    items: [MOCK_CART_ITEMS[0]],
    subtotal: 1780,
    shippingFee: 0,
    discount: 0,
    total: 1780,
    shippingMethod: 'store',
    paymentMethod: 'linepay',
    recipient: { name: '測試用戶', phone: '0912-345-678' },
  },
};

export const MOCK_DELAY = 600;
