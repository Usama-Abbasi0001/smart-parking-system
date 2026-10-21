import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('parkpulse_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized or token expired, clear invalid storage
      if (error.response.data?.isExpired || error.response.status === 401) {
        localStorage.removeItem('parkpulse_token');
        localStorage.removeItem('parkpulse_user');
        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
          window.location.href = '/login?expired=true';
        }
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Extracts a user-friendly error message from Axios errors
 */
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.errors?.[0]?.message) {
    return error.response.data.errors[0].message;
  }
  if (error.message === 'Network Error') {
    return 'Cannot reach the parking server. Please verify your internet connection or server status.';
  }
  return error.message || 'An unexpected error occurred. Please try again.';
};

export default api;
