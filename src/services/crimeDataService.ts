// Crime data service for fetching crime data from DC GIS API
import { fetchNewsForLocation, analyzeNewsForSafety, calculateNewsSafetyAdjustment, NewsSafetyAnalysis } from './newsApiService';

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

export interface SafetyScoreDetails {
  score: number;                // 1-5 scale (5 is safest)
  crimeFactors: {               // Factors from crime data that influenced the score
    crimeCount: number;
    severityCounts: {
      high: number;
      medium: number;
      low: number;
    };
    recentCrimes: string[];     // Descriptions of recent crimes
  };
  newsFactors?: {               // Factors from news data that influenced the score
    impact: number;             // How much news affected the score
    confidence: number;         // Confidence in the news prediction
    reasons: string[];          // Reasons for the adjustment
    recentEvents: string[];     // Recent news events
  };
  predictionDetails: {
    predictionSource: 'crime' | 'crime+news';
    predictionConfidence: number;  // 0-1 scale
    trendDirection: 'improving' | 'stable' | 'worsening' | 'unknown';
    explanation: string;        // Human-readable explanation of the score
  };
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

// Helper function to check if a point is within radius miles of a route point
export const isWithinRadius = (
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number },
  radiusMiles: number
): boolean => {
  const R = 3959; // Earth's radius in miles
  const lat1 = point1.latitude * Math.PI / 180;
  const lat2 = point2.latitude * Math.PI / 180;
  const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
           Math.cos(lat1) * Math.cos(lat2) *
           Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  return distance <= radiusMiles;
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

// Calculate safety score based on crime data with detailed explanation
export const calculateSafetyScore = async (
  crimes: CrimeData[],
  routePoints: [number, number][],
  radiusMiles: number = 0.5
): Promise<SafetyScoreDetails> => {
  // Initialize safety score details
  const safetyDetails: SafetyScoreDetails = {
    score: 5.0,
    crimeFactors: {
      crimeCount: 0,
      severityCounts: {
        high: 0,
        medium: 0,
        low: 0
      },
      recentCrimes: []
    },
    predictionDetails: {
      predictionSource: 'crime',
      predictionConfidence: 0.7,
      trendDirection: 'stable',
      explanation: 'This area appears to be safe based on recent crime data.'
    }
  };

  // Fetch crime data for each point along the route
  let allCrimes: CrimeData[] = [];
  const processedCrimeIds = new Set<string>(); // To avoid counting the same crime twice

  for (const [lat, lng] of routePoints) {
    try {
      const pointCrimes = await fetchCrimeData(lat, lng, radiusMiles * 1.60934); // Convert miles to km
      
      // Only add crimes that are within radius of any route point and haven't been counted yet
      for (const crime of pointCrimes) {
        if (!processedCrimeIds.has(crime.id)) {
          const isNearRoute = routePoints.some(([routeLat, routeLng]) =>
            isWithinRadius(
              { latitude: crime.location.latitude, longitude: crime.location.longitude },
              { latitude: routeLat, longitude: routeLng },
              radiusMiles
            )
          );

          if (isNearRoute) {
            allCrimes.push(crime);
            processedCrimeIds.add(crime.id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching crime data for point:', { lat, lng }, error);
    }
  }

  if (allCrimes.length === 0) {
    return safetyDetails; // Return default safe score if no crimes
  }

  // Count crimes by severity
  allCrimes.forEach(crime => {
    safetyDetails.crimeFactors.severityCounts[crime.severity]++;
  });

  safetyDetails.crimeFactors.crimeCount = allCrimes.length;

  // Get recent crimes (up to 5)
  const recentCrimes = [...allCrimes]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  safetyDetails.crimeFactors.recentCrimes = recentCrimes.map(crime => 
    `${new Date(crime.date).toLocaleDateString()}: ${crime.type} (${crime.severity} severity)`
  );

  // Stricter weights for crime severity
  const severityWeights = {
    low: 2,
    medium: 5,
    high: 10
  };

  const totalWeight = allCrimes.reduce((sum, crime) => sum + severityWeights[crime.severity], 0);

  // New: Lower denominator, higher penalty per incident, so even a few crimes drop score quickly
  let safetyScore = 5 - Math.min(4.5, (totalWeight / (8 * routePoints.length)));
  safetyScore = Math.max(1, Math.round(safetyScore * 10) / 10);

  // Update the score in our details object
  safetyDetails.score = safetyScore;

  // Stricter explanation text
  let explanation = '';
  if (safetyScore >= 4.8) {
    explanation = `This route is extremely safe. No recent significant incidents reported within ${radiusMiles} miles.`;
  } else if (safetyScore >= 4.2) {
    explanation = `This route is generally safe, but minor incidents have been reported nearby. Remain alert.`;
  } else if (safetyScore >= 3.0) {
    explanation = `Caution: Multiple incidents reported, including ${safetyDetails.crimeFactors.severityCounts.high} serious ones. Consider safer alternatives or running with a group.`;
  } else if (safetyScore >= 2.0) {
    explanation = `Warning: This route has a high number of incidents (${allCrimes.length}). Not recommended for solo runs.`;
  } else {
    explanation = `Danger: Very high crime area (${allCrimes.length} incidents, ${safetyDetails.crimeFactors.severityCounts.high} serious). Strongly discouraged.`;
  }

  safetyDetails.predictionDetails.explanation = explanation;

  try {
    // Get the midpoint of the route for news analysis
    const midIndex = Math.floor(routePoints.length / 2);
    const [midLat, midLng] = routePoints[midIndex];

    // Fetch and analyze news data for the location
    console.log('Fetching news data for predictive safety analysis...');
    const newsArticles = await fetchNewsForLocation(midLat, midLng);
    
    if (newsArticles.length > 0) {
      // Analyze news for safety concerns
      const newsAnalysis = analyzeNewsForSafety(newsArticles);
      console.log('News safety impact analysis:', newsAnalysis);
      
      if (newsAnalysis.score > 0) {
        // Calculate adjustment based on news data
        const newsAdjustment = calculateNewsSafetyAdjustment(newsAnalysis);
        console.log('Safety score adjustment from news:', newsAdjustment);
        
        // Apply adjustment to safety score
        safetyScore = Math.max(1, Math.min(5, safetyScore + newsAdjustment.adjustment));
        safetyScore = Math.round(safetyScore * 10) / 10;
        
        // Update the score in our details object
        safetyDetails.score = safetyScore;
        safetyDetails.predictionDetails.predictionSource = 'crime+news';
        
        // Add news factors to the safety details
        safetyDetails.newsFactors = {
          impact: Math.abs(newsAdjustment.adjustment),
          confidence: newsAdjustment.confidence,
          reasons: newsAdjustment.reasons,
          recentEvents: newsAnalysis.recentEvents.slice(0, 3)
        };
        
        // Update prediction details
        safetyDetails.predictionDetails = {
          predictionSource: 'crime+news',
          predictionConfidence: Math.max(0.7, newsAdjustment.confidence),
          trendDirection: newsAdjustment.adjustment < 0 ? 'worsening' : 'improving',
          explanation: updateExplanationWithNews(explanation, newsAdjustment, newsAnalysis)
        };
      }
    }
  } catch (error) {
    console.error('Error incorporating news data into safety score:', error);
    // Continue with the base safety score if news analysis fails
  }

  return safetyDetails;
};

// Helper function to update explanation with news data
const updateExplanationWithNews = (
  baseExplanation: string,
  newsAdjustment: { adjustment: number, confidence: number, reasons: string[] },
  newsAnalysis: NewsSafetyAnalysis
): string => {
  if (newsAdjustment.reasons.length === 0) return baseExplanation;
  
  let newsExplanation = baseExplanation;
  
  // Add news-based prediction
  if (newsAdjustment.adjustment < 0) {
    // Negative adjustment means safety concerns
    newsExplanation += ` Recent news indicates potential safety concerns: ${newsAdjustment.reasons.join('; ')}.`;
    
    if (newsAnalysis.predictionConfidence > 0.7) {
      newsExplanation += ' This prediction has high confidence based on multiple news sources.';
    } else if (newsAnalysis.predictionConfidence > 0.4) {
      newsExplanation += ' This prediction has moderate confidence based on available news.';
    } else {
      newsExplanation += ' This prediction has low confidence and should be considered preliminary.';
    }
  } else {
    // Positive or neutral adjustment
    newsExplanation += ' News analysis does not indicate additional safety concerns.';
  }
  
  return newsExplanation;
};
