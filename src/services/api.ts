import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Create axios instance with retry functionality
interface CustomAxiosInstance extends AxiosInstance {
  defaults: {
    retry?: number;
    retryDelay?: number;
  } & typeof axios.defaults;
}

const api: CustomAxiosInstance = axios.create({
  baseURL: process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  validateStatus: (status) => status < 500
}) as CustomAxiosInstance;

// Add request interceptor for authentication and logging
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      data: config.data,
      params: config.params,
      headers: config.headers
    });
    return config;
  },
  (error: AxiosError) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`[${new Date().toISOString()}] Response:`, {
      status: response.status,
      url: response.config.url,
      method: response.config.method,
      data: response.data
    });
    return response;
  },
  (error: AxiosError) => {
    console.error(`[${new Date().toISOString()}] Error:`, {
      message: error.message,
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

// Check if we're offline
const isOffline = async () => {
  try {
    await axios.get('/api/health');
    return false;
  } catch (error) {
    console.error('Health check failed, but continuing with online mode');
    return true;
  }
};

// Add retry functionality
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Log the full error details
    console.error('API Error Details:', {
      message: error.message,
      config: error.config,
      response: error.response,
      stack: error.stack
    });

    const config = error.config as InternalAxiosRequestConfig & { retry?: number; currentRetryAttempt?: number; retryDelay?: number };
    if (!config || !api.defaults.retry) {
      return Promise.reject(error);
    }

    config.currentRetryAttempt = config.currentRetryAttempt || 0;
    const maxRetries = config.retry || api.defaults.retry || 3;

    if (config.currentRetryAttempt >= maxRetries) {
      // If we've exhausted retries and we're offline, return offline error
      if (await isOffline() || error.code === 'ERR_NETWORK') {
        console.warn('Network appears to be offline');
        return Promise.reject({
          message: 'Network error. Please check your internet connection.',
          config,
          isOffline: true
        });
      }
      return Promise.reject(error);
    }

    config.currentRetryAttempt += 1;

    const delayMs = config.retryDelay || api.defaults.retryDelay || 1000;
    await new Promise(resolve => setTimeout(resolve, delayMs));

    console.log(`Retrying request (${config.currentRetryAttempt}/${maxRetries}):`, config.url);
    return api(config);
  }
);

// Add default retry configuration to all requests
api.defaults.retry = 3;
api.defaults.retryDelay = 1000;

// Handle authentication and authorization errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response) {
      if (error.response.status === 401) {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found, redirecting to login');
          window.location.href = '/login';
          return Promise.reject(error);
        }
      } else if (error.response.status === 403) {
        console.error('Forbidden access');
        return Promise.reject({
          message: 'You do not have permission to perform this action.',
          originalError: error
        });
      }
    }
    return Promise.reject(error);
  }
);

export default api;
