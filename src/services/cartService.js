import { mockCartHandlers } from '../mocks/mockHandlers';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

if (USE_MOCK && import.meta.env.PROD) {
  console.error('??[cartService] MOCK MODE IS ACTIVE IN PRODUCTION! Set VITE_USE_MOCK=false')
}

/**
 * Fetch the current cart.
 *
 * @returns {Promise<unknown>} Cart payload from mock or backend.
 * @throws {Error} Throws an unimplemented backend integration error when mock mode is disabled.
 */
export const getCart = async () => {
  if (USE_MOCK) return mockCartHandlers.getCart();
  throw new Error('TODO: [BACKEND] cartService.getCart - ?敺垢 API 銝脫');
};

/**
 * Add an item into the current cart.
 *
 * @param {string} variantId - Product variant identifier.
 * @param {number} quantity - Quantity to add.
 * @returns {Promise<unknown>} Cart mutation result from mock or backend.
 * @throws {Error} Throws an unimplemented backend integration error when mock mode is disabled.
 */
export const addItem = async (variantId, quantity) => {
  if (USE_MOCK) return mockCartHandlers.addItem(variantId, quantity);
  throw new Error('TODO: [BACKEND] cartService.addItem - ?敺垢 API 銝脫');
};

/**
 * Remove a line item from the cart.
 *
 * @param {string} lineItemId - Cart line item identifier.
 * @returns {Promise<unknown>} Cart mutation result from mock or backend.
 * @throws {Error} Throws an unimplemented backend integration error when mock mode is disabled.
 */
export const removeItem = async (lineItemId) => {
  if (USE_MOCK) return mockCartHandlers.removeItem(lineItemId);
  throw new Error('TODO: [BACKEND] cartService.removeItem - ?敺垢 API 銝脫');
};

/**
 * Update a cart line item quantity.
 *
 * @param {string} lineItemId - Cart line item identifier.
 * @param {number} quantity - New quantity.
 * @returns {Promise<unknown>} Cart mutation result from mock or backend.
 * @throws {Error} Throws an unimplemented backend integration error when mock mode is disabled.
 */
export const updateItem = async (lineItemId, quantity) => {
  if (USE_MOCK) return mockCartHandlers.updateItem(lineItemId, quantity);
  throw new Error('TODO: [BACKEND] cartService.updateItem - ?敺垢 API 銝脫');
};

/**
 * Clear the current cart.
 *
 * @returns {Promise<unknown>} Cart clear result from mock or backend.
 * @throws {Error} Throws an unimplemented backend integration error when mock mode is disabled.
 */
export const clearCart = async () => {
  if (USE_MOCK) return mockCartHandlers.clearCart();
  throw new Error('TODO: [BACKEND] cartService.clearCart - ?敺垢 API 銝脫');
};

/**
 * Apply a promo code to the current cart.
 *
 * @param {string} code - Promo code.
 * @returns {Promise<unknown>} Promo code result from mock or backend.
 * @throws {Error} Throws an unimplemented backend integration error when mock mode is disabled.
 */
export const applyPromoCode = async (code) => {
  if (USE_MOCK) return mockCartHandlers.applyPromoCode(code);
  throw new Error('TODO: [BACKEND] cartService.applyPromoCode - ?敺垢 API 銝脫');
};

/**
 * Remove the active promo code from the current cart.
 *
 * @returns {Promise<unknown>} Promo code removal result from mock or backend.
 * @throws {Error} Throws an unimplemented backend integration error when mock mode is disabled.
 */
export const removePromoCode = async () => {
  if (USE_MOCK) return mockCartHandlers.removePromoCode();
  throw new Error('TODO: [BACKEND] cartService.removePromoCode - ?敺垢 API 銝脫');
};

export default {
  getCart,
  addItem,
  removeItem,
  updateItem,
  clearCart,
  applyPromoCode,
  removePromoCode,
};
