import { mockAuthHandlers } from '../mocks/mockHandlers';
import apiClient from '../utils/apiClient';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

if (USE_MOCK && import.meta.env.PROD) {
  console.error('[authService] MOCK MODE IS ACTIVE IN PRODUCTION! Set VITE_USE_MOCK=false');
}

const PATHS = {
  REGISTER: '/auth/customer/emailpass/register',
  LOGIN: '/auth/customer/emailpass',
  LOGOUT: '/auth/session',
  ME: '/store/customers/me',
  UPDATE_PROFILE: '/store/customers/me',
  CHANGE_PASSWORD: '/store/customers/me/password',
  REQUEST_PASSWORD_RESET: '/auth/customer/emailpass/reset-password',
};

function isAnonymousState(error) {
  return [400, 401, 403, 404].includes(Number(error?.status));
}

async function fetchCurrentCustomer({ allowAnonymous = false } = {}) {
  try {
    const data = await apiClient.get(PATHS.ME);
    return data?.customer ?? data ?? null;
  } catch (error) {
    if (allowAnonymous && isAnonymousState(error)) {
      return null;
    }
    throw error;
  }
}

export const login = async (email, password) => {
  if (USE_MOCK) return mockAuthHandlers.login(email, password);

  await apiClient.post(PATHS.LOGIN, {
    email,
    password,
  });

  return fetchCurrentCustomer();
};

export const register = async (userData) => {
  if (USE_MOCK) return mockAuthHandlers.register(userData);

  await apiClient.post(PATHS.REGISTER, {
    email: userData.email,
    password: userData.password,
  });

  try {
    return await fetchCurrentCustomer();
  } catch {
    return await login(userData.email, userData.password);
  }
};

export const logout = async () => {
  if (USE_MOCK) return mockAuthHandlers.logout();
  return apiClient.del(PATHS.LOGOUT);
};

export const getMe = async () => {
  if (USE_MOCK) return mockAuthHandlers.getMe();
  return fetchCurrentCustomer({ allowAnonymous: true });
};

export const updateProfile = async (data) => {
  if (USE_MOCK) return mockAuthHandlers.updateProfile(data);

  await apiClient.post(PATHS.UPDATE_PROFILE, data);
  return fetchCurrentCustomer();
};

export const changePassword = async (oldPassword, newPassword) => {
  if (USE_MOCK) return mockAuthHandlers.changePassword(oldPassword, newPassword);

  return apiClient.post(PATHS.CHANGE_PASSWORD, {
    old_password: oldPassword,
    new_password: newPassword,
  });
};

export const requestPasswordReset = async (email) => {
  if (USE_MOCK) return mockAuthHandlers.requestPasswordReset(email);

  return apiClient.post(PATHS.REQUEST_PASSWORD_RESET, { email });
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