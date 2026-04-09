const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const DEFAULT_TIMEOUT = 15000;
const PUBLISHABLE_KEY = import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY ?? '';

async function handleResponse(res) {
  if (res.ok) {
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return {};
    }
  }

  let errorBody = {};
  try {
    errorBody = await res.json();
  } catch {
    // ignore
  }

  const message =
    errorBody?.message ??
    errorBody?.error ??
    errorBody?.details ??
    `HTTP ${res.status}`;

  const error = new Error(message);
  error.status = res.status;
  error.body = errorBody;
  throw error;
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeout = new Error('請求超時，請稍後再試');
      timeout.status = 408;
      throw timeout;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function getHeaders(extra = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...extra,
  };

  if (PUBLISHABLE_KEY) {
    headers['x-publishable-api-key'] = PUBLISHABLE_KEY;
  }
  const token = localStorage.getItem('your_auth_token_key'); 
  
  if (token) {
    // 如果有 token，就加上 Authorization 標頭
    headers['Authorization'] = `Bearer ${token}`; 
  }
  return headers;
}

const apiClient = {
  get: async (path, options = {}) => {
    const res = await fetchWithTimeout(`${BASE_URL}${path}`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include',
      ...options,
    });
    return handleResponse(res);
  },

  post: async (path, body = {}, options = {}) => {
    const res = await fetchWithTimeout(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(body),
      ...options,
    });
    return handleResponse(res);
  },

  put: async (path, body = {}, options = {}) => {
    const res = await fetchWithTimeout(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(body),
      ...options,
    });
    return handleResponse(res);
  },

  del: async (path, options = {}) => {
    const res = await fetchWithTimeout(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
      ...options,
    });
    return handleResponse(res);
  },
};

export default apiClient;