import { useEffect, useRef, useState } from 'react';
import { CrimeData } from '@/services/crimeDataService';

interface MapComponentProps {
  center: [number, number];
  zoom: number;
  routes?: {
    points: [number, number][];
    color?: string;
    name?: string;
  }[];
  markers?: {
    position: [number, number];
    title?: string;
  }[];
  crimeData?: CrimeData[];
  showCrimeData?: boolean;
  height?: string;
  className?: string;
  onCenterChanged?: (newCenter: [number, number]) => void;
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
}: MapComponentProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const routesRef = useRef<google.maps.Polyline[]>([]);
  const crimeMarkersRef = useRef<google.maps.Marker[]>([]);
  const legendRef = useRef<HTMLDivElement | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || googleMapRef.current) return;

    const mapOptions: google.maps.MapOptions = {
      center: { lat: center[0], lng: center[1] },
      zoom,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    };

    const newMap = new google.maps.Map(mapRef.current, mapOptions);
    googleMapRef.current = newMap;
    setMap(newMap);

    // Add legend
    const legend = document.createElement('div');
    legend.className = 'map-legend';
    legend.style.cssText = `
      background: white;
      padding: 10px;
      margin: 10px;
      border: 1px solid #999;
      border-radius: 4px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      margin-bottom: 24px;
    `;

    const title = document.createElement('div');
    title.innerHTML = '<strong>Crime Severity</strong>';
    legend.appendChild(title);

    const severities = [
      { label: 'High', color: '#ff0000' },
      { label: 'Medium', color: '#ffa500' },
      { label: 'Low', color: '#ffff00' }
    ];

    severities.forEach(({ label, color }) => {
      const item = document.createElement('div');
      item.style.marginTop = '5px';
      item.innerHTML = `
        <span style="
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: ${color};
          border: 2px solid #fff;
          box-shadow: 0 0 4px rgba(0,0,0,0.5);
          margin-right: 5px;
          vertical-align: middle;
        "></span>
        <span style="vertical-align: middle;">${label}</span>
      `;
      legend.appendChild(item);
    });

    newMap.controls[google.maps.ControlPosition.BOTTOM_RIGHT].push(legend);
    legendRef.current = legend;

    // Listen for center changes
    newMap.addListener('center_changed', () => {
      if (onCenterChanged) {
        const newCenter = newMap.getCenter();
        if (newCenter) {
          onCenterChanged([newCenter.lat(), newCenter.lng()]);
        }
      }
    });

    return () => {
      if (googleMapRef.current) {
        legend.remove();
      }
    };
  }, []);

  // Update map center and zoom
  useEffect(() => {
    if (!googleMapRef.current) return;
    
    googleMapRef.current.setCenter({ lat: center[0], lng: center[1] });
    googleMapRef.current.setZoom(zoom);
  }, [center, zoom]);

  // Update routes
  useEffect(() => {
    if (!googleMapRef.current) return;

    // Clear existing routes
    routesRef.current.forEach(route => route.setMap(null));
    routesRef.current = [];

    // Add new routes
    routes.forEach(route => {
      const path = route.points.map(([lat, lng]) => ({ lat, lng }));
      const polyline = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: route.color || '#FF5757',
        strokeOpacity: 0.8,
        strokeWeight: 5,
      });

      polyline.setMap(googleMapRef.current);
      routesRef.current.push(polyline);

      if (route.name) {
        const infoWindow = new google.maps.InfoWindow({
          content: route.name
        });

        polyline.addListener('click', (e: google.maps.PolyMouseEvent) => {
          if (e.latLng) {
            infoWindow.setPosition(e.latLng);
            infoWindow.open(googleMapRef.current);
          }
        });
      }
    });

    return () => {
      routesRef.current.forEach(route => route.setMap(null));
      routesRef.current = [];
    };
  }, [routes]);

  // Update markers
  useEffect(() => {
    if (!googleMapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    markers.forEach(marker => {
      const newMarker = new google.maps.Marker({
        position: { lat: marker.position[0], lng: marker.position[1] },
        map: googleMapRef.current,
        title: marker.title
      });

      if (marker.title) {
        const infoWindow = new google.maps.InfoWindow({
          content: marker.title
        });

        newMarker.addListener('click', () => {
          infoWindow.open(googleMapRef.current, newMarker);
        });
      }

      markersRef.current.push(newMarker);
    });

    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, [markers]);

  // Update crime data
  useEffect(() => {
    if (!googleMapRef.current) return;

    // Clear existing crime markers
    crimeMarkersRef.current.forEach(marker => marker.setMap(null));
    crimeMarkersRef.current = [];

    if (!showCrimeData) return;

    // Add new crime markers
    crimeData.forEach(crime => {
      if (!crime.location || typeof crime.location.latitude !== 'number' || typeof crime.location.longitude !== 'number') {
        return;
      }

      const color = crime.severity === 'high' ? '#ff0000' : 
                   crime.severity === 'medium' ? '#ffa500' : 
                   '#ffff00';

      const marker = new google.maps.Marker({
        position: { 
          lat: crime.location.latitude, 
          lng: crime.location.longitude 
        },
        map: googleMapRef.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 6
        }
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div>
            <strong>${crime.type}</strong><br/>
            ${crime.description}<br/>
            <small>${new Date(crime.date).toLocaleDateString()}</small>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(googleMapRef.current, marker);
      });

      crimeMarkersRef.current.push(marker);
    });

    return () => {
      crimeMarkersRef.current.forEach(marker => marker.setMap(null));
      crimeMarkersRef.current = [];
    };
  }, [crimeData, showCrimeData]);

  // Update legend visibility
  useEffect(() => {
    if (legendRef.current) {
      legendRef.current.style.display = showCrimeData ? 'block' : 'none';
    }
  }, [showCrimeData]);

  return (
    <div 
      ref={mapRef} 
      style={{ 
        height: height,
        width: '100%',
        borderRadius: '0.5rem',
        overflow: 'hidden'
      }}
      className={`shadow-lg ${className}`}
    />
  );
};

export default MapComponent;
