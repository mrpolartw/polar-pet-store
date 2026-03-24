import { mockCartHandlers } from '../mocks/mockHandlers';

const USE_MOCK = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true';

/**
 * Fetch the current cart.
 *
 * @returns {Promise<unknown>} Cart payload from mock or backend.
 * @throws {Error} Throws an unimplemented backend integration error when mock mode is disabled.
 */
export const getCart = async () => {
  if (USE_MOCK) return mockCartHandlers.getCart();
  throw new Error('TODO: [BACKEND] cartService.getCart - 需後端 API 串接');
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
  throw new Error('TODO: [BACKEND] cartService.addItem - 需後端 API 串接');
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
  throw new Error('TODO: [BACKEND] cartService.removeItem - 需後端 API 串接');
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
  throw new Error('TODO: [BACKEND] cartService.updateItem - 需後端 API 串接');
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
  throw new Error('TODO: [BACKEND] cartService.applyPromoCode - 需後端 API 串接');
};

/**
 * Remove the active promo code from the current cart.
 *
 * @returns {Promise<unknown>} Promo code removal result from mock or backend.
 * @throws {Error} Throws an unimplemented backend integration error when mock mode is disabled.
 */
export const removePromoCode = async () => {
  if (USE_MOCK) return mockCartHandlers.removePromoCode();
  throw new Error('TODO: [BACKEND] cartService.removePromoCode - 需後端 API 串接');
};

export default {
  getCart,
  addItem,
  removeItem,
  updateItem,
  applyPromoCode,
  removePromoCode,
};
