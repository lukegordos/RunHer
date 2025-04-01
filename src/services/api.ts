import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 5000  // 5 second timeout
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Log request details
    console.log('Request:', {
      url: config.url,
      method: config.method,
      data: config.data
    });
    
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    // Log successful response
    console.log('Response:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    // Log error details
    console.error('Response error:', {
      message: error.message,
      response: error.response?.data
    });

    // Handle specific error cases
    if (error.code === 'ERR_NETWORK') {
      throw new Error('Cannot connect to server. Please check if the backend is running.');
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    throw new Error(
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred'
    );
  }
);

export default api;
