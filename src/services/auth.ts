import api from './api';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  _id: string;
  username: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user?: User;
}

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const login = async (data: LoginData): Promise<AuthResponse> => {
  try {
    console.log('Attempting login with:', { email: data.email });
    const response = await api.post<AuthResponse>('/auth/login', data);
    console.log('Login response:', response.data);
    
    // Store token in localStorage
    if (response.data.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Login error details:', error.response?.data || error.message);
    throw error;
  }
};
