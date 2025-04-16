import api from './api';

export interface User {
  _id: string;
  name: string;
  email: string;
}

export const searchUsers = async (query: string): Promise<User[]> => {
  try {
    const response = await api.get<User[]>(`/social/users/search`, {
      params: { query }
    });
    return response.data;
  } catch (error) {
    console.error('User search error:', error);
    throw error;
  }
};

export const getUserProfile = async (userId: string): Promise<User> => {
  try {
    const response = await api.get<User>(`/social/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Get user profile error:', error);
    throw error;
  }
};
