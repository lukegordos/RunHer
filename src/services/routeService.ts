import { RunRoute } from "@/components/routes/RouteCard";
import { calculateRouteSafety } from "./safetyService";
import { CrimeData } from "./crimeDataService";

// Define route types
type RouteType = 'loop' | 'out-and-back' | 'point-to-point';
type GeneratedRouteType = 'Hill' | 'Safe' | 'Urban' | 'Loop';
type RouteDifficulty = "Easy" | "Moderate" | "Challenging";

interface RouteOptions {
  startLocation: google.maps.places.PlaceResult;
  distance: number;
  routeType: RouteType;
  numRoutes?: number;
  crimeData?: CrimeData[];
}

async function findWalkableDestination(
  directionsService: google.maps.DirectionsService,
  start: google.maps.LatLng,
  targetDistance: number,
  angle: number,
  attempt: number = 0
): Promise<google.maps.DirectionsResult> {
  const milesInMeters = targetDistance * 1609.34;
  let minDistance = milesInMeters * 0.7; // 70% of target distance (more flexible)
  let maxDistance = milesInMeters * 1.3; // 130% of target distance (more flexible)
  let searchRadius = targetDistance * 1609.34 * (attempt === 0 ? 1 : Math.pow(1.2, attempt));

  // Array of angles to try, starting with the requested angle
  const angleIncrements = [0, Math.PI/6, Math.PI/4, Math.PI/3, Math.PI/2];
  const directions = [1, -1]; // Try both clockwise and counterclockwise

  for (const angleIncrement of angleIncrements) {
    for (const direction of directions) {
      const tryAngle = angle + (angleIncrement * direction);
      
      // Calculate multiple points at different distances
      const distanceFactors = [1, 0.8, 1.2];
      
      for (const factor of distanceFactors) {
        const currentRadius = searchRadius * factor;
        const lat = start.lat() + Math.cos(tryAngle) * (currentRadius / 111320);
        const lng = start.lng() + Math.sin(tryAngle) * (currentRadius / (111320 * Math.cos(start.lat() * Math.PI / 180)));
        
        try {
          const result = await directionsService.route({
            origin: start,
            destination: new google.maps.LatLng(lat, lng),
            travelMode: google.maps.TravelMode.WALKING,
            provideRouteAlternatives: true,
            optimizeWaypoints: true
          });

          // Check if any of the routes match our distance criteria
          for (const route of result.routes) {
            const distance = route.legs[0].distance?.value || 0;
            if (distance >= minDistance && distance <= maxDistance) {
              return {
                ...result,
                routes: [route]
              };
            }
          }
        } catch (error) {
          if (error.code === 'ZERO_RESULTS') {
            continue; // Try next combination
          }
          throw error;
        }
      }
    }
  }

  // If we haven't found a route yet and haven't tried too many times, try again with a different radius
  if (attempt < 3) {
    return findWalkableDestination(directionsService, start, targetDistance, angle, attempt + 1);
  }

  throw new Error(`Could not find a suitable route within ${targetDistance} miles`);
}

async function findNearbyStreet(
  directionsService: google.maps.DirectionsService,
  point: google.maps.LatLng,
  maxRadius: number = 500
): Promise<google.maps.LatLng> {
  // Try a few different angles to find a valid street
  const angles = [0, Math.PI/4, Math.PI/2, (3*Math.PI)/4, Math.PI, (5*Math.PI)/4, (3*Math.PI)/2, (7*Math.PI)/4];
  
  // Try with geocoder first
  try {
    if (!geocoder) {
      initGoogleMapsServices();
      if (!geocoder) {
        throw new Error('Geocoder not initialized');
      }
    }

    const result = await geocoder.geocode({
      location: { lat: point.lat(), lng: point.lng() }
    });
    
    if (result.results[0]) {
      return new google.maps.LatLng(
        result.results[0].geometry.location.lat(),
        result.results[0].geometry.location.lng()
      );
    }
  } catch (error) {
    console.warn('Geocoder failed, falling back to radius search:', error);
  }
  
  // If geocoder fails, try with radius search
  for (const radius of [100, 200, 300, 400, 500]) {
    for (const angle of angles) {
      const testLat = point.lat() + Math.cos(angle) * (radius / 111320);
      const testLng = point.lng() + Math.sin(angle) * (radius / (111320 * Math.cos(point.lat() * Math.PI / 180)));
      const testPoint = new google.maps.LatLng(testLat, testLng);
      
      try {
        const result = await directionsService.route({
          origin: point,
          destination: testPoint,
          travelMode: google.maps.TravelMode.WALKING
        });
        
        if (result.routes[0]) {
          // Return the actual street point from the route
          return result.routes[0].legs[0].end_location;
        }
      } catch (error) {
        if (error.code !== 'ZERO_RESULTS') {
          throw error;
        }
        // Continue trying other angles and distances
      }
    }
  }
  
  // If no walkable streets found, return a point slightly offset from the original
  const fallbackLat = point.lat() + (Math.random() - 0.5) * 0.001; // ~100m
  const fallbackLng = point.lng() + (Math.random() - 0.5) * 0.001;
  return new google.maps.LatLng(fallbackLat, fallbackLng);
}

