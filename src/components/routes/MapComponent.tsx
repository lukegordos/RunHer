import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for the default marker icon issue in react-leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { CrimeData } from '@/services/crimeDataService';

// Create default icon once
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Create custom icons for different severity levels
const createCrimeMarkerIcon = (severity: 'low' | 'medium' | 'high') => {
  const color = severity === 'high' ? '#ff0000' : 
               severity === 'medium' ? '#ffa500' : 
               '#ffff00';
               
  return L.divIcon({
    className: 'crime-marker',
    html: `<div style="
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background-color: ${color};
      border: 2px solid #fff;
      box-shadow: 0 0 4px rgba(0,0,0,0.5);
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });
};

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
  const legendRef = useRef<L.Control | null>(null);

  // Initialize map only once
  useEffect(() => {
    if (mapRef.current && !leafletMapRef.current) {
      console.log('Initializing map with center:', center, 'zoom:', zoom);
      leafletMapRef.current = L.map(mapRef.current).setView(center, zoom);

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(leafletMapRef.current);
      
      // Create a layer group for crime data
      crimeLayerRef.current = L.layerGroup().addTo(leafletMapRef.current);
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        crimeLayerRef.current = null;
        legendRef.current = null;
      }
    };
  }, []); // Empty dependency array since we only want to initialize once

  // Update map center and zoom when props change
  useEffect(() => {
    if (leafletMapRef.current) {
      console.log('Updating map center:', center, 'zoom:', zoom);
      leafletMapRef.current.setView(center, zoom, { animate: false });
    }
  }, [center, zoom]);

  // Add routes to the map
  useEffect(() => {
    if (!leafletMapRef.current) return;

    // Store references to created layers so we can remove them later
    const routeLayers: L.Layer[] = [];

    // Add new routes
    routes.forEach((route) => {
      const polyline = L.polyline(route.points, {
        color: route.color || '#FF5757',
        weight: 5,
        opacity: 0.8
      });

      if (route.name) {
        polyline.bindPopup(route.name);
      }

      polyline.addTo(leafletMapRef.current!);
      routeLayers.push(polyline);
    });

    return () => {
      // Clean up routes when component updates
      routeLayers.forEach(layer => {
        if (leafletMapRef.current) {
          leafletMapRef.current.removeLayer(layer);
        }
      });
    };
  }, [routes]);

  // Add markers to the map
  useEffect(() => {
    if (!leafletMapRef.current) return;

    // Store references to created markers
    const markerLayers: L.Marker[] = [];

    // Add new markers
    markers.forEach((marker) => {
      const m = L.marker(marker.position);
      if (marker.title) {
        m.bindPopup(marker.title);
      }
      m.addTo(leafletMapRef.current!);
      markerLayers.push(m);
    });

    return () => {
      // Clean up markers when component updates
      markerLayers.forEach(marker => {
        if (leafletMapRef.current) {
          leafletMapRef.current.removeLayer(marker);
        }
      });
    };
  }, [markers]);

  // Memoize crime markers creation
  const createCrimeMarkers = useMemo(() => {
    if (!showCrimeData || !crimeData.length) return [];

    return crimeData.map(crime => {
      if (!crime.location || typeof crime.location.latitude !== 'number' || typeof crime.location.longitude !== 'number') {
        return null;
      }

      const position: [number, number] = [crime.location.latitude, crime.location.longitude];
      const marker = L.marker(position, {
        icon: createCrimeMarkerIcon(crime.severity)
      });

      marker.bindPopup(`
        <div>
          <strong>${crime.type}</strong><br/>
          ${crime.description}<br/>
          <small>${new Date(crime.date).toLocaleDateString()}</small>
        </div>
      `);

      return marker;
    }).filter(Boolean) as L.Marker[];
  }, [crimeData, showCrimeData]);

  // Add crime data to the map
  useEffect(() => {
    if (!leafletMapRef.current || !crimeLayerRef.current) return;

    // Clear existing crime markers
    crimeLayerRef.current.clearLayers();

    // Remove existing legend if it exists
    if (legendRef.current && leafletMapRef.current) {
      legendRef.current.remove();
      legendRef.current = null;
      setLegendAdded(false);
    }

    if (!showCrimeData) {
      console.log('Crime data hidden, not adding markers');
      return;
    }

    // Add crime markers
    const markers = createCrimeMarkers;
    markers.forEach(marker => {
      marker.addTo(crimeLayerRef.current!);
    });

    // Add legend if not already added
    if (!legendAdded && markers.length > 0 && leafletMapRef.current) {
      console.log('Adding legend');
      const LegendControl = L.Control.extend({
        onAdd: () => {
          const div = L.DomUtil.create('div', 'info legend');
          div.style.backgroundColor = 'white';
          div.style.padding = '10px';
          div.style.borderRadius = '5px';
          div.style.border = '2px solid rgba(0,0,0,0.2)';
          
          div.innerHTML = `
            <div style="margin-bottom: 5px"><strong>Crime Severity</strong></div>
            <div style="display: flex; align-items: center; margin-bottom: 3px">
              <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #ff0000; border: 2px solid #fff; margin-right: 5px"></div>
              High
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 3px">
              <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #ffa500; border: 2px solid #fff; margin-right: 5px"></div>
              Medium
            </div>
            <div style="display: flex; align-items: center">
              <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #ffff00; border: 2px solid #fff; margin-right: 5px"></div>
              Low
            </div>
          `;
          return div;
        }
      });

      legendRef.current = new LegendControl({ position: 'bottomright' });
      legendRef.current.addTo(leafletMapRef.current);
      setLegendAdded(true);
    }
  }, [createCrimeMarkers, showCrimeData]);

  return (
    <div 
      ref={mapRef} 
      style={{ height, width: '100%' }}
      className={className}
    />
  );
};

export default MapComponent;
