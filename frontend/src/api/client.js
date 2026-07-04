import axios from 'axios';

const DEFAULT_API_BASE = typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api';
const API_BASE_URL = import.meta.env.VITE_API_URL || DEFAULT_API_BASE;

if (!import.meta.env.VITE_API_URL) {
  console.warn(`VITE_API_URL is not configured. Falling back to ${DEFAULT_API_BASE}`);
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
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
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = error.config?.url?.includes('/auth/');
    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
