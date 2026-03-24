import { mockOrderHandlers } from '../mocks/mockHandlers';

const USE_MOCK = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true';

/**
 * Create a new order.
 *
 * @param {Object} payload - Order creation payload.
 * @returns {Promise<unknown>} Order payload from mock or backend.
 * @throws {Error} Throws an unimplemented backend integration error when mock mode is disabled.
 */
export const createOrder = async (payload) => {
  if (USE_MOCK) return mockOrderHandlers.createOrder(payload);
  throw new Error('TODO: [BACKEND] orderService.createOrder - 需後端 API 串接');
};

/**
 * Fetch a single order by identifier.
 *
 * @param {string} orderId - Order identifier.
 * @returns {Promise<unknown>} Order payload from mock or backend.
 * @throws {Error} Throws an unimplemented backend integration error when mock mode is disabled.
 */
export const getOrder = async (orderId) => {
  if (USE_MOCK) return mockOrderHandlers.getOrder(orderId);
  throw new Error('TODO: [BACKEND] orderService.getOrder - 需後端 API 串接');
};

/**
 * Fetch the current customer's order history.
 *
 * @param {Object} [params] - Optional query params reserved for backend integration.
 * @returns {Promise<unknown>} Order list payload from mock or backend.
 * @throws {Error} Throws an unimplemented backend integration error when mock mode is disabled.
 */
export const getOrders = async (params) => {
  void params;
  if (USE_MOCK) return mockOrderHandlers.getOrders();
  throw new Error('TODO: [BACKEND] orderService.getOrders - 需後端 API 串接');
};

/**
 * Validate a promo code before order submission.
 *
 * @param {string} code - Promo code.
 * @returns {Promise<unknown>} Promo code result from mock or backend.
 * @throws {Error} Throws an unimplemented backend integration error when mock mode is disabled.
 */
export const validatePromoCode = async (code) => {
  if (USE_MOCK) return mockOrderHandlers.validatePromoCode(code);
  throw new Error('TODO: [BACKEND] orderService.validatePromoCode - 需後端 API 串接');
};

export default {
  createOrder,
  getOrder,
  getOrders,
  validatePromoCode,
};
