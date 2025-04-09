import { useEffect, useState, useCallback, useMemo } from 'react';
import MapComponent from './MapComponent';
import { fetchCrimeData, CrimeData, calculateSafetyScore } from '@/services/crimeDataService';
import { Button } from '@/components/ui/button';
import { EyeIcon, EyeOffIcon, NewspaperIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  const [safetyScore, setSafetyScore] = useState<{score: number, newsAdjusted: boolean} | null>(null);

  // Memoize the fetch function to prevent unnecessary re-creation
  const fetchCrimeDataForLocation = useCallback(async () => {
    console.log('RoutesMap: Starting to fetch crime data...');
    setLoading(true);
    try {
      // For now, just fetch crimes around DC center
      const crimes = await fetchCrimeData(center[0], center[1], 5);
      console.log('RoutesMap: Successfully fetched crimes:', crimes.length);
      setCrimeData(crimes);
      
      // Calculate safety score with news data integration
      const score = await calculateSafetyScore(crimes, center[0], center[1]);
      setSafetyScore(score);
      console.log('RoutesMap: Safety score calculated:', score);
    } catch (error) {
      console.error('RoutesMap: Error fetching crime data:', error);
      setCrimeData([]); // Reset crime data on error
      setSafetyScore(null);
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
      <div className="absolute top-2 right-2 z-[1000] flex flex-col gap-2">
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
        
        {safetyScore && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-white rounded-md p-2 shadow flex items-center justify-between">
                  <span className="font-medium">Safety Score: {safetyScore.score.toFixed(1)}/5</span>
                  {safetyScore.newsAdjusted && (
                    <Badge variant="outline" className="ml-2 bg-blue-50">
                      <NewspaperIcon className="w-3 h-3 mr-1" />
                      News
                    </Badge>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Safety score based on crime data {safetyScore.newsAdjusted ? 'and recent news' : ''}</p>
                {safetyScore.newsAdjusted && (
                  <p className="text-xs mt-1">Includes predictive analysis from news in the past 14 days</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      {loading && (
        <div className="absolute top-2 left-2 z-[1000] bg-white px-3 py-1 rounded-md shadow">
          Loading data...
        </div>
      )}
      <MapComponent {...mapProps} />
    </div>
  );
};

export default RoutesMap;
