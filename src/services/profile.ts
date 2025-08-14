import api from './api';

export interface RunnerProfile {
  _id?: string;
  name: string;
  email: string;
  experienceLevel?: string;
  averagePace?: number;
  weeklyMileage?: number;
  personalBests?: {
    mile?: number;
    fiveK?: number;
    tenK?: number;
    halfMarathon?: number;
    marathon?: number;
  };
  preferredRunningTime?: string;
  location?: {
    type: string;
    coordinates: [number, number];
  };
  bio?: string;
  goals?: string;
  stravaConnected?: boolean;
}

export const getProfile = async (): Promise<RunnerProfile> => {
  try {
    // Check if we're in demo mode
    const demoMode = localStorage.getItem('demoMode');
    if (demoMode === 'true') {
      // Return mock demo profile data
      return {
        _id: 'demo-user',
        name: 'Demo User',
        email: 'demo@runher.com',
        experienceLevel: 'intermediate',
        averagePace: 9.5,
        weeklyMileage: 25,
        personalBests: {
          mile: 7.2,
          fiveK: 24.5,
          tenK: 52.3,
          halfMarathon: 115.2
        },
        preferredRunningTime: 'morning',
        location: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749] // San Francisco
        },
        bio: 'Welcome to RunHer! This is a demo profile showcasing the app features.',
        goals: 'Train for a half marathon and connect with local running groups.',
        stravaConnected: false
      };
    }

    const { data } = await api.get<RunnerProfile>('/api/profile/me');
    return data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

export const updateProfile = async (profile: Partial<RunnerProfile>): Promise<RunnerProfile> => {
  try {
    // Check if we're in demo mode
    const demoMode = localStorage.getItem('demoMode');
    if (demoMode === 'true') {
      // In demo mode, just return the updated profile without API call
      const currentProfile = await getProfile();
      return { ...currentProfile, ...profile };
    }

    const { data } = await api.put<RunnerProfile>('/api/profile/me', profile);
    return data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};
