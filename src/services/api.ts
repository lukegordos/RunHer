import axios from 'axios';

// Get the API URL from environment or use default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Create a mock API for offline fallback
const createMockResponse = (endpoint: string, method: string) => {
  // Mock data for different endpoints
  const mockData: Record<string, any> = {
    '/auth/login': { 
      success: true, 
      token: 'mock-token', 
      user: { 
        _id: 'mock-user-id', 
        username: 'Demo User', 
        email: 'demo@example.com' 
      } 
    },
    '/routes': [
      {
        id: 'mock-route-1',
        name: 'Mock Safe Route 1',
        location: 'Downtown',
        distance: '2.5 miles',
        distanceNum: 2.5,
        elevation: 'Flat',
        difficulty: 'Easy',
        terrain: 'Paved',
        rating: 4.5,
        favorites: 120,
        imageUrl: '/images/routes/route1.jpg',
        isGenerated: true,
        safetyRating: 4.8,
        routeType: 'loop',
        safetyPriority: 'high'
      },
      {
        id: 'mock-route-2',
        name: 'Mock Safe Route 2',
        location: 'Riverside',
        distance: '3.2 miles',
        distanceNum: 3.2,
        elevation: 'Moderate',
        difficulty: 'Moderate',
        terrain: 'Mixed',
        rating: 4.2,
        favorites: 85,
        imageUrl: '/images/routes/route2.jpg',
        isGenerated: true,
        safetyRating: 4.5,
        routeType: 'out-and-back',
        safetyPriority: 'medium'
      }
    ],
    '/crime-data': {
      crimeData: [],
      safetyScore: 4.2
    }
  };

  // Return mock data if available, or empty success response
  const mockResponse = mockData[endpoint] || { success: true, message: 'Operation completed in offline mode' };
  console.log(`[OFFLINE MODE] Returning mock data for ${method} ${endpoint}`);
  return mockResponse;
};

// Check if we're offline
const isOffline = () => {
  // Check if offline fallback is enabled in environment
  const offlineFallbackEnabled = import.meta.env.VITE_ENABLE_OFFLINE_FALLBACK === 'true';
  
  // Only use offline mode if explicitly enabled and browser reports offline
  return offlineFallbackEnabled && !navigator.onLine;
};

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
    // If we've exhausted retries and we're offline, use mock data
    if (isOffline() || err.code === 'ERR_NETWORK') {
      console.warn('Network appears to be offline, using mock data');
      return Promise.resolve({ 
        data: createMockResponse(config.url, config.method),
        status: 200,
        statusText: 'OK (Offline Mode)',
        headers: {},
        config: config,
      });
    }
    return Promise.reject(err);
  }

  config.currentRetryAttempt += 1;

  const delayMs = config.retryDelay || 1000;
  await new Promise(resolve => setTimeout(resolve, delayMs));

  console.log(`Retrying request (${config.currentRetryAttempt}/${config.retry}):`, config.url);
  return api(config);
});

// Add default retry configuration to all requests
// @ts-ignore - Adding custom properties to axios defaults
(api.defaults as any).retry = 3;
// @ts-ignore - Adding custom properties to axios defaults
(api.defaults as any).retryDelay = 1000;

// Add a request interceptor to always get latest token
api.interceptors.request.use(
  (config) => {
    // Check if offline before making request
    if (isOffline()) {
      console.warn('Network is offline, using mock data');
      // Create a mock response
      const mockData = createMockResponse(config.url, config.method);
      
      // Reject the request with a special flag that will be caught by our response interceptor
      return Promise.reject({
        config,
        response: {
          status: 200,
          data: mockData,
          headers: {},
          config: config,
          statusText: 'OK (Offline Mode)'
        },
        isOfflineMock: true
      });
    }

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
    // Check if this is our offline mock response
    if (error.isOfflineMock) {
      console.log('Returning offline mock data:', error.response.data);
      return Promise.resolve(error.response);
    }

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
      console.error('No response from server:', !error.response);
      console.error('Network error:', error.code === 'ERR_NETWORK');
      console.error('Full error:', error);

      // If we're offline or it's a network error, use mock data
      if (isOffline() || error.code === 'ERR_NETWORK') {
        console.warn('Network appears to be offline, using mock data');
        return Promise.resolve({ 
          data: createMockResponse(originalRequest.url, originalRequest.method),
          status: 200,
          statusText: 'OK (Offline Mode)',
          headers: {},
          config: originalRequest,
        });
      }

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
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      console.error('API No Response:', error.request);
    } else {
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
