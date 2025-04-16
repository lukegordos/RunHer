import axios from 'axios';

// Get the API URL from environment or use default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30000, // 30 second timeout
  validateStatus: (status) => status >= 200 && status < 500, // Don't reject if status is 2xx/3xx/4xx
});

// Add retry functionality
api.interceptors.response.use(undefined, async (err) => {
  const { config } = err;
  if (!config || !config.retry) {
    return Promise.reject(err);
  }

  config.currentRetryAttempt = config.currentRetryAttempt || 0;

  if (config.currentRetryAttempt >= config.retry) {
    return Promise.reject(err);
  }

  config.currentRetryAttempt += 1;

  const delayMs = config.retryDelay || 1000;
  await new Promise(resolve => setTimeout(resolve, delayMs));

  console.log(`Retrying request (${config.currentRetryAttempt}/${config.retry}):`, config.url);
  return api(config);
});

// Add default retry configuration to all requests
api.defaults.retry = 3;
api.defaults.retryDelay = 1000;

// Add a request interceptor to always get latest token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`[${new Date().toISOString()}] Making request:`, {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL
    });
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log(`[${new Date().toISOString()}] Response:`, {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  async (error) => {
    // Log the error details
    console.error(`[${new Date().toISOString()}] API Error:`, {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    const originalRequest = error.config;

    // Handle network errors
    if (!error.response) {
      console.error('Network error detected');
      return Promise.reject({
        message: 'Network error. Please check your internet connection.',
        originalError: error
      });
    }

    // Handle 401 Unauthorized
    if (error.response.status === 401) {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, redirecting to login');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    // Handle 403 Forbidden
    if (error.response.status === 403) {
      console.error('Forbidden access');
      return Promise.reject({
        message: 'You do not have permission to perform this action.',
        originalError: error
      });
    }

    // Handle 404 Not Found
    if (error.response.status === 404) {
      console.error('Resource not found');
      return Promise.reject({
        message: 'The requested resource was not found.',
        originalError: error
      });
    }

    // Handle 500 Internal Server Error
    if (error.response.status >= 500) {
      console.error('Server error');
      return Promise.reject({
        message: 'An internal server error occurred. Please try again later.',
        originalError: error
      });
    }

    // If the error is a network error or timeout, and we haven't retried yet
    if ((error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') && 
        (!originalRequest._retry || originalRequest._retry < originalRequest.maxRetries)) {
      
      originalRequest._retry = (originalRequest._retry || 0) + 1;
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, originalRequest.retryDelay));
      
      console.log(`Retrying request (${originalRequest._retry}/${originalRequest.maxRetries}):`, {
        url: originalRequest.url,
        method: originalRequest.method
      });
      
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

// Add a response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API Error Response:', error.response ? {
      status: error.response.status,
      data: error.response.data,
      headers: error.response.headers
    } : 'No response from server');
    return Promise.reject(error);
  }
);

export default api;
