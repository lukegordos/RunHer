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

export interface ScheduledRun {
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
  confirmed?: boolean;
  averageHeartRate?: number;
}

export interface RunStats {
  totalRuns: number;
  totalDistance: number;
  averagePace: number;
  totalDuration: number;
}

export interface CalendarRun {
  _id: string;
  title: string;
  date: Date;
  meetingPoint: string;
  distance: {
    value: number;
    unit: string;
  };
  duration: number;
  description?: string;
  type: 'solo' | 'group' | 'race' | 'training';
  status: 'scheduled' | 'completed' | 'cancelled';
  confirmed: boolean;
  createdBy?: string;
  pace?: number;
}

const runsService = {
  // Runner Profile
  getProfile: () => api.get<RunnerProfile>('/runs/profile'),
  updateProfile: (profile: Partial<RunnerProfile>) => 
    api.put<RunnerProfile>('/runs/profile', profile),

  // Run Logging
  logRun: (run: Omit<ScheduledRun, 'pace'>) => api.post<ScheduledRun>('/runs/log', run),
  getRuns: (limit = 10, skip = 0) => 
    api.get<ScheduledRun[]>(`/runs/history?limit=${limit}&skip=${skip}`),

  // Stats
  getStats: () => api.get<RunStats>('/runs/stats'),

  // Nearby Runners
  findNearbyRunners: (longitude: number, latitude: number, maxDistance = 5000) =>
    api.get<RunnerProfile[]>(`/runs/nearby?longitude=${longitude}&latitude=${latitude}&maxDistance=${maxDistance}`),

  // Calendar
  getCalendarRuns: async (startDate: Date, endDate: Date) => {
    console.log('Getting calendar runs between:', { startDate, endDate });
    const response = await api.get<CalendarRun[]>('/runs/calendar', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
    console.log('Server response:', response);
    const data = Array.isArray(response.data) ? response.data : [];
    console.log('Parsed data:', data);
    return { ...response, data };
  },
  
  scheduleRun: async (run: Omit<CalendarRun, '_id'>) => {
    console.log('Scheduling run with data:', run);
    const response = await api.post<CalendarRun>('/runs/calendar', run);
    console.log('Server response:', response);
    return response;
  },
  
  updateScheduledRun: (runId: string, run: Partial<CalendarRun>) =>
    api.put<CalendarRun>(`/runs/calendar/${runId}`, run),
  
  deleteScheduledRun: (runId: string) =>
    api.delete(`/runs/calendar/${runId}`),
  
  inviteToRun: (runId: string, userId: string) =>
    api.post(`/runs/calendar/${runId}/invite`, { userId }),
  
  respondToInvite: (runId: string, response: 'accept' | 'decline') =>
    api.post(`/runs/calendar/${runId}/respond`, { response })
};

export default runsService;
