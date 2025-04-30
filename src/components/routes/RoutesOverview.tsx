import { useState, useEffect, useMemo } from "react";
import { RunRoute } from "./RouteCard";
import MapComponent from "./MapComponent";
import { CrimeData } from "@/services/crimeDataService";

interface RoutesOverviewProps {
  routes: RunRoute[];
  className?: string;
}

interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

const RoutesOverview = ({ routes, className = "" }: RoutesOverviewProps) => {
  const [selectedRoute, setSelectedRoute] = useState<RunRoute | null>(null);
  const [crimeData, setCrimeData] = useState<CrimeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [routeDirections, setRouteDirections] = useState<{[key: string]: google.maps.DirectionsResult}>({});

  // Convert route points to LatLng objects and get directions
  useEffect(() => {
    const directionsService = new google.maps.DirectionsService();

    const loadDirections = async () => {
      const newDirections: {[key: string]: google.maps.DirectionsResult} = {};

      for (const route of routes) {
        if (route.points && route.points.length > 0) {
          try {
            // Create waypoints from route points
            const waypoints = route.points.slice(1, -1).map(point => ({
              location: new google.maps.LatLng(point[0], point[1]),
              stopover: true
            }));

            // Get directions
            const result = await directionsService.route({
              origin: new google.maps.LatLng(route.points[0][0], route.points[0][1]),
              destination: new google.maps.LatLng(
                route.points[route.points.length - 1][0],
                route.points[route.points.length - 1][1]
              ),
              waypoints,
              travelMode: google.maps.TravelMode.WALKING,
              optimizeWaypoints: false
            });

            newDirections[route.id] = result;
          } catch (error) {
            console.error(`Error getting directions for route ${route.id}:`, error);
          }
        }
      }

      setRouteDirections(newDirections);
    };

    loadDirections();
  }, [routes]);

  // Find center point from all routes
  const defaultCenter = new google.maps.LatLng(38.9072, -77.0369); // Default to DC
  const center = routes.length > 0 && routes[0].points && routes[0].points.length > 0
    ? new google.maps.LatLng(routes[0].points[0][0], routes[0].points[0][1])
    : defaultCenter;

  // Convert routes to map display format
  const mapRoutes = useMemo(() => {
    return routes.map(route => ({
      points: route.points,
      color: route.color,
      name: route.name,
      directions: routeDirections[route.id]
    }));
  }, [routes, routeDirections]);

  // Prepare markers for map display
  const mapMarkers = routes.map(route => {
    if (!route.points || route.points.length === 0) return null;
    return {
      position: new google.maps.LatLng(route.points[0][0], route.points[0][1]),
      title: route.name
    };
  }).filter((marker): marker is NonNullable<typeof marker> => marker !== null);

  return (
    <div className={className}>
      <MapComponent
        center={center}
        zoom={13}
        routes={mapRoutes}
        markers={mapMarkers}
        crimeData={crimeData}
        showCrimeData={true}
        height="500px"
        className="shadow-lg"
      />
    </div>
  );
};

export default RoutesOverview;
