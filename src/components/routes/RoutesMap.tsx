import { useState, useEffect } from 'react';
import MapComponent from './MapComponent';
import { RunRoute } from './RouteCard';

interface RoutesMapProps {
  routes: RunRoute[];
  className?: string;
}

const RoutesMap = ({ routes, className = '' }: RoutesMapProps) => {
  const [routeCoordinates, setRouteCoordinates] = useState<{
    [key: string]: [number, number][];
  }>({});

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

  return (
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
          return {
            position: points[0],
            title: `Start: ${route?.name || 'Route'}`
          };
        })}
      />
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
