import { useEffect, useRef, useState, ReactNode } from 'react';
import { CrimeData } from '@/services/crimeDataService';

// Extended types for routes and markers with info windows
interface RouteWithInfoWindow extends google.maps.DirectionsRenderer {
  infoWindow?: google.maps.InfoWindow;
}

interface PolylineWithInfoWindow extends google.maps.Polyline {
  infoWindow?: google.maps.InfoWindow;
}

interface MarkerWithInfoWindow extends google.maps.Marker {
  infoWindow?: google.maps.InfoWindow;
}

type MapRoute = RouteWithInfoWindow | PolylineWithInfoWindow;

interface MapComponentProps {
  center: google.maps.LatLng | [number, number];
  zoom: number;
  routes?: {
    points?: [number, number][];
    color?: string;
    name?: string;
    directions?: google.maps.DirectionsResult;
  }[];
  markers?: {
    position: google.maps.LatLng | [number, number];
    title?: string;
  }[];
  crimeData?: CrimeData[];
  showCrimeData?: boolean;
  height?: string;
  className?: string;
  onCenterChanged?: (newCenter: [number, number]) => void;
  children?: ReactNode;
}

const MapComponent = ({
  center,
  zoom,
  routes = [],
  markers = [],
  crimeData = [],
  showCrimeData = true,
  height = '400px',
  className = '',
  onCenterChanged,
  children,
}: MapComponentProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const routesRef = useRef<MapRoute[]>([]);
  const crimeMarkersRef = useRef<MarkerWithInfoWindow[]>([]);
  const legendRef = useRef<HTMLDivElement | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || googleMapRef.current) return;

    const centerLatLng = Array.isArray(center) 
      ? new google.maps.LatLng(center[0], center[1])
      : center;

    const mapOptions: google.maps.MapOptions = {
      center: centerLatLng,
      zoom,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
        { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
        { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
      ],
    };

    const newMap = new google.maps.Map(mapRef.current, mapOptions);
    googleMapRef.current = newMap;
    setMap(newMap);

    // Add legend
    const legend = document.createElement('div');
    legend.className = 'bg-background/90 p-4 rounded-lg shadow-lg';
    legend.style.margin = '10px';
    legend.innerHTML = `
      <h4 class="font-medium mb-2">Crime Incidents</h4>
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded-full bg-red-500"></div>
          <span class="text-sm">Violent Crime</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded-full bg-yellow-500"></div>
          <span class="text-sm">Property Crime</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded-full bg-blue-500"></div>
          <span class="text-sm">Other Crime</span>
        </div>
      </div>
    `;
    newMap.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(legend);
    legendRef.current = legend;

    return () => {
      if (legendRef.current) {
        legendRef.current.remove();
      }
    };
  }, []);

  // Update center when it changes
  useEffect(() => {
    if (!map) return;

    const centerLatLng = Array.isArray(center) 
      ? new google.maps.LatLng(center[0], center[1])
      : center;

    map.setCenter(centerLatLng);
  }, [center, map]);

  // Update markers
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    markers.forEach(({ position, title }) => {
      const latLng = Array.isArray(position)
        ? new google.maps.LatLng(position[0], position[1])
        : position;

      const marker = new google.maps.Marker({
        position: latLng,
        map,
        title,
      });
      markersRef.current.push(marker);
    });
  }, [markers, map]);

  // Update routes
  useEffect(() => {
    if (!map) return;

    // Clear existing routes
    routesRef.current.forEach(route => {
      if (route instanceof google.maps.Polyline) {
        route.setMap(null);
      } else {
        route.setMap(null);
      }
      route.infoWindow?.close();
    });
    routesRef.current = [];

    // Add new routes
    routes.forEach((route, index) => {
      if (route.directions) {
        // Create DirectionsRenderer for routes with directions
        const directionsRenderer = new google.maps.DirectionsRenderer({
          map,
          directions: route.directions,
          suppressMarkers: true,
          routeIndex: 0, // Force first route
          preserveViewport: true, // Don't auto-zoom
          polylineOptions: {
            strokeColor: route.color || '#3b82f6',
            strokeOpacity: 0.8,
            strokeWeight: 4,
            clickable: true,
            zIndex: 2 // Keep routes above other map elements
          }
        }) as RouteWithInfoWindow;

        // Add click listener to show route name
        const path = route.directions.routes[0].overview_path;
        const midPoint = path[Math.floor(path.length / 2)];
        
        const infoWindow = new google.maps.InfoWindow({
          content: `<div class="p-2 font-medium">${route.name}</div>`,
          position: midPoint
        });

        directionsRenderer.infoWindow = infoWindow;

        google.maps.event.addListener(directionsRenderer.getMap(), 'click', (event: { latLng: google.maps.LatLng }) => {
          const clickPoint = event.latLng;
          const isNearRoute = path.some(point => {
            const distance = google.maps.geometry.spherical.computeDistanceBetween(
              clickPoint,
              point
            );
            return distance < 50; // Within 50 meters
          });

          if (isNearRoute) {
            // Close other info windows
            routesRef.current.forEach(r => r.infoWindow?.close());
            infoWindow.open(map);
          }
        });

        routesRef.current.push(directionsRenderer);
      } else if (route.points) {
        // Create Polyline for routes without directions
        const pathPoints = route.points.map((point: [number, number]): google.maps.LatLngLiteral => ({
          lat: point[0],
          lng: point[1]
        }));
        
        const polyline = new google.maps.Polyline({
          path: pathPoints,
          map,
          strokeColor: route.color || '#3b82f6',
          strokeOpacity: 0.8,
          strokeWeight: 4,
          clickable: true,
          zIndex: 2 // Keep routes above other map elements
        }) as PolylineWithInfoWindow;

        const midPointIndex = Math.floor(pathPoints.length / 2);
        const midPoint = new google.maps.LatLng(
          pathPoints[midPointIndex].lat,
          pathPoints[midPointIndex].lng
        );
        
        const infoWindow = new google.maps.InfoWindow({
          content: `<div class="p-2 font-medium">${route.name}</div>`,
          position: midPoint
        });

        polyline.infoWindow = infoWindow;

        google.maps.event.addListener(polyline, 'click', () => {
          // Close other info windows
          routesRef.current.forEach(r => r.infoWindow?.close());
          infoWindow.open(map);
        });

        routesRef.current.push(polyline);
      }
    });

    // Add click listener to map to close info windows when clicking away from routes
    google.maps.event.addListener(map, 'click', (event: { latLng: google.maps.LatLng }) => {
      const clickPoint = event.latLng;
      let clickedOnRoute = false;

      for (const route of routesRef.current) {
        if (route instanceof google.maps.DirectionsRenderer) {
          const path = route.getDirections()?.routes[0].overview_path;
          if (path) {
            clickedOnRoute = path.some(point => {
              const distance = google.maps.geometry.spherical.computeDistanceBetween(
                clickPoint,
                point
              );
              return distance < 50;
            });
            if (clickedOnRoute) break;
          }
        } else if (route instanceof google.maps.Polyline) {
          const path = route.getPath();
          for (let i = 0; i < path.getLength(); i++) {
            const distance = google.maps.geometry.spherical.computeDistanceBetween(
              clickPoint,
              path.getAt(i)
            );
            if (distance < 50) {
              clickedOnRoute = true;
              break;
            }
          }
          if (clickedOnRoute) break;
        }
      }

      if (!clickedOnRoute) {
        routesRef.current.forEach(r => r.infoWindow?.close());
      }
    });
  }, [routes, map]);

  // Update crime data markers
  useEffect(() => {
    if (!map || !showCrimeData) return;

    // Clear existing crime markers
    crimeMarkersRef.current.forEach(marker => marker.setMap(null));
    crimeMarkersRef.current = [];

    // Add new crime markers
    crimeData.forEach(crime => {
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-3">
            <h3 class="font-semibold mb-1">${crime.type}</h3>
            <p class="text-sm mb-2">${crime.description}</p>
            <div class="text-xs text-muted-foreground">
              <div>Date: ${new Date(crime.date).toLocaleDateString()}</div>
              ${crime.location.address ? `<div>Location: ${crime.location.address}</div>` : ''}
              <div>Severity: ${crime.severity}</div>
            </div>
          </div>
        `,
      });

      const marker = new google.maps.Marker({
        position: new google.maps.LatLng(
          crime.location.latitude,
          crime.location.longitude
        ),
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: crime.severity === 'high' ? '#ef4444' : 
                    crime.severity === 'medium' ? '#eab308' : '#3b82f6',
          fillOpacity: 0.7,
          strokeWeight: 1,
          strokeColor: '#ffffff',
        },
        title: `${crime.type} - ${crime.description}`,
      }) as MarkerWithInfoWindow;

      marker.addListener('click', () => {
        // Close any other open info windows
        crimeMarkersRef.current.forEach(m => {
          if (m.infoWindow) {
            m.infoWindow.close();
          }
        });
        infoWindow.open(map, marker);
      });

      // Store the info window with the marker
      marker.infoWindow = infoWindow;
      crimeMarkersRef.current.push(marker);
    });

    // Close info windows when clicking elsewhere on the map
    map.addListener('click', () => {
      crimeMarkersRef.current.forEach(marker => {
        if (marker.infoWindow) {
          marker.infoWindow.close();
        }
      });
    });
  }, [crimeData, showCrimeData, map]);

  return (
    <div 
      ref={mapRef} 
      style={{ height }} 
      className={`w-full relative rounded-lg overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
};

export default MapComponent;
