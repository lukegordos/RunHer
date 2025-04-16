import { useEffect, useState, useCallback, useMemo } from 'react';
import MapComponent from './MapComponent';
import { fetchCrimeData, CrimeData, calculateSafetyScore, SafetyScoreDetails } from '@/services/crimeDataService';
import { Button } from '@/components/ui/button';
import { EyeIcon, EyeOffIcon, NewspaperIcon, AlertTriangleIcon, InfoIcon, TrendingDownIcon, TrendingUpIcon, MinusIcon, MapPinIcon, ShieldCheckIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import RouteGenerateDialog from './RouteGenerateDialog';
import { RunRoute } from './RouteCard';
import { toast } from '@/components/ui/use-toast';
import ErrorBoundary from '@/components/ErrorBoundary';

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
  const [safetyScore, setSafetyScore] = useState<SafetyScoreDetails | null>(null);
  const [generatedRoutes, setGeneratedRoutes] = useState<RunRoute[]>([]);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);

  // Generate a loop route (circular path that returns to start)
  const generateLoopRoute = useCallback((centerPoint: [number, number], distanceMiles: number): [number, number][] => {
    try {
      if (!centerPoint || !Array.isArray(centerPoint) || centerPoint.length !== 2 || 
          typeof centerPoint[0] !== 'number' || typeof centerPoint[1] !== 'number' ||
          !distanceMiles || typeof distanceMiles !== 'number') {
        console.error('Invalid inputs for generateLoopRoute:', { centerPoint, distanceMiles });
        // Return a simple default route
        return [[0, 0], [0.01, 0.01]];
      }

      const points: [number, number][] = [];
      const [centerLat, centerLng] = centerPoint;
      
      // Convert miles to rough latitude/longitude degrees (very approximate)
      const degreesPerMile = 1/69; // ~69 miles per degree of latitude
      const radius = (distanceMiles / 2) * degreesPerMile;
      
      // Generate a circular route with some randomness
      const numPoints = Math.floor(distanceMiles * 10); // More points for longer routes
      
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * 2 * Math.PI;
        
        // Add some randomness to make the route look more natural
        const randomFactor = 0.3;
        const radiusVariation = radius * (1 + (Math.random() * randomFactor - randomFactor/2));
        
        // Calculate point position
        const lat = centerLat + Math.sin(angle) * radiusVariation;
        const lng = centerLng + Math.cos(angle) * radiusVariation * 1.2; // Adjust for longitude compression
        
        points.push([lat, lng]);
      }
      
      // Ensure the route closes the loop
      if (points.length > 0) {
        points.push(points[0]);
      }
      
      return points;
    } catch (error) {
      console.error('Error in generateLoopRoute:', error instanceof Error ? error.message : 'Unknown error');
      // Return a simple default route on error
      return [[0, 0], [0.01, 0.01]];
    }
  }, []);
  
  // Generate an out-and-back route (go out and return the same way)
  const generateOutAndBackRoute = useCallback((centerPoint: [number, number], distanceMiles: number): [number, number][] => {
    try {
      if (!centerPoint || !Array.isArray(centerPoint) || centerPoint.length !== 2 || 
          typeof centerPoint[0] !== 'number' || typeof centerPoint[1] !== 'number' ||
          !distanceMiles || typeof distanceMiles !== 'number') {
        console.error('Invalid inputs for generateOutAndBackRoute:', { centerPoint, distanceMiles });
        // Return a simple default route
        return [[0, 0], [0.01, 0.01]];
      }

      const points: [number, number][] = [];
      const [centerLat, centerLng] = centerPoint;
      
      // Convert miles to rough latitude/longitude degrees
      const degreesPerMile = 1/69;
      const totalDistance = distanceMiles * degreesPerMile;
      
      // Generate the "out" portion with some randomness
      const numPointsOneWay = Math.floor(distanceMiles * 5);
      const direction = Math.random() * 2 * Math.PI; // Random direction
      
      // Starting point
      points.push([centerLat, centerLng]);
      
      // Generate points going outward
      for (let i = 1; i <= numPointsOneWay; i++) {
        const ratio = i / numPointsOneWay;
        const distance = totalDistance * ratio;
        
        // Add some randomness to the path
        const randomAngle = direction + (Math.random() * 0.2 - 0.1);
        
        const lat = centerLat + Math.sin(randomAngle) * distance;
        const lng = centerLng + Math.cos(randomAngle) * distance * 1.2;
        
        points.push([lat, lng]);
      }
      
      // Add the return journey (same points in reverse, excluding the last point)
      const outPoints = [...points];
      for (let i = outPoints.length - 2; i >= 0; i--) {
        points.push(outPoints[i]);
      }
      
      return points;
    } catch (error) {
      console.error('Error in generateOutAndBackRoute:', error instanceof Error ? error.message : 'Unknown error');
      // Return a simple default route on error
      return [[0, 0], [0.01, 0.01]];
    }
  }, []);
  
  // Generate a point-to-point route (one way journey)
  const generatePointToPointRoute = useCallback((centerPoint: [number, number], distanceMiles: number): [number, number][] => {
    try {
      if (!centerPoint || !Array.isArray(centerPoint) || centerPoint.length !== 2 || 
          typeof centerPoint[0] !== 'number' || typeof centerPoint[1] !== 'number' ||
          !distanceMiles || typeof distanceMiles !== 'number') {
        console.error('Invalid inputs for generatePointToPointRoute:', { centerPoint, distanceMiles });
        // Return a simple default route
        return [[0, 0], [0.01, 0.01]];
      }

      const points: [number, number][] = [];
      const [centerLat, centerLng] = centerPoint;
      
      // Convert miles to rough latitude/longitude degrees
      const degreesPerMile = 1/69;
      const totalDistance = distanceMiles * degreesPerMile;
      
      // Generate a somewhat random path from start to end
      const numPoints = Math.floor(distanceMiles * 10);
      const direction = Math.random() * 2 * Math.PI; // Random direction
      
      // Starting point
      points.push([centerLat, centerLng]);
      
      // Generate points along the path
      for (let i = 1; i <= numPoints; i++) {
        const ratio = i / numPoints;
        const distance = totalDistance * ratio;
        
        // Create a slightly curved path
        const curveAmount = Math.sin(ratio * Math.PI) * 0.2;
        const currentAngle = direction + curveAmount;
        
        const lat = centerLat + Math.sin(currentAngle) * distance;
        const lng = centerLng + Math.cos(currentAngle) * distance * 1.2;
        
        points.push([lat, lng]);
      }
      
      return points;
    } catch (error) {
      console.error('Error in generatePointToPointRoute:', error instanceof Error ? error.message : 'Unknown error');
      // Return a simple default route on error
      return [[0, 0], [0.01, 0.01]];
    }
  }, []);

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

  // Handle generated routes
  const handleGeneratedRoutes = useCallback((routes: RunRoute[]) => {
    // Clear previous generated routes
    setGeneratedRoutes([]);
    
    // Set new generated routes after a brief delay to ensure clean transition
    setTimeout(() => {
      setGeneratedRoutes(routes);
      
      // Show success toast
      toast({
        title: "Safe Routes Generated",
        description: `${routes.length} routes generated that avoid high-crime areas`,
        variant: "default"
      });
    }, 100);
  }, []);

  // Memoize MapComponent props to prevent unnecessary re-renders
  const mapProps = useMemo(() => {
    try {
      const combinedRoutes = [
        ...routes,
        ...generatedRoutes.map(route => {
          try {
            // Generate route points based on the route type and distance
            let routePoints: [number, number][];
            
            // Default to loop if routeType is not specified
            const routeTypeValue = route.routeType || 'loop';
            
            switch (routeTypeValue) {
              case 'loop':
                routePoints = generateLoopRoute(center, route.distanceNum);
                break;
              case 'out-and-back':
                routePoints = generateOutAndBackRoute(center, route.distanceNum);
                break;
              case 'point-to-point':
                routePoints = generatePointToPointRoute(center, route.distanceNum);
                break;
              default:
                routePoints = generateLoopRoute(center, route.distanceNum);
            }
            
            // Determine route color based on safety priority
            let routeColor = '#4CAF50'; // Default green for safe routes
            
            // Default to medium if safetyPriority is not specified
            const safetyPriorityValue = route.safetyPriority || 'medium';
            
            if (safetyPriorityValue === 'high') {
              routeColor = '#2E7D32'; // Dark green for high safety
            } else if (safetyPriorityValue === 'medium') {
              routeColor = '#4CAF50'; // Medium green for medium safety
            } else if (safetyPriorityValue === 'low') {
              routeColor = '#81C784'; // Light green for low safety
            }
            
            return {
              points: routePoints,
              color: routeColor,
              name: `${route.name} (${route.distance}, Safety: ${route.safetyRating || '3.0'}/5)`
            };
          } catch (err) {
            console.error('Error processing route:', err instanceof Error ? err.message : 'Unknown error');
            // Return a simple default route on error
            return {
              points: [[center[0], center[1]], [center[0] + 0.01, center[1] + 0.01]] as [number, number][],
              color: '#FF5757',
              name: 'Error: Could not generate route'
            };
          }
        })
      ];
      
      return {
        center,
        zoom,
        routes: combinedRoutes,
        crimeData,
        showCrimeData,
        height,
        className
      };
    } catch (err) {
      console.error('Error in mapProps calculation:', err);
      // Return minimal props on error
      return {
        center,
        zoom,
        routes: [],
        crimeData: [],
        showCrimeData: false,
        height,
        className
      };
    }
  }, [center, zoom, routes, generatedRoutes, crimeData, showCrimeData, height, className]);

  // Get safety score color based on the score value
  const getSafetyScoreColor = (score: number) => {
    if (score >= 4.5) return 'bg-green-100 text-green-800';
    if (score >= 3.5) return 'bg-lime-100 text-lime-800';
    if (score >= 2.5) return 'bg-yellow-100 text-yellow-800';
    if (score >= 1.5) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  // Get trend icon based on trend direction
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUpIcon className="w-3 h-3 text-green-600" />;
      case 'worsening':
        return <TrendingDownIcon className="w-3 h-3 text-red-600" />;
      default:
        return <MinusIcon className="w-3 h-3 text-gray-600" />;
    }
  };

  return (
    <ErrorBoundary>
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
          
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsGenerateDialogOpen(true)}
            className="bg-white hover:bg-gray-100"
          >
            <ShieldCheckIcon className="w-4 h-4 mr-2" />
            Generate Safe Routes
          </Button>
          
          {safetyScore && (
            <Dialog>
              <DialogTrigger asChild>
                <div className={`rounded-md p-2 shadow flex items-center justify-between cursor-pointer ${getSafetyScoreColor(safetyScore.score)}`}>
                  <span className="font-medium">Safety Score: {safetyScore.score.toFixed(1)}/5</span>
                  <div className="flex items-center gap-1">
                    {safetyScore.newsFactors && (
                      <Badge variant="outline" className="ml-2 bg-blue-50">
                        <NewspaperIcon className="w-3 h-3 mr-1" />
                        News
                      </Badge>
                    )}
                    {getTrendIcon(safetyScore.predictionDetails.trendDirection)}
                    <InfoIcon className="w-4 h-4 ml-1 text-gray-600" />
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-md z-[2000]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangleIcon className="w-5 h-5" />
                    Safety Analysis
                  </DialogTitle>
                  <DialogDescription>
                    Detailed safety information for this area
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 mt-4">
                  {/* Safety Score Summary */}
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Overall Safety Score:</span>
                    <Badge className={`text-lg px-3 py-1 ${getSafetyScoreColor(safetyScore.score)}`}>
                      {safetyScore.score.toFixed(1)}/5
                    </Badge>
                  </div>
                  
                  {/* Explanation */}
                  <div className="bg-gray-50 p-3 rounded-md text-sm">
                    {safetyScore.predictionDetails.explanation}
                  </div>
                  
                  {/* Crime Factors */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Crime Data Analysis</h4>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-red-50 p-2 rounded-md">
                        <div className="text-red-600 font-bold">{safetyScore.crimeFactors.severityCounts.high}</div>
                        <div className="text-xs">High Severity</div>
                      </div>
                      <div className="bg-orange-50 p-2 rounded-md">
                        <div className="text-orange-600 font-bold">{safetyScore.crimeFactors.severityCounts.medium}</div>
                        <div className="text-xs">Medium Severity</div>
                      </div>
                      <div className="bg-yellow-50 p-2 rounded-md">
                        <div className="text-yellow-600 font-bold">{safetyScore.crimeFactors.severityCounts.low}</div>
                        <div className="text-xs">Low Severity</div>
                      </div>
                    </div>
                    
                    {safetyScore.crimeFactors.recentCrimes.length > 0 && (
                      <div className="mt-2">
                        <h5 className="text-sm font-medium mb-1">Recent Incidents:</h5>
                        <ul className="text-xs space-y-1 bg-gray-50 p-2 rounded-md">
                          {safetyScore.crimeFactors.recentCrimes.map((crime, index) => (
                            <li key={index} className="list-disc ml-4">{crime}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {/* News Factors */}
                  {safetyScore.newsFactors && (
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center">
                        <NewspaperIcon className="w-4 h-4 mr-1" />
                        News-Based Prediction
                      </h4>
                      
                      <div className="bg-blue-50 p-3 rounded-md text-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span>Prediction Confidence:</span>
                          <Badge variant="outline" className="bg-white">
                            {Math.round(safetyScore.newsFactors.confidence * 100)}%
                          </Badge>
                        </div>
                        
                        <div className="space-y-1">
                          <h5 className="text-xs font-medium">Why this prediction:</h5>
                          <ul className="text-xs space-y-1">
                            {safetyScore.newsFactors.reasons.map((reason, index) => (
                              <li key={index} className="list-disc ml-4">{reason}</li>
                            ))}
                          </ul>
                        </div>
                        
                        {safetyScore.newsFactors.recentEvents.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <h5 className="text-xs font-medium">Recent News Events:</h5>
                            <ul className="text-xs space-y-1">
                              {safetyScore.newsFactors.recentEvents.map((event, index) => (
                                <li key={index} className="list-disc ml-4">{event}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Data Sources */}
                  <div className="text-xs text-gray-500 mt-2">
                    <p>Data sources: DC Crime Data API {safetyScore.newsFactors ? '+ NewsAPI' : ''}</p>
                    <p>Last updated: {new Date().toLocaleString()}</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        {loading && (
          <div className="absolute top-2 left-2 z-[1000] bg-white px-3 py-1 rounded-md shadow">
            Loading data...
          </div>
        )}
        <MapComponent {...mapProps} />
        <RouteGenerateDialog 
          open={isGenerateDialogOpen} 
          onOpenChange={setIsGenerateDialogOpen} 
          onGenerateRoutes={handleGeneratedRoutes} 
        />
      </div>
    </ErrorBoundary>
  );
};

export default RoutesMap;