async function findValidCircularRoute(
  directionsService: google.maps.DirectionsService,
  start: google.maps.LatLng,
  targetDistance: number,
  baseAngle: number,
  attempt: number = 0
): Promise<google.maps.DirectionsResult> {
  const targetMeters = targetDistance * 1609.34; // Convert miles to meters
  const allowedDeviation = 0.25 * 1609.34; // 0.25 miles in meters
  const minDistance = targetMeters - allowedDeviation;
  const maxDistance = targetMeters + allowedDeviation;
  
  // Start with fewer segments and gradually increase
  const numSegments = Math.min(3 + attempt, 6);
  const waypoints: google.maps.DirectionsWaypoint[] = [];
  
  try {
    // Calculate initial radius based on target distance
    // Use a smaller initial radius since real routes tend to be longer than straight lines
    const initialCircumference = targetMeters * 0.8; // Start with 80% of target distance
    let radius = initialCircumference / (2 * Math.PI);
    
    // Adjust radius based on previous attempts
    radius *= (1 + attempt * 0.1); // Gradually increase radius with each attempt
    
    // First, find valid street points roughly in a circle
    const streetPoints: google.maps.LatLng[] = [];
    for (let i = 0; i < numSegments; i++) {
      const angle = baseAngle + (i * (2 * Math.PI / numSegments));
      
      // Add some randomness to avoid grid patterns
      const jitter = (Math.random() - 0.5) * 0.1; // Reduced jitter for more predictable distances
      const adjustedRadius = radius * (1 + jitter);
      
      // Calculate ideal point on the circle
      const idealLat = start.lat() + Math.cos(angle) * (adjustedRadius / 111320);
      const idealLng = start.lng() + Math.sin(angle) * (adjustedRadius / (111320 * Math.cos(start.lat() * Math.PI / 180)));
      const idealPoint = new google.maps.LatLng(idealLat, idealLng);
      
      // Find nearest walkable street
      const streetPoint = await findNearbyStreet(directionsService, idealPoint);
      streetPoints.push(streetPoint);
    }
    
    // Add all points as waypoints
    for (let i = 0; i < streetPoints.length; i++) {
      waypoints.push({
        location: streetPoints[i],
        stopover: true
      });
    }
    
    // Create the full route
    const result = await directionsService.route({
      origin: start,
      destination: start,
      waypoints: waypoints,
      travelMode: google.maps.TravelMode.WALKING,
      optimizeWaypoints: false
    });
    
    // Calculate total distance
    const totalDistance = result.routes[0].legs.reduce(
      (sum, leg) => sum + (leg.distance?.value || 0),
      0
    );
    
    // Check if distance is within acceptable range
    if (totalDistance < minDistance || totalDistance > maxDistance) {
      if (attempt < 8) { // Increased max attempts for better accuracy
        // Adjust angle based on whether route was too long or too short
        const angleAdjustment = totalDistance < targetMeters ? Math.PI/6 : -Math.PI/6;
        return findValidCircularRoute(
          directionsService,
          start,
          targetDistance,
          baseAngle + angleAdjustment,
          attempt + 1
        );
      }
      throw new Error(`Route distance ${totalDistance/1609.34} miles outside acceptable range (${minDistance/1609.34} - ${maxDistance/1609.34} miles)`);
    }
    
    return result;
  } catch (error) {
    if (attempt < 8) { // Increased max attempts
      // Try again with different parameters
      return findValidCircularRoute(
        directionsService,
        start,
        targetDistance,
        baseAngle + Math.PI/4,
        attempt + 1
      );
    }
    throw error;
  }
}

