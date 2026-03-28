import { mockAuthHandlers } from '../mocks/mockHandlers';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

if (USE_MOCK && import.meta.env.PROD) {
  console.error('⛔ [authService] MOCK MODE IS ACTIVE IN PRODUCTION! Set VITE_USE_MOCK=false')
}

/**
 * Authenticate a customer with email and password.
 *
 * @param {string} email - Customer email.
 * @param {string} password - Customer password.
 * @returns {Promise<unknown>} Customer payload from mock or backend.
 * @throws {Error} Throws an unimplemented backend integration error when mock mode is disabled.
 */
export const login = async (email, password) => {
  if (USE_MOCK) return mockAuthHandlers.login(email, password);
  // TODO BACKEND 串接時，替換為：
  // import apiClient from '../utils/apiClient'
  // import API from '../constants/api'
  // return apiClient.post(API.AUTH_LOGIN, { email, password })
  throw new Error('TODO: [BACKEND] authService.login - 需後端 API 串接');
};

/**
 * Register a new customer account.
 *
 * @param {Object} userData - Registration payload.
 * @returns {Promise<unknown>} Customer payload from mock or backend.
 * @throws {Error} Throws an unimplemented backend integration error when mock mode is disabled.
 */
export const register = async (userData) => {
  if (USE_MOCK) return mockAuthHandlers.register(userData);
  throw new Error('TODO: [BACKEND] authService.register - 需後端 API 串接');
};

/**
 * Sign out the current customer.
 *
 * @returns {Promise<unknown>} Logout result from mock or backend.
 * @throws {Error} Throws an unimplemented backend integration error when mock mode is disabled.
 */
export const logout = async () => {
  if (USE_MOCK) return mockAuthHandlers.logout();
  throw new Error('TODO: [BACKEND] authService.logout - 需後端 API 串接');
};

/**
 * Fetch the current authenticated customer profile.
 *
 * @returns {Promise<unknown>} Customer payload from mock or backend.
 * @throws {Error} Throws an unimplemented backend integration error when mock mode is disabled.
 */
export const getMe = async () => {
  if (USE_MOCK) return mockAuthHandlers.getMe();
  throw new Error('TODO: [BACKEND] authService.getMe - 需後端 API 串接');
};

/**
 * Update the current customer profile.
 *
 * @param {Object} data - Profile update payload.
 * @returns {Promise<unknown>} Updated customer payload from mock or backend.
 * @throws {Error} Throws an unimplemented backend integration error when mock mode is disabled.
 */
export const updateProfile = async (data) => {
  if (USE_MOCK) return mockAuthHandlers.updateProfile(data);
  throw new Error('TODO: [BACKEND] authService.updateProfile - 需後端 API 串接');
};

/**
 * Change the current customer password.
 *
 * @param {string} oldPassword - Existing password.
 * @param {string} newPassword - New password.
 * @returns {Promise<unknown>} Password change result from mock or backend.
 * @throws {Error} Throws an unimplemented backend integration error when mock mode is disabled.
 */
export const changePassword = async (oldPassword, newPassword) => {
  if (USE_MOCK) return mockAuthHandlers.changePassword(oldPassword, newPassword);
  throw new Error('TODO: [BACKEND] authService.changePassword - 需後端 API 串接');
};

/**
 * Request a password reset email.
 *
 * @param {string} email - Customer email.
 * @returns {Promise<unknown>} Password reset result from mock or backend.
 * @throws {Error} Throws an unimplemented backend integration error when mock mode is disabled.
 */
export const requestPasswordReset = async (email) => {
  if (USE_MOCK) return mockAuthHandlers.requestPasswordReset(email);
  throw new Error('TODO: [BACKEND] authService.requestPasswordReset - 需後端 API 串接');
};

export default {
  login,
  register,
  logout,
  getMe,
  updateProfile,
  changePassword,
  requestPasswordReset,
};
