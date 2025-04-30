import api from './api';

export interface Run {
  _id?: string;
  title: string;
  date: Date;
  location: string;
  distance: string;
  duration: string;
  description?: string;
  type: 'group';
  status: 'scheduled';
  participants: Array<{
    _id: string;
    name: string;
  }>;
}

class RunsService {
  async getCalendarRuns<T>(startDate: Date, endDate: Date): Promise<{ data: T }> {
    try {
      const response = await api.get('/api/runs/calendar', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
      return response;
    } catch (error: any) {
      console.error('API Error:', {
        url: '/api/runs/calendar',
        message: error.message
      });
      throw error;
    }
  }

  async createRun<T, R>(run: R): Promise<{ data: T }> {
    try {
      const response = await api.post('/api/runs', run);
      return response;
    } catch (error: any) {
      console.error('API Error:', {
        url: '/api/runs',
        message: error.message
      });
      throw error;
    }
  }
}

export const runsService = new RunsService();
