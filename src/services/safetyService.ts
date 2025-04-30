import { CrimeData } from "./crimeDataService";

interface SafetyScore {
  score: number;          // 1-5 scale (5 is safest)
  nearestCrimes: {
    property: number;
    violent: number;
    other: number;
  };
  explanation: string;
}

// Calculate distance between two points in meters
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Classify crime type
function classifyCrime(crimeType: string): 'property' | 'violent' | 'other' {
  const propertyKeywords = ['theft', 'burglary', 'robbery', 'vandalism', 'property'];
  const violentKeywords = ['assault', 'murder', 'rape', 'violence', 'weapon'];

  const lowerType = crimeType.toLowerCase();
  
  if (propertyKeywords.some(keyword => lowerType.includes(keyword))) {
    return 'property';
  }
  if (violentKeywords.some(keyword => lowerType.includes(keyword))) {
    return 'violent';
  }
  return 'other';
}

export function calculateRouteSafety(
  routePoints: [number, number][],
  crimeData: CrimeData[]
): SafetyScore {
  const NEARBY_THRESHOLD = 160.934; // 0.1 miles in meters
  let score = 5.00; // Start with perfect score
  
  const nearestCrimes = {
    property: 0,
    violent: 0,
    other: 0
  };

  // For each point in the route
  routePoints.forEach(([routeLat, routeLng]) => {
    // Check each crime's impact on this point
    crimeData.forEach(crime => {
      const distance = calculateDistance(
        routeLat,
        routeLng,
        crime.location.latitude,
        crime.location.longitude
      );

      // Only consider crimes within 0.1 miles
      if (distance <= NEARBY_THRESHOLD) {
        const crimeType = classifyCrime(crime.type);
        nearestCrimes[crimeType]++;

        // Deduct points based on crime type
        switch (crimeType) {
          case 'property':
            score -= 0.50;
            break;
          case 'violent':
            score -= 2.00;
            break;
          case 'other':
            score -= 0.25;
            break;
        }
      }
    });
  });

  // Ensure score stays within 1-5 range
  score = Math.max(1.00, Math.min(5.00, score));

  // Generate explanation
  let explanation = "Route safety analysis:\n";
  if (nearestCrimes.violent > 0) {
    explanation += `- ${nearestCrimes.violent} violent crime(s) nearby\n`;
  }
  if (nearestCrimes.property > 0) {
    explanation += `- ${nearestCrimes.property} property crime(s) nearby\n`;
  }
  if (nearestCrimes.other > 0) {
    explanation += `- ${nearestCrimes.other} other incident(s) nearby\n`;
  }

  if (score >= 4.50) {
    explanation += "This route appears to be very safe.";
  } else if (score >= 3.50) {
    explanation += "This route has good safety conditions.";
  } else if (score >= 2.50) {
    explanation += "Exercise normal caution on this route.";
  } else if (score >= 1.50) {
    explanation += "Consider running with a partner on this route.";
  } else {
    explanation += "Consider choosing a different route or time of day.";
  }

  return {
    score: Number(score.toFixed(2)),
    nearestCrimes,
    explanation
  };
}
