import api from './api';
import { AxiosResponse } from 'axios';

export interface RunnerProfile {
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  averagePace: number;
  weeklyMileage: number;
  personalBests: {
    mile?: number;
    fiveK?: number;
    tenK?: number;
    halfMarathon?: number;
    marathon?: number;
  };
  totalMilesRun: number;
  preferredRunningTime: 'early_morning' | 'morning' | 'afternoon' | 'evening' | 'night';
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  availableDays: string[];
  goals: string[];
  achievements: Array<{
    name: string;
    date: Date;
    description: string;
  }>;
}

export interface Run {
  date: Date;
  distance: {
    value: number;
    unit: 'miles' | 'kilometers';
  };
  duration: number; // in seconds
  pace: number;
  route?: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  weather?: {
    temperature: number;
    conditions: string;
    humidity: number;
  };
  type: 'solo' | 'group' | 'race' | 'training';
  participants?: string[];
  notes?: string;
  feelingRating?: number;
  elevationGain?: number;
  averageHeartRate?: number;
}

export interface RunStats {
  totalRuns: number;
  totalDistance: number;
  averagePace: number;
  totalDuration: number;
}

const runsService = {
  // Runner Profile
  getProfile: () => api.get<RunnerProfile>('/runs/profile'),
  updateProfile: (profile: Partial<RunnerProfile>) => 
    api.put<RunnerProfile>('/runs/profile', profile),

  // Run Logging
  logRun: (run: Omit<Run, 'pace'>) => api.post<Run>('/runs/log', run),
  getRuns: (limit = 10, skip = 0) => 
    api.get<Run[]>(`/runs/history?limit=${limit}&skip=${skip}`),

  // Stats
  getStats: () => api.get<RunStats>('/runs/stats'),

  // Nearby Runners
  findNearbyRunners: (longitude: number, latitude: number, maxDistance = 5000) =>
    api.get<RunnerProfile[]>(`/runs/nearby?longitude=${longitude}&latitude=${latitude}&maxDistance=${maxDistance}`)
};

export default runsService;
