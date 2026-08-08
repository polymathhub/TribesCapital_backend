import axios from 'axios';

const isDev = import.meta.env.DEV;
const API_ENV_URL = isDev ? '' : import.meta.env.VITE_API_URL?.trim();
const DEFAULT_API_BASE = typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api';
const DEV_API_BASE = '/api';
const API_BASE_URL = API_ENV_URL || (isDev ? DEV_API_BASE : DEFAULT_API_BASE);
const NORMALIZED_API_BASE_URL = API_BASE_URL.replace(/\/+$/g, '');

if (!API_ENV_URL) {
  const resolvedBase = isDev ? DEV_API_BASE : DEFAULT_API_BASE;
  console.info(`Using ${isDev ? 'local dev proxy' : 'default'} API base: ${resolvedBase}`);
} else {
  console.info(`Using VITE_API_URL: ${NORMALIZED_API_BASE_URL}`);
}

export const apiClient = axios.create({
  baseURL: NORMALIZED_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (import.meta.env.DEV) {
      console.debug('API request:', {
        method: config.method?.toUpperCase(),
        url: `${config.baseURL || ''}${config.url}`,
        headers: config.headers,
      });
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Determine whether the current user is an admin. If not, avoid
    // noisy console.error output for 401s (common when unauthenticated).
    const isAdmin = (() => {
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        if (!stored) return false;
        const user = JSON.parse(stored);
        return Boolean(user?.isAdmin || (Array.isArray(user?.roles) && user.roles.includes('admin')));
      } catch (e) {
        return false;
      }
    })();

    const status = error.response?.status;
    if (import.meta.env.DEV) {
      // For 401s: only show a minimal debug message for regular users, but
      // emit a detailed admin-only event so admins can inspect issues.
      if (status === 401 && !isAdmin) {
        console.debug('API response: 401 Unauthorized (suppressed for non-admin) -', error.config?.url);
        try {
          window.dispatchEvent(new CustomEvent('tribes:api-unauthorized', { detail: { url: error.config?.url } }));
        } catch (e) {}
      } else {
        console.error('API response error:', {
          url: error.config?.url,
          method: error.config?.method,
          status: status,
          data: error.response?.data,
        });
      }
    }

    const isAuthRequest = error.config?.url?.includes('/auth/');
    if (status === 401 && !isAuthRequest) {
      // Clear session on unauthorized — keep existing behavior but don't
      // produce extra UI noise for non-admins.
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: 'unauthorized' } }));
    }

    return Promise.reject(error);
  }
);

export default apiClient;
