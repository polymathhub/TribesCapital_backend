import axios from 'axios';

const API_ENV_URL = import.meta.env.VITE_API_URL?.trim();
const DEFAULT_API_BASE = typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api';
const API_BASE_URL = API_ENV_URL || DEFAULT_API_BASE;
const NORMALIZED_API_BASE_URL = API_BASE_URL.replace(/\/+$/g, '');

if (!API_ENV_URL) {
  console.warn(`VITE_API_URL is not configured. Falling back to ${DEFAULT_API_BASE}`);
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
    if (import.meta.env.DEV) {
      console.error('API response error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
      });
    }

    const isAuthRequest = error.config?.url?.includes('/auth/');
    if (error.response?.status === 401 && !isAuthRequest) {
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