async function isValidLocation(
  geocoder: google.maps.Geocoder,
  point: google.maps.LatLng
): Promise<boolean> {
  try {
    const result = await geocoder.geocode({
      location: { lat: point.lat(), lng: point.lng() }
    });
    
    // Check if we got results and if they indicate a walkable area
    return result.results.some(place => {
      const types = place.types || [];
      return types.some(type => 
        ['street_address', 'route', 'neighborhood', 'park', 'point_of_interest'].includes(type)
      );
    });
  } catch (error) {
    console.warn('Geocoding check failed:', error);
    return false;
  }
}

async function generateWaypoints(
  start: google.maps.LatLng,
  targetDistance: number,
  numPoints: number = 4,
  geocoder: google.maps.Geocoder,
  baseAngle: number
): Promise<google.maps.LatLng[]> {
  const waypoints: google.maps.LatLng[] = [];
  const baseRadius = (targetDistance * 1609.34) / (2 * Math.PI); // Convert miles to meters
  const maxAttempts = 5;
  
  // Try different radii to find valid waypoints
  const radiusFactors = [1, 0.8, 1.2, 0.6, 1.4];
  
  for (let i = 0; i < numPoints; i++) {
    let pointFound = false;
    let attempts = 0;
    
    while (!pointFound && attempts < maxAttempts) {
      const radiusFactor = radiusFactors[attempts % radiusFactors.length];
      const radius = baseRadius * radiusFactor;
      
      // Calculate angle based on the base angle and position in the sequence
      const pointAngle = baseAngle + ((2 * Math.PI * i) / numPoints);
      const angleVariations = [
        0,
        Math.PI / 12,  // 15 degrees
        -Math.PI / 12,
        Math.PI / 6,   // 30 degrees
        -Math.PI / 6
      ];
      
      for (const angleVar of angleVariations) {
        const angle = pointAngle + angleVar;
        
        // Use haversine formula to calculate new point
        const R = 6371000; // Earth's radius in meters
        const φ1 = start.lat() * Math.PI / 180;
        const λ1 = start.lng() * Math.PI / 180;
        const d = radius;
        
        const φ2 = Math.asin(
          Math.sin(φ1) * Math.cos(d/R) +
          Math.cos(φ1) * Math.sin(d/R) * Math.cos(angle)
        );
        
        const λ2 = λ1 + Math.atan2(
          Math.sin(angle) * Math.sin(d/R) * Math.cos(φ1),
          Math.cos(d/R) - Math.sin(φ1) * Math.sin(φ2)
        );
        
        const lat = φ2 * 180 / Math.PI;
        const lng = λ2 * 180 / Math.PI;
        
        const point = new google.maps.LatLng(lat, lng);
        
        try {
          // Validate the point is in a walkable area
          const isValid = await isValidLocation(geocoder, point);
          if (isValid) {
            console.log(`Found valid waypoint ${i + 1} at [${lat.toFixed(4)}, ${lng.toFixed(4)}] (attempt ${attempts + 1})`);
            waypoints.push(point);
            pointFound = true;
            break;
          } else {
            console.log(`Invalid location at [${lat.toFixed(4)}, ${lng.toFixed(4)}], trying next angle`);
          }
        } catch (error) {
          console.warn('Error validating location:', error);
          continue;
        }
      }
      
      attempts++;
      if (!pointFound) {
        console.log(`Failed to find valid waypoint ${i + 1} on attempt ${attempts}, trying different radius`);
      }
    }
    
    if (!pointFound) {
      console.warn(`Could not find valid waypoint ${i + 1}, reducing number of waypoints`);
      break;
    }
  }
  
  return waypoints;
}

