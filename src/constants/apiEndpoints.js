export const API = {
  AUTH_LOGIN: '/store/auth',
  AUTH_REGISTER: '/store/auth/register',
  AUTH_LOGOUT: '/store/auth/logout',
  AUTH_ME: '/store/auth/me',
  AUTH_PROFILE: '/store/customers/me',
  AUTH_CHANGE_PASSWORD: '/store/auth/change-password',
  AUTH_PASSWORD_RESET: '/store/auth/password-reset',
  CART: '/store/carts',
  CART_ITEMS: '/store/carts/items',
  CART_LINE_ITEM: '/store/carts/items/:lineItemId',
  CART_PROMO_CODES: '/store/carts/promo-codes',
  PRODUCTS: '/store/products',
  PRODUCT_DETAIL: '/store/products/:slug',
  CATEGORIES: '/store/product-categories',
  ORDERS: '/store/orders',
  ORDER_DETAIL: '/store/orders/:orderId',
  PROMO_VALIDATE: '/store/promo-codes/validate',
  CUSTOMER_PROFILE: '/store/customers/me',
  CUSTOMER_ADDRESSES: '/store/customers/me/addresses',
  CUSTOMER_ADDRESS_DETAIL: '/store/customers/me/addresses/:addressId',
};

export default API;
