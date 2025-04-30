import { api } from './api';
import { RunRoute } from '@/components/routes/RouteCard';

export interface Route {
  id: string;
  name: string;
  description?: string;
  location: string;
  distance: number;
  elevation: number;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  terrain: 'Road' | 'Trail' | 'Track' | 'Mixed';
  rating: number;
  favorites: number;
  imageUrl?: string;
  safetyScore?: number;
  safetyDetails?: {
    score: number;
    predictionDetails: {
      explanation: string;
    };
    crimeFactors: {
      crimeCount: number;
      severityCounts: {
        high: number;
        medium: number;
        low: number;
      };
    };
    newsFactors: {
      impact: number;
    };
  };
  points: [number, number][];
  isGenerated?: boolean;
  color?: string;
}

class RoutesService {
  async getAllRoutes(): Promise<Route[]> {
    try {
      const response = await api.get<Route[]>('/api/routes');
      return response.data;
    } catch (error) {
      console.error('Error getting routes:', error);
      throw error;
    }
  }

  async getFavoriteRoutes(): Promise<Route[]> {
    try {
      const response = await api.get<Route[]>('/api/routes/favorites');
      return response.data;
    } catch (error) {
      console.error('Error getting favorite routes:', error);
      throw error;
    }
  }

  async saveRoute(route: Omit<Route, 'user' | '_id' | 'createdAt'>): Promise<Route> {
    try {
      const response = await api.post<Route>('/api/routes', route);
      return response.data;
    } catch (error) {
      console.error('Error saving route:', error);
      throw error;
    }
  }

  async toggleFavorite(routeId: string): Promise<Route> {
    try {
      const response = await api.post<Route>(`/api/routes/${routeId}/favorite`);
      return response.data;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }

  async deleteRoute(routeId: string): Promise<void> {
    try {
      await api.delete(`/api/routes/${routeId}`);
    } catch (error) {
      console.error('Error deleting route:', error);
      throw error;
    }
  }
}

export const routesService = new RoutesService();