async function findRouteWithWaypoints(
  directionsService: google.maps.DirectionsService,
  geocoder: google.maps.Geocoder,
  start: google.maps.LatLng,
  targetDistance: number,
  routeType: RouteType,
  baseAngle: number
): Promise<google.maps.DirectionsResult> {
  // Start with fewer waypoints and increase if needed
  const initialWaypoints = routeType === 'loop' ? 2 : 1;
  const maxWaypoints = routeType === 'loop' ? 4 : 2;
  
  for (let numWaypoints = initialWaypoints; numWaypoints <= maxWaypoints; numWaypoints++) {
    try {
      console.log(`Attempting to generate route with ${numWaypoints} waypoints at angle ${(baseAngle * 180 / Math.PI).toFixed(1)}°`);
      
      const waypoints = await generateWaypoints(start, targetDistance, numWaypoints, geocoder, baseAngle);
      
      if (waypoints.length === 0) {
        console.warn('No valid waypoints found, will try with different parameters');
        continue;
      }
      
      console.log(`Generated ${waypoints.length} waypoints:`, waypoints.map(wp => ({
        lat: wp.lat().toFixed(4),
        lng: wp.lng().toFixed(4)
      })));
      
      // For loop routes, return to start
      const destination = routeType === 'loop' ? start : waypoints.pop()!;
      
      const request: google.maps.DirectionsRequest = {
        origin: start,
        destination: destination,
        waypoints: waypoints.map(point => ({
          location: point,
          stopover: false
        })),
        travelMode: google.maps.TravelMode.WALKING,
        optimizeWaypoints: false,
        provideRouteAlternatives: false
      };

      console.log('Requesting directions with:', {
        origin: `${start.lat().toFixed(4)}, ${start.lng().toFixed(4)}`,
        destination: `${destination.lat().toFixed(4)}, ${destination.lng().toFixed(4)}`,
        numWaypoints: waypoints.length
      });
      
      const result = await directionsService.route(request);
      
      // Validate the route distance
      const totalDistance = result.routes[0].legs.reduce(
        (sum, leg) => sum + (leg.distance?.value || 0),
        0
      ) / 1609.34; // Convert to miles
      
      console.log(`Route generated with distance ${totalDistance.toFixed(2)} miles (target: ${targetDistance} miles)`);
      
      if (Math.abs(totalDistance - targetDistance) / targetDistance <= 0.3) {
        return result;
      }
      
      console.log(`Route distance ${totalDistance.toFixed(2)} miles too far from target ${targetDistance} miles, trying with different waypoints`);
      
    } catch (error) {
      if (error.code === 'ZERO_RESULTS') {
        console.warn(`No route found with ${numWaypoints} waypoints, trying with ${numWaypoints + 1}`);
        continue;
      }
      console.error('Error generating route:', {
        error,
        code: error.code,
        message: error.message,
        status: error.status,
        numWaypoints,
        baseAngle: (baseAngle * 180 / Math.PI).toFixed(1) + '°'
      });
      throw error;
    }
  }
  
  throw new Error(`Could not find a suitable route within ${targetDistance} miles`);
}

// Calculate the similarity between two routes based on their waypoints
function calculateRouteSimilarity(route1: [number, number][], route2: [number, number][]): number {
  // Sample points from both routes for comparison
  const sampleSize = Math.min(10, Math.min(route1.length, route2.length));
  const step1 = Math.max(1, Math.floor(route1.length / sampleSize));
  const step2 = Math.max(1, Math.floor(route2.length / sampleSize));
  
  let totalSimilarity = 0;
  let comparisonCount = 0;
  
  // Compare sampled points
  for (let i = 0; i < route1.length; i += step1) {
    const [lat1, lng1] = route1[i];
    
    for (let j = 0; j < route2.length; j += step2) {
      const [lat2, lng2] = route2[j];
      
      // Calculate distance between points in meters
      const distance = calculateDistance(lat1, lng1, lat2, lng2);
      
      // Points closer than 100m contribute to similarity
      if (distance < 100) {
        totalSimilarity += 1 - (distance / 100);
      }
      
      comparisonCount++;
    }
  }
  
  // Return normalized similarity score (0 to 1)
  return totalSimilarity / comparisonCount;
}

// Calculate distance between two points in meters using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;
  
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
           Math.cos(φ1) * Math.cos(φ2) *
           Math.sin(Δλ/2) * Math.sin(Δλ/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
}

