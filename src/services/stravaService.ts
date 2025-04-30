interface StravaProfile {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  city: string;
  state: string;
  profile_medium: string;
  profile: string;
  stats?: {
    recent_run_totals: {
      count: number;
      distance: number;
      moving_time: number;
      elapsed_time: number;
    };
  };
}

class StravaService {
  private static instance: StravaService;
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  private constructor() {
    this.clientId = import.meta.env.VITE_STRAVA_CLIENT_ID || '';
    this.clientSecret = import.meta.env.VITE_STRAVA_CLIENT_SECRET || '';
    this.redirectUri = `${window.location.origin}/profile`;
  }

  public static getInstance(): StravaService {
    if (!StravaService.instance) {
      StravaService.instance = new StravaService();
    }
    return StravaService.instance;
  }

  public getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'read,activity:read',
      approval_prompt: 'auto'
    });

    return `https://www.strava.com/oauth/authorize?${params.toString()}`;
  }

  public async exchangeToken(code: string): Promise<{ accessToken: string; refreshToken: string; expiresAt: number }> {
    try {
      const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          grant_type: 'authorization_code',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange token');
      }

      const data = await response.json();
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_at,
      };
    } catch (error) {
      console.error('Error exchanging token:', error);
      throw error;
    }
  }

  public async getProfile(accessToken: string): Promise<StravaProfile> {
    try {
      const response = await fetch('https://www.strava.com/api/v3/athlete', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch athlete profile');
      }

      const profile = await response.json();

      // Get athlete stats
      const statsResponse = await fetch(`https://www.strava.com/api/v3/athletes/${profile.id}/stats`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (statsResponse.ok) {
        profile.stats = await statsResponse.json();
      }

      return profile;
    } catch (error) {
      console.error('Error fetching athlete profile:', error);
      throw error;
    }
  }

  public async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; expiresAt: number }> {
    try {
      const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_at,
      };
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }
}

export const stravaService = StravaService.getInstance();
