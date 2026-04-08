/**
 * @typedef {Object} ApiError
 * @property {number} status - HTTP 狀態碼，網路錯誤時為 0
 * @property {string} message - 使用者可讀的錯誤訊息
 * @property {string} [code] - 後端錯誤代碼（選用）
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000';

function buildUrl(path) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const base = BASE_URL.replace(/\/$/, '');
  const resourcePath = String(path).replace(/^\//, '');

  return `${base}/${resourcePath}`;
}

function getErrorMessage(status) {
  switch (status) {
    case 400:
      return '請求格式錯誤';
    case 401:
      return '請先登入';
    case 403:
      return '您沒有權限執行此操作';
    case 404:
      return '找不到資源';
    case 409:
      return '資料衝突，請重新整理後再試';
    case 422:
      return '資料驗證失敗';
    case 429:
      return '請求過於頻繁，請稍後再試';
    case 500:
      return '伺服器錯誤，請稍後再試';
    default:
      return `發生未知錯誤（${status}）`;
  }
}

async function parseResponse(response) {
  if (response.status === 204) {
    return null;
  }

  try {
    return await response.clone().json();
  } catch {
    const text = await response.text();
    return text || null;
  }
}

/**
 * Send an HTTP request through native fetch.
 *
 * @param {string} method - HTTP method.
 * @param {string} path - API path or absolute URL.
 * @param {unknown} body - Request payload.
 * @param {RequestInit} [options={}] - Additional fetch options.
 * @returns {Promise<unknown>} Parsed response payload.
 * @throws {ApiError} Throws normalized API errors.
 */
async function request(method, path, body, options = {}) {
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  });

  // TODO: [AUTH] 從 sessionStorage 讀取 token 並插入 Authorization header。
  // Authorization: `Bearer ${token}`

  const requestOptions = {
    ...options,
    method,
    headers,
  };

  if (body !== null && body !== undefined) {
    requestOptions.body = JSON.stringify(body);
  }

  if (import.meta.env.DEV) {
    console.warn(`[API] ${method} ${path}`, body || '')
  }

  try {
    const response = await fetch(buildUrl(path), requestOptions);
    const data = await parseResponse(response);

    if (response.ok) {
      return data;
    }

    throw {
      status: response.status,
      message:
        (data && typeof data === 'object' && 'message' in data && data.message) ||
        getErrorMessage(response.status),
      code: data && typeof data === 'object' && 'code' in data ? data.code : undefined,
    };
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }

    throw {
      status: 0,
      message: '網路連線錯誤，請稍後再試',
    };
  }
}

export const apiClient = {
  get: (path, options) => request('GET', path, null, options),
  post: (path, body, options) => request('POST', path, body, options),
  put: (path, body, options) => request('PUT', path, body, options),
  del: (path, options) => request('DELETE', path, null, options),
};

export const get = apiClient.get;
export const post = apiClient.post;
export const put = apiClient.put;
export const del = apiClient.del;

export default apiClient;
