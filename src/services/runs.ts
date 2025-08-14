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
  getProfile: () => {
    if (localStorage.getItem('demoMode') === 'true') {
      return Promise.resolve({
        data: {
          experienceLevel: 'intermediate' as const,
          averagePace: 9.5,
          weeklyMileage: 25,
          personalBests: {
            mile: 7.2,
            fiveK: 24.5,
            tenK: 52.3,
            halfMarathon: 115.0,
          },
          totalMilesRun: 350,
          preferredRunningTime: 'morning' as const,
          location: {
            type: 'Point',
            coordinates: [-122.4194, 37.7749] // San Francisco
          },
          availableDays: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
          goals: ['Complete first marathon', 'Improve 5K time'],
          achievements: [
            {
              name: 'First 10K',
              date: new Date('2024-01-15'),
              description: 'Completed my first 10K race in Golden Gate Park'
            }
          ]
        }
      });
    }
    return api.get<RunnerProfile>('/runs/profile');
  },
  
  updateProfile: (profile: Partial<RunnerProfile>) => {
    if (localStorage.getItem('demoMode') === 'true') {
      return Promise.resolve({ data: { ...profile } });
    }
    return api.put<RunnerProfile>('/runs/profile', profile);
  },

  // Run Logging
  logRun: (run: Omit<ScheduledRun, 'pace'>) => {
    if (localStorage.getItem('demoMode') === 'true') {
      return Promise.resolve({ data: { ...run, pace: 9.5 } });
    }
    return api.post<ScheduledRun>('/runs/log', run);
  },
  
  getRuns: (limit = 10, skip = 0) => {
    if (localStorage.getItem('demoMode') === 'true') {
      return Promise.resolve({
        data: [
          {
            date: new Date('2024-01-20'),
            distance: { value: 3.1, unit: 'miles' as const },
            duration: 1860, // 31 minutes
            pace: 9.5,
            type: 'solo' as const,
            feelingRating: 8,
            notes: 'Great morning run in Golden Gate Park'
          },
          {
            date: new Date('2024-01-18'),
            distance: { value: 5.0, unit: 'miles' as const },
            duration: 2850, // 47.5 minutes
            pace: 9.5,
            type: 'group' as const,
            feelingRating: 9,
            notes: 'Long run with running group'
          }
        ]
      });
    }
    return api.get<ScheduledRun[]>(`/runs/history?limit=${limit}&skip=${skip}`);
  },

  // Stats
  getStats: () => {
    if (localStorage.getItem('demoMode') === 'true') {
      return Promise.resolve({
        data: {
          totalRuns: 42,
          totalDistance: 185.3,
          averagePace: 9.5,
          totalDuration: 106200 // Total seconds
        }
      });
    }
    return api.get<RunStats>('/runs/stats');
  },

  // Nearby Runners
  findNearbyRunners: (longitude: number, latitude: number, maxDistance = 5000) => {
    if (localStorage.getItem('demoMode') === 'true') {
      return Promise.resolve({
        data: [
          {
            experienceLevel: 'intermediate' as const,
            averagePace: 8.5,
            weeklyMileage: 30,
            personalBests: { fiveK: 22.0, tenK: 48.0 },
            totalMilesRun: 420,
            preferredRunningTime: 'morning' as const,
            location: {
              type: 'Point',
              coordinates: [-122.4094, 37.7849] // Nearby in SF
            },
            availableDays: ['Tuesday', 'Thursday', 'Saturday', 'Sunday'],
            goals: ['Sub-20 5K', 'Boston Marathon'],
            achievements: []
          }
        ]
      });
    }
    return api.get<RunnerProfile[]>(`/runs/nearby?longitude=${longitude}&latitude=${latitude}&maxDistance=${maxDistance}`);
  },

  // Calendar
  getCalendarRuns: async (startDate: Date, endDate: Date) => {
    if (localStorage.getItem('demoMode') === 'true') {
      return Promise.resolve({
        data: [
          {
            _id: 'demo-run-1',
            title: 'Morning Group Run',
            date: new Date('2024-01-25'),
            meetingPoint: 'Golden Gate Park',
            distance: { value: 5, unit: 'miles' },
            duration: 2700, // 45 minutes
            description: 'Easy paced group run through the park',
            type: 'group' as const,
            status: 'scheduled' as const,
            confirmed: true,
            pace: 9.0
          }
        ]
      });
    }
    
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
    if (localStorage.getItem('demoMode') === 'true') {
      return Promise.resolve({
        data: {
          ...run,
          _id: 'demo-run-' + Date.now(),
          confirmed: true
        }
      });
    }
    
    console.log('Scheduling run with data:', run);
    const response = await api.post<CalendarRun>('/runs/calendar', run);
    console.log('Server response:', response);
    return response;
  },
  
  updateScheduledRun: (runId: string, run: Partial<CalendarRun>) => {
    if (localStorage.getItem('demoMode') === 'true') {
      return Promise.resolve({ data: { ...run, _id: runId } });
    }
    return api.put<CalendarRun>(`/runs/calendar/${runId}`, run);
  },
  
  deleteScheduledRun: (runId: string) => {
    if (localStorage.getItem('demoMode') === 'true') {
      return Promise.resolve({ data: { success: true } });
    }
    return api.delete(`/runs/calendar/${runId}`);
  },
  
  inviteToRun: (runId: string, userId: string) => {
    if (localStorage.getItem('demoMode') === 'true') {
      return Promise.resolve({ data: { success: true } });
    }
    return api.post(`/runs/calendar/${runId}/invite`, { userId });
  },
  
  respondToInvite: (runId: string, response: 'accept' | 'decline') => {
    if (localStorage.getItem('demoMode') === 'true') {
      return Promise.resolve({ data: { success: true } });
    }
    return api.post(`/runs/calendar/${runId}/respond`, { response });
  }
};

export default runsService;
