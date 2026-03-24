/**
 * Fetch a product list.
 *
 * @param {Object} [filters] - Product listing filters.
 * @returns {never} This placeholder always throws until backend APIs are connected.
 * @throws {Error} Throws an unimplemented backend integration error.
 */
export function getProducts(filters) {
  void filters;
  // TODO: [BACKEND] 串接商品列表 API。
  throw new Error('TODO: [BACKEND] productService.getProducts - 需後端 API 串接');
}

/**
 * Fetch a product by slug.
 *
 * @param {string} slug - Product slug.
 * @returns {never} This placeholder always throws until backend APIs are connected.
 * @throws {Error} Throws an unimplemented backend integration error.
 */
export function getProduct(slug) {
  void slug;
  // TODO: [BACKEND] 串接商品詳情 API。
  throw new Error('TODO: [BACKEND] productService.getProduct - 需後端 API 串接');
}

/**
 * Fetch product categories.
 *
 * @returns {never} This placeholder always throws until backend APIs are connected.
 * @throws {Error} Throws an unimplemented backend integration error.
 */
export function getCategories() {
  // TODO: [BACKEND] 串接商品分類 API。
  throw new Error('TODO: [BACKEND] productService.getCategories - 需後端 API 串接');
}

const productService = {
  getProducts,
  getProduct,
  getCategories,
};

export default productService;
