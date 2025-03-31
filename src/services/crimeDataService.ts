// Crime data service for fetching crime data from DC GIS API

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

// Function to fetch crime data from DC GIS API
export const fetchCrimeData = async (
  latitude: number,
  longitude: number,
  radius: number = 5 // radius in kilometers
): Promise<CrimeData[]> => {
  try {
    console.log('Fetching crime data for:', { latitude, longitude, radius });

    // Create a bounding box around the given coordinates (roughly 5km)
    const latDiff = radius / 111.32; // 1 degree = 111.32 km
    const lonDiff = radius / (111.32 * Math.cos(latitude * (Math.PI / 180)));
    
    const minLat = latitude - latDiff;
    const maxLat = latitude + latDiff;
    const minLon = longitude - lonDiff;
    const maxLon = longitude + lonDiff;

    console.log('Bounding box:', { minLat, maxLat, minLon, maxLon });

    // Calculate date range for the past week
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Go back 7 days

    // Format dates for the API query (YYYY-MM-DD format)
    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };

    console.log('Date range:', {
      start: formatDate(startDate),
      end: formatDate(endDate)
    });

    // Create the where clause with both location and date filters
    const whereClause = encodeURIComponent(
      `LATITUDE >= ${minLat} AND LATITUDE <= ${maxLat} AND ` +
      `LONGITUDE >= ${minLon} AND LONGITUDE <= ${maxLon} AND ` +
      `REPORT_DAT >= DATE '${formatDate(startDate)}' AND REPORT_DAT <= DATE '${formatDate(endDate)}'`
    );
    
    const url = `https://maps2.dcgis.dc.gov/dcgis/rest/services/FEEDS/MPD/MapServer/7/query?outFields=*&where=${whereClause}&f=geojson`;
    console.log('Fetching from URL:', url);

    // Fetch data from DC GIS API
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Raw GeoJSON response:', data);
    
    if (!data.features || !Array.isArray(data.features)) {
      console.error('Invalid response format:', data);
      return [];
    }

    console.log('Number of features found:', data.features.length);

    // Transform GeoJSON features to our CrimeData interface and filter by date
    const transformedData = data.features
      .map((feature: any) => {
        const props = feature.properties;
        const coords = feature.geometry?.coordinates || [];
        const reportDate = props.REPORT_DAT ? new Date(props.REPORT_DAT) : null;

        // Skip invalid dates or dates outside our range
        if (!reportDate) return null;
        
        // Double-check the date is within our range (in case API filter didn't work)
        if (reportDate < startDate || reportDate > endDate) return null;

        return {
          id: props.CCN || props.OBJECTID?.toString() || Math.random().toString(),
          type: props.OFFENSE || 'Unknown',
          description: `${props.METHOD || ''} - ${props.OFFENSE || 'Unknown Offense'}`.trim(),
          date: reportDate.toISOString(),
          location: {
            // GeoJSON coordinates are [longitude, latitude]
            longitude: coords[0] || props.LONGITUDE,
            latitude: coords[1] || props.LATITUDE,
            address: props.BLOCK || ''
          },
          severity: mapSeverity(props.METHOD || '', props.OFFENSE || '')
        };
      })
      .filter(Boolean) as CrimeData[]; // Remove null entries

    console.log('Transformed data:', transformedData.length, 'crimes from the past week');
    return transformedData;
  } catch (error) {
    console.error('Error fetching crime data:', error);
    return [];
  }
};

// Helper function to map crime types to severity levels
const mapSeverity = (method: string, offense: string): 'low' | 'medium' | 'high' => {
  const offenseLower = offense.toLowerCase();
  const methodLower = method.toLowerCase();

  // High severity crimes
  if (
    offenseLower.includes('homicide') ||
    offenseLower.includes('assault') ||
    offenseLower.includes('robbery') ||
    offenseLower.includes('carjacking') ||
    offenseLower.includes('weapon') ||
    offenseLower.includes('sex abuse') ||
    methodLower.includes('gun') ||
    methodLower.includes('knife')
  ) {
    return 'high';
  }

  // Medium severity crimes
  if (
    offenseLower.includes('burglary') ||
    offenseLower.includes('theft') ||
    offenseLower.includes('stolen') ||
    offenseLower.includes('arson')
  ) {
    return 'medium';
  }

  // Everything else is low severity
  return 'low';
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
