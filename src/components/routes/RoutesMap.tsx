import { useEffect, useState, useCallback, useMemo } from 'react';
import MapComponent from './MapComponent';
import { fetchCrimeData, CrimeData } from '@/services/crimeDataService';
import { Button } from '@/components/ui/button';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

interface RoutesMapProps {
  routes?: {
    points: [number, number][];
    color?: string;
    name?: string;
  }[];
  height?: string;
  className?: string;
}

const RoutesMap = ({ routes = [], height, className }: RoutesMapProps) => {
  // DC coordinates - memoize to prevent unnecessary re-renders
  const center = useMemo<[number, number]>(() => [38.9072, -77.0369], []);
  const zoom = 13;

  const [crimeData, setCrimeData] = useState<CrimeData[]>([]);
  const [showCrimeData, setShowCrimeData] = useState(true);
  const [loading, setLoading] = useState(false);

  // Memoize the fetch function to prevent unnecessary re-creation
  const fetchCrimeDataForLocation = useCallback(async () => {
    console.log('RoutesMap: Starting to fetch crime data...');
    setLoading(true);
    try {
      // For now, just fetch crimes around DC center
      const crimes = await fetchCrimeData(center[0], center[1], 5);
      console.log('RoutesMap: Successfully fetched crimes:', crimes.length);
      setCrimeData(crimes);
    } catch (error) {
      console.error('RoutesMap: Error fetching crime data:', error);
      setCrimeData([]); // Reset crime data on error
    } finally {
      setLoading(false);
    }
  }, [center]);

  // Initial fetch when component mounts
  useEffect(() => {
    fetchCrimeDataForLocation();
  }, [fetchCrimeDataForLocation]);

  // Memoize the toggle handler to prevent unnecessary re-creation
  const handleToggleCrimeData = useCallback(() => {
    setShowCrimeData(prev => !prev);
  }, []);

  // Memoize MapComponent props to prevent unnecessary re-renders
  const mapProps = useMemo(() => ({
    center,
    zoom,
    routes,
    crimeData,
    showCrimeData,
    height,
    className
  }), [center, zoom, routes, crimeData, showCrimeData, height, className]);

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-[1000]">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleToggleCrimeData}
          className="bg-white hover:bg-gray-100"
        >
          {showCrimeData ? (
            <>
              <EyeOffIcon className="w-4 h-4 mr-2" />
              Hide Crime Data
            </>
          ) : (
            <>
              <EyeIcon className="w-4 h-4 mr-2" />
              Show Crime Data
            </>
          )}
        </Button>
      </div>
      {loading && (
        <div className="absolute top-2 left-2 z-[1000] bg-white px-3 py-1 rounded-md shadow">
          Loading crime data...
        </div>
      )}
      <MapComponent {...mapProps} />
    </div>
  );
};

export default RoutesMap;
