import api from './api';

export interface RunnerProfile {
  experienceLevel: string;
  averagePace: number;
  weeklyMileage: number;
  personalBests: {
    mile?: number;
    fiveK?: number;
    tenK?: number;
    halfMarathon?: number;
    marathon?: number;
  };
  preferredRunningTime: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
}

export const getProfile = async (): Promise<RunnerProfile> => {
  try {
    const { data } = await api.get<RunnerProfile>('/api/profile/me');
    return data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

export const updateProfile = async (profile: Partial<RunnerProfile>): Promise<RunnerProfile> => {
  try {
    const { data } = await api.put<RunnerProfile>('/api/profile/me', profile);
    return data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};
