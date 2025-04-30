import api from './api';

export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  error?: string;
}

export interface RegisterResponse {
  token: string;
  user: User;
}

class AuthService {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      // Clear any existing tokens first
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      delete api.defaults.headers['Authorization'];

      const response = await api.post<LoginResponse>('/api/auth/login', {
        email,
        password,
      });
      
      if (response.status >= 400) {
        console.error('Login failed:', response.data);
        throw new Error(response.data.error || 'Authentication failed');
      }
      
      if (!response?.data?.token) {
        console.error('No token received in login response:', response);
        throw new Error('Authentication failed - no token received');
      }
      
      // Store token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Set token in API client
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      api.defaults.headers['Authorization'] = `Bearer ${response.data.token}`;
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        console.error('Login error:', error.response.data.error);
        throw new Error(error.response.data.error);
      } else {
        console.error('Login error:', error.message);
        throw error;
      }
    }
  }

  async register(name: string, email: string, password: string): Promise<RegisterResponse> {
    try {
      const response = await api.post<RegisterResponse>('/api/auth/register', {
        name,
        email,
        password,
      });
      
      if (!response.data?.token) {
        console.error('No token received in register response');
        throw new Error('Authentication failed - no token received');
      }
      
      if (response.data.token === 'mock-token') {
        console.error('Received mock token from server');
        throw new Error('Authentication failed - invalid token');
      }
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error.response?.data || error.message);
      throw error;
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    delete api.defaults.headers['Authorization'];
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();
