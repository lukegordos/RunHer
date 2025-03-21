import { useState, useEffect } from 'react';
import MapComponent from './MapComponent';
import { RunRoute } from './RouteCard';
import { CrimeData, fetchCrimeData, calculateSafetyScore } from '@/services/crimeDataService';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, ToggleLeft, ToggleRight } from 'lucide-react';

interface RoutesMapProps {
  routes: RunRoute[];
  className?: string;
}

const RoutesMap = ({ routes, className = '' }: RoutesMapProps) => {
  const [routeCoordinates, setRouteCoordinates] = useState<{
    [key: string]: [number, number][];
  }>({});
  const [crimeData, setCrimeData] = useState<CrimeData[]>([]);
  const [showCrimeData, setShowCrimeData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [safetyScores, setSafetyScores] = useState<{[routeId: string]: number}>({});

  useEffect(() => {
    // Generate sample coordinates for each route
    const routeCoords: { [key: string]: [number, number][] } = {};
    
    routes.forEach((route) => {
      // Use Washington DC as a default center (or any other location)
      // In a real app, you would use actual coordinates from your database or API
      const centerLat = 38.8977 + (Math.random() * 0.05 - 0.025);
      const centerLng = -77.0365 + (Math.random() * 0.05 - 0.025);
      
      // Create a route based on the distance (very simplified)
      const points: [number, number][] = [];
      const routeDistance = route.distanceNum;
      const steps = Math.max(20, Math.floor(routeDistance * 10));
      
      // Create a circular route
      for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * Math.PI * 2;
        // Scale based on distance (very approximate)
        const scaleFactor = routeDistance * 0.005;
        const lat = centerLat + Math.sin(angle) * scaleFactor;
        const lng = centerLng + Math.cos(angle) * scaleFactor;
        points.push([lat, lng]);
      }
      
      // Close the loop
      points.push(points[0]);
      
      routeCoords[route.id] = points;
    });
    
    setRouteCoordinates(routeCoords);
  }, [routes]);

  // Fetch crime data when route coordinates change
  useEffect(() => {
    const fetchCrimeDataForRoutes = async () => {
      if (Object.keys(routeCoordinates).length === 0) return;
      
      setLoading(true);
      
      try {
        const center = calculateCenter();
        // Fetch crime data for the center of all routes
        const crimeResults = await fetchCrimeData(center[0], center[1], 10);
        setCrimeData(crimeResults);
        
        // Calculate safety scores for each route based on nearby crimes
        const scores: {[routeId: string]: number} = {};
        
        for (const [routeId, points] of Object.entries(routeCoordinates)) {
          if (points.length === 0) continue;
          
          // Use the starting point of each route
          const startPoint = points[0];
          
          // Find crimes within 2km of the route's starting point
          const nearbyCrimes = crimeResults.filter(crime => {
            const distance = calculateDistance(
              startPoint[0], 
              startPoint[1], 
              crime.location.latitude, 
              crime.location.longitude
            );
            return distance <= 2; // 2km radius
          });
          
          // Calculate safety score
          scores[routeId] = calculateSafetyScore(nearbyCrimes);
        }
        
        setSafetyScores(scores);
      } catch (error) {
        console.error('Error fetching crime data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCrimeDataForRoutes();
  }, [routeCoordinates]);

  // Calculate center point (average of all routes' first points)
  const calculateCenter = (): [number, number] => {
    if (Object.keys(routeCoordinates).length === 0) {
      return [38.8977, -77.0365]; // Default to DC
    }
    
    let totalLat = 0;
    let totalLng = 0;
    let count = 0;
    
    Object.values(routeCoordinates).forEach((points) => {
      if (points.length > 0) {
        totalLat += points[0][0];
        totalLng += points[0][1];
        count++;
      }
    });
    
    return count > 0 ? [totalLat / count, totalLng / count] : [38.8977, -77.0365];
  };
  
  // Calculate distance between two points in km (Haversine formula)
  const calculateDistance = (
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
  };
  
  const deg2rad = (deg: number): number => {
    return deg * (Math.PI/180);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading crime data...</div>
          ) : (
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-runher" />
              <span className="text-sm font-medium">
                Safety data available for this area
              </span>
            </div>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center space-x-1"
          onClick={() => setShowCrimeData(!showCrimeData)}
        >
          {showCrimeData ? (
            <>
              <ToggleRight className="h-4 w-4 mr-1" />
              <span>Hide Crime Data</span>
            </>
          ) : (
            <>
              <ToggleLeft className="h-4 w-4 mr-1" />
              <span>Show Crime Data</span>
            </>
          )}
        </Button>
      </div>
      
      <div className={`rounded-lg overflow-hidden border ${className}`}>
        <MapComponent
          center={calculateCenter()}
          zoom={12}
          height="500px"
          routes={Object.entries(routeCoordinates).map(([id, points], index) => {
            const route = routes.find(r => r.id === id);
            return {
              points,
              color: getRouteColor(index),
              name: route?.name || 'Route'
            };
          })}
          markers={Object.entries(routeCoordinates).map(([id, points]) => {
            const route = routes.find(r => r.id === id);
            const safetyScore = safetyScores[id];
            
            return {
              position: points[0],
              title: `Start: ${route?.name || 'Route'}${safetyScore ? ` (Safety: ${safetyScore}/5)` : ''}`
            };
          })}
          crimeData={crimeData}
          showCrimeData={showCrimeData}
        />
      </div>
      
      {showCrimeData && crimeData.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm flex items-start">
          <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Safety Information</p>
            <p className="text-amber-700 mt-1">
              The crime data shown is based on reported incidents in the area. 
              Always exercise caution when running, especially in unfamiliar areas or during early morning/late evening hours.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get different colors for routes
const getRouteColor = (index: number): string => {
  const colors = [
    '#FF5757', // RunHer primary
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EC4899', // Pink
  ];
  
  return colors[index % colors.length];
};

export default RoutesMap;
