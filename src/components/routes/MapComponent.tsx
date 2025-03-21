import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for the default marker icon issue in react-leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { CrimeData } from '@/services/crimeDataService';
import { createCrimeMarkerIcon, createCrimeLegendControl } from './CrimeMarker';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapComponentProps {
  center: [number, number]; // [latitude, longitude]
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
}: MapComponentProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const [legendAdded, setLegendAdded] = useState(false);
  const crimeLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    // Initialize map if it doesn't exist
    if (mapRef.current && !leafletMapRef.current) {
      leafletMapRef.current = L.map(mapRef.current).setView(center, zoom);

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(leafletMapRef.current);
      
      // Create a layer group for crime data
      crimeLayerRef.current = L.layerGroup().addTo(leafletMapRef.current);
    }

    return () => {
      // Clean up map on component unmount
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        crimeLayerRef.current = null;
      }
    };
  }, []);

  // Update map center and zoom when props change
  useEffect(() => {
    if (leafletMapRef.current) {
      leafletMapRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  // Add routes to the map
  useEffect(() => {
    if (!leafletMapRef.current) return;

    // Clear existing polylines
    leafletMapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Polyline) {
        leafletMapRef.current?.removeLayer(layer);
      }
    });

    // Add new routes
    routes.forEach((route) => {
      const polyline = L.polyline(route.points, {
        color: route.color || '#FF5757', // Default to RunHer color
        weight: 5,
        opacity: 0.8
      }).addTo(leafletMapRef.current!);

      if (route.name) {
        polyline.bindPopup(route.name);
      }
    });
  }, [routes]);

  // Add markers to the map
  useEffect(() => {
    if (!leafletMapRef.current) return;

    // Clear existing markers
    leafletMapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        leafletMapRef.current?.removeLayer(layer);
      }
    });

    // Add new markers
    markers.forEach((marker) => {
      const m = L.marker(marker.position).addTo(leafletMapRef.current!);
      if (marker.title) {
        m.bindPopup(marker.title);
      }
    });
  }, [markers]);
  
  // Add crime data to the map
  useEffect(() => {
    if (!leafletMapRef.current || !crimeLayerRef.current) return;
    
    // Clear existing crime markers
    crimeLayerRef.current.clearLayers();
    
    // If crime data should be shown
    if (showCrimeData && crimeData.length > 0) {
      // Add crime legend if not already added
      if (!legendAdded && leafletMapRef.current) {
        createCrimeLegendControl().addTo(leafletMapRef.current);
        setLegendAdded(true);
      }
      
      // Add crime markers
      crimeData.forEach(crime => {
        const position: [number, number] = [crime.location.latitude, crime.location.longitude];
        const marker = L.marker(position, {
          icon: createCrimeMarkerIcon(crime.severity)
        });
        
        // Create popup content
        const popupContent = `
          <div>
            <strong>${crime.description}</strong>
            <p>Date: ${new Date(crime.date).toLocaleDateString()}</p>
            <p>Severity: ${crime.severity.charAt(0).toUpperCase() + crime.severity.slice(1)}</p>
            ${crime.location.address ? `<p>Address: ${crime.location.address}</p>` : ''}
          </div>
        `;
        
        marker.bindPopup(popupContent);
        marker.addTo(crimeLayerRef.current!);
      });
    }
  }, [crimeData, showCrimeData, legendAdded]);

  return (
    <div 
      ref={mapRef} 
      className={`map-container ${className}`} 
      style={{ height, width: '100%' }}
    />
  );
};

export default MapComponent;