export async function generateGoogleMapsRoute(options: RouteOptions): Promise<RunRoute[]> {
  const { startLocation, distance, routeType = 'loop', numRoutes = 3, crimeData = [] } = options;
  const routes: RunRoute[] = [];
  const maxAttempts = 8;
  const similarityThreshold = 0.3;

  try {
    initGoogleMapsServices();
    
    if (!directionsService || !geocoder) {
      throw new Error('Google Maps services not initialized');
    }

    const start = new google.maps.LatLng(
      startLocation.geometry?.location?.lat() || 0,
      startLocation.geometry?.location?.lng() || 0
    );

    // Generate routes with different base angles
    const baseAngles = Array.from({ length: numRoutes }, (_, i) => (i * 2 * Math.PI) / numRoutes);
    
    // Try to generate each route with multiple attempts if needed
    for (let i = 0; i < numRoutes; i++) {
      let routeGenerated = false;
      let attempts = 0;
      
      while (!routeGenerated && attempts < maxAttempts) {
        try {
          // Use a different base angle for each route
          const baseAngle = baseAngles[i] + (attempts * Math.PI / 4);
          
          let result = await findRouteWithWaypoints(
            directionsService,
            geocoder,
            start,
            distance,
            routeType,
            baseAngle
          );

          const points: [number, number][] = result.routes[0].legs.flatMap(leg =>
            leg.steps.map(step => [
              step.start_location.lat(),
              step.start_location.lng()
            ] as [number, number])
          );

          // Check similarity with existing routes
          const isTooSimilar = routes.some(existingRoute => {
            const similarity = calculateRouteSimilarity(points, existingRoute.points || []);
            if (similarity > similarityThreshold) {
              console.log(`Route ${i + 1} attempt ${attempts + 1} too similar to existing route (similarity: ${similarity.toFixed(2)})`);
              return true;
            }
            return false;
          });

          if (isTooSimilar) {
            attempts++;
            continue;
          }

          const safety = calculateRouteSafety(points, crimeData);
          const route = result.routes[0];
          const totalDistance = route.legs.reduce(
            (sum, leg) => sum + (leg.distance?.value || 0),
            0
          ) / 1609.34; // Convert to miles

          // Only accept routes that are within 30% of target distance
          if (Math.abs(totalDistance - distance) / distance > 0.3) {
            console.log(`Route ${i + 1} attempt ${attempts + 1} distance (${totalDistance.toFixed(2)} miles) too far from target ${distance} miles`);
            attempts++;
            continue;
          }

          const totalElevation = route.legs.reduce(
            (sum, leg) => {
              const startElev = Math.abs(leg.start_location.lat() * 10);
              const endElev = Math.abs(leg.end_location.lat() * 10);
              return sum + Math.abs(endElev - startElev);
            },
            0
          );

          const locationResult = await geocoder.geocode({
            location: { lat: start.lat(), lng: start.lng() }
          });

          const neighborhood = locationResult.results[0]?.address_components.find(
            component => component.types.includes("neighborhood")
          )?.long_name || "Local";

          let difficulty: RouteDifficulty;
          if (totalDistance > 5 || totalElevation > 200) {
            difficulty = "Challenging";
          } else if (totalDistance > 3 || totalElevation > 100) {
            difficulty = "Moderate";
          } else {
            difficulty = "Easy";
          }

          const generatedType: GeneratedRouteType = 
            totalElevation > 100 ? "Hill" :
            safety.score >= 4.5 ? "Safe" :
            safety.score <= 2.5 ? "Urban" : "Loop";

          // Assign different colors to each route
          const routeColors = ['#3b82f6', '#10b981', '#f59e0b'];
          
          routes.push({
            id: `gen-${Date.now()}-${i}`,
            name: `${neighborhood} ${generatedType} Route`,
            location: locationResult.results[0]?.formatted_address || "Custom Route",
            distance: `${totalDistance.toFixed(1)} miles`,
            distanceNum: Number(totalDistance.toFixed(1)),
            elevation: `${totalElevation.toFixed(0)} ft`,
            difficulty,
            terrain: "Mixed",
            rating: 0,
            favorites: 0,
            imageUrl: "https://via.placeholder.com/400x200",
            safetyScore: safety.score,
            safetyExplanation: safety.explanation,
            points,
            directions: result,
            color: routeColors[i % routeColors.length]
          });

          routeGenerated = true;
          console.log(`Successfully generated route ${i + 1} with base angle ${(baseAngle * 180 / Math.PI).toFixed(1)}°`);
        } catch (error) {
          console.error(`Error generating route ${i + 1} (attempt ${attempts + 1}):`, error);
          attempts++;
          
          if (attempts >= maxAttempts) {
            console.error(`Failed to generate route ${i + 1} after ${maxAttempts} attempts`);
          }
        }
      }
    }
    
    if (routes.length === 0) {
      throw new Error('Could not generate any valid routes');
    }
    
    return routes;
  } catch (error) {
    console.error('Error generating routes:', error);
    throw error;
  }
}

// Initialize Google Maps services
let directionsService: google.maps.DirectionsService | null = null;
let geocoder: google.maps.Geocoder | null = null;

function initGoogleMapsServices() {
  if (!directionsService) {
    directionsService = new google.maps.DirectionsService();
  }
  if (!geocoder) {
    geocoder = new google.maps.Geocoder();
  }
}
