import api from './api';

export interface SearchCriteria {
  query?: string;
  experienceLevel?: string;
  preferredTime?: string;
  location?: string;
  distance?: number;
}

export interface FriendRequest {
  _id: string;
  requester: User;
  recipient: User;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface FriendRequests {
  sent: FriendRequest[];
  received: FriendRequest[];
}

export interface User {
  _id: string;
  name: string;
  email: string;
  location?: string;
  experienceLevel?: string;
  preferredTime?: string;
  pace?: string;
  compatibility?: number;
  preferredDistance?: number;
}

export interface SearchParams {
  query?: string;
  experienceLevel?: string;
  preferredTime?: string;
  location?: string;
  distance?: number;
}

interface ErrorResponse {
  error: string;
}

type SearchResult = User[] | ErrorResponse;

export const searchUsers = async (params: SearchParams): Promise<SearchResult> => {
  if (localStorage.getItem('demoMode') === 'true') {
    return Promise.resolve([
      {
        _id: 'demo-user-1',
        name: 'Sarah Chen',
        email: 'sarah@demo.com',
        location: 'San Francisco, CA',
        experienceLevel: 'intermediate',
        preferredTime: 'morning',
        pace: '9:00/mile',
        compatibility: 85,
        preferredDistance: 5
      },
      {
        _id: 'demo-user-2',
        name: 'Maya Rodriguez',
        email: 'maya@demo.com',
        location: 'Oakland, CA',
        experienceLevel: 'advanced',
        preferredTime: 'evening',
        pace: '7:30/mile',
        compatibility: 72,
        preferredDistance: 8
      }
    ]);
  }
  
  try {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v != null && v !== '')
    );

    console.log('Searching users with params:', cleanParams);
    const response = await api.get('/api/social/users/search', { params: cleanParams });
    console.log('Search response:', response.data);

    if ('error' in response.data) {
      console.error('Search returned error:', response.data.error);
      return response.data;
    }

    return response.data;
  } catch (err: any) {
    console.error('Error searching users:', {
      error: err.message,
      response: err.response?.data,
      status: err.response?.status,
      headers: err.config?.headers
    });
    if (err.response?.data?.error) {
      return { error: err.response.data.error };
    }
    return { error: err.message || 'Failed to search users' };
  }
};

export const getUserProfile = async (userId: string): Promise<User> => {
  if (localStorage.getItem('demoMode') === 'true') {
    return Promise.resolve({
      _id: userId,
      name: 'Demo User',
      email: 'demo@runher.com',
      location: 'San Francisco, CA',
      experienceLevel: 'intermediate',
      preferredTime: 'morning',
      pace: '9:30/mile',
      compatibility: 90,
      preferredDistance: 5
    });
  }
  
  try {
    const response = await api.get<User>(`/social/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Get user profile error:', error);
    throw error;
  }
};

// Send friend request
export const sendFriendRequest = async (userId: string) => {
  if (localStorage.getItem('demoMode') === 'true') {
    return Promise.resolve({ success: true, message: 'Friend request sent!' });
  }
  
  try {
    const response = await api.post(`/api/social/friends/request/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Send friend request error:', error);
    throw error;
  }
};

// Accept/reject friend request
export const updateFriendRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
  if (localStorage.getItem('demoMode') === 'true') {
    return Promise.resolve({ success: true, status });
  }
  
  try {
    const response = await api.put(`/api/social/friends/request/${requestId}`, { status });
    return response.data;
  } catch (error) {
    console.error('Update friend request error:', error);
    throw error;
  }
};

// Get friend requests
export const getFriendRequests = async (): Promise<FriendRequests> => {
  if (localStorage.getItem('demoMode') === 'true') {
    return Promise.resolve({
      sent: [],
      received: [
        {
          _id: 'demo-request-1',
          requester: {
            _id: 'demo-user-1',
            name: 'Sarah Chen',
            email: 'sarah@demo.com',
            location: 'San Francisco, CA',
            experienceLevel: 'intermediate',
            preferredTime: 'morning',
            pace: '9:00/mile'
          },
          recipient: {
            _id: 'demo-current-user',
            name: 'Demo User',
            email: 'demo@runher.com',
            location: 'San Francisco, CA'
          },
          status: 'pending',
          createdAt: new Date().toISOString()
        }
      ]
    });
  }
  
  try {
    const response = await api.get<FriendRequests>('/api/social/friends/requests');
    if (!response.data) {
      throw new Error('No data received from server');
    }
    // Ensure we have the expected shape
    const friendRequests: FriendRequests = {
      sent: Array.isArray(response.data.sent) ? response.data.sent : [],
      received: Array.isArray(response.data.received) ? response.data.received : []
    };
    return friendRequests;
  } catch (error) {
    console.error('Get friend requests error:', error);
    throw error;
  }
};
