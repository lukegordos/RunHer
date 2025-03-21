// Crime data service for fetching crime data from APIs

export interface CrimeData {
  id: string;
  type: string;
  description: string;
  date: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  severity: 'low' | 'medium' | 'high';
}

// Function to fetch crime data from an API based on location
export const fetchCrimeData = async (
  latitude: number,
  longitude: number,
  radius: number = 5 // radius in kilometers
): Promise<CrimeData[]> => {
  try {
    // For demonstration purposes, we'll use a mock implementation
    // In a real application, you would replace this with an actual API call
    // Example API endpoint: https://api.crimestats.com/v1/crimes?lat=${latitude}&lng=${longitude}&radius=${radius}
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate mock crime data around the given coordinates
    return generateMockCrimeData(latitude, longitude, radius);
  } catch (error) {
    console.error('Error fetching crime data:', error);
    return [];
  }
};

// Helper function to generate mock crime data for demonstration
const generateMockCrimeData = (
  centerLat: number,
  centerLng: number,
  radius: number
): CrimeData[] => {
  const crimeTypes = [
    { type: 'theft', description: 'Theft', severity: 'low' },
    { type: 'assault', description: 'Assault', severity: 'high' },
    { type: 'burglary', description: 'Burglary', severity: 'medium' },
    { type: 'vandalism', description: 'Vandalism', severity: 'low' },
    { type: 'robbery', description: 'Robbery', severity: 'high' },
    { type: 'harassment', description: 'Harassment', severity: 'medium' }
  ];
  
  // Generate between 5-15 crime incidents
  const count = 5 + Math.floor(Math.random() * 10);
  const crimes: CrimeData[] = [];
  
  for (let i = 0; i < count; i++) {
    // Random angle and distance from center
    const angle = Math.random() * Math.PI * 2;
    // Adjust distance to be within the radius (in km)
    // Convert km to lat/lng degrees (very approximate)
    const distance = Math.random() * radius;
    const latOffset = (distance / 111) * Math.sin(angle); // 111 km per degree of latitude
    const lngOffset = (distance / (111 * Math.cos(centerLat * (Math.PI / 180)))) * Math.cos(angle);
    
    const crimeType = crimeTypes[Math.floor(Math.random() * crimeTypes.length)];
    
    // Generate a date within the last 30 days
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    crimes.push({
      id: `crime-${i + 1}`,
      type: crimeType.type,
      description: crimeType.description,
      date: date.toISOString().split('T')[0],
      location: {
        latitude: centerLat + latOffset,
        longitude: centerLng + lngOffset
      },
      severity: crimeType.severity as 'low' | 'medium' | 'high'
    });
  }
  
  return crimes;
};

// Calculate safety score based on crime data
export const calculateSafetyScore = (crimes: CrimeData[]): number => {
  if (crimes.length === 0) return 5.0;
  
  // Weight crimes by severity
  const severityWeights = {
    low: 1,
    medium: 2,
    high: 3
  };
  
  const totalWeight = crimes.reduce((sum, crime) => sum + severityWeights[crime.severity], 0);
  
  // Calculate safety score (5 is safest, 1 is least safe)
  // The formula is designed to decrease as crime count and severity increase
  const safetyScore = 5 - Math.min(4, (totalWeight / 10));
  
  return Math.max(1, Math.round(safetyScore * 10) / 10);
};
