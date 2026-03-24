/**
 * Fetch the current customer profile.
 *
 * @returns {never} This placeholder always throws until backend APIs are connected.
 * @throws {Error} Throws an unimplemented backend integration error.
 */
export function getCustomerProfile() {
  // TODO: [BACKEND] 串接會員資料 API。
  throw new Error('TODO: [BACKEND] customerService.getCustomerProfile - 需後端 API 串接');
}

/**
 * Update the current customer profile.
 *
 * @param {Object} data - Customer profile payload.
 * @returns {never} This placeholder always throws until backend APIs are connected.
 * @throws {Error} Throws an unimplemented backend integration error.
 */
export function updateCustomerProfile(data) {
  void data;
  // TODO: [BACKEND] 串接會員更新 API。
  throw new Error('TODO: [BACKEND] customerService.updateCustomerProfile - 需後端 API 串接');
}

/**
 * Fetch saved customer addresses.
 *
 * @returns {never} This placeholder always throws until backend APIs are connected.
 * @throws {Error} Throws an unimplemented backend integration error.
 */
export function getAddresses() {
  // TODO: [BACKEND] 串接地址簿查詢 API。
  throw new Error('TODO: [BACKEND] customerService.getAddresses - 需後端 API 串接');
}

/**
 * Create a customer address.
 *
 * @param {Object} payload - Address payload.
 * @returns {never} This placeholder always throws until backend APIs are connected.
 * @throws {Error} Throws an unimplemented backend integration error.
 */
export function createAddress(payload) {
  void payload;
  // TODO: [BACKEND] 串接新增地址 API。
  throw new Error('TODO: [BACKEND] customerService.createAddress - 需後端 API 串接');
}

/**
 * Update a customer address.
 *
 * @param {string} addressId - Address identifier.
 * @param {Object} payload - Address payload.
 * @returns {never} This placeholder always throws until backend APIs are connected.
 * @throws {Error} Throws an unimplemented backend integration error.
 */
export function updateAddress(addressId, payload) {
  void addressId;
  void payload;
  // TODO: [BACKEND] 串接更新地址 API。
  throw new Error('TODO: [BACKEND] customerService.updateAddress - 需後端 API 串接');
}

/**
 * Delete a customer address.
 *
 * @param {string} addressId - Address identifier.
 * @returns {never} This placeholder always throws until backend APIs are connected.
 * @throws {Error} Throws an unimplemented backend integration error.
 */
export function deleteAddress(addressId) {
  void addressId;
  // TODO: [BACKEND] 串接刪除地址 API。
  throw new Error('TODO: [BACKEND] customerService.deleteAddress - 需後端 API 串接');
}

const customerService = {
  getCustomerProfile,
  updateCustomerProfile,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
};

export default customerService;
