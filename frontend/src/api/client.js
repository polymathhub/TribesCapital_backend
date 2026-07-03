import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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

const clearAuthState = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
};

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = error.config?.url?.includes('/auth/');
    const hasSession = Boolean(
      localStorage.getItem('accessToken') ||
      localStorage.getItem('refreshToken') ||
      localStorage.getItem('userEmail')
    );

    if (error.response?.status === 401 && !isAuthRequest && import.meta.env.PROD && hasSession) {
      clearAuthState();
      window.location.href = '/';
    }

    return Promise.reject(error);
  }
);

export default apiClient;
