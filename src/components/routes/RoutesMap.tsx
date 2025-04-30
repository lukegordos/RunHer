import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
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
import { EyeIcon, EyeOffIcon, NewspaperIcon, AlertTriangleIcon, InfoIcon, TrendingDownIcon, TrendingUpIcon, MinusIcon } from 'lucide-react';
import MapComponent from "./MapComponent";
import { CrimeData, fetchCrimeData, calculateSafetyScore, SafetyScoreDetails } from "@/services/crimeDataService";

interface RoutesMapProps {
  center: google.maps.LatLng | [number, number];
  zoom: number;
  routes: Array<{
    points?: [number, number][];
    color?: string;
    name?: string;
    directions?: google.maps.DirectionsResult;
  }>;
  height?: string;
  className?: string;
}

const RoutesMap: React.FC<RoutesMapProps> = ({
  center,
  zoom,
  routes,
  height = "400px",
  className
}) => {
  const [crimeData, setCrimeData] = useState<CrimeData[]>([]);
  const [showCrimeData, setShowCrimeData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [safetyScore, setSafetyScore] = useState<SafetyScoreDetails | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  // Memoize the fetch function to prevent unnecessary re-creation
  const fetchCrimeDataForLocation = useCallback(async () => {
    if (!center) return;
    
    setLoading(true);
    try {
      const lat = typeof center === 'object' && 'lat' in center ? center.lat() : center[0];
      const lng = typeof center === 'object' && 'lng' in center ? center.lng() : center[1];
      
      // Create array of route points for safety calculation
      const routePoints: [number, number][] = routes.flatMap(route => 
        route.points || []
      );
      
      const details = await calculateSafetyScore([], routePoints);
      setSafetyScore(details);
      
      const crimes = await fetchCrimeData(lat, lng, 5); // 5km radius
      setCrimeData(crimes);
    } catch (error) {
      console.error('Error fetching crime data:', error);
      setCrimeData([]);
      setSafetyScore(null);
    } finally {
      setLoading(false);
    }
  }, [center, routes]);

  // Initial fetch when component mounts
  useEffect(() => {
    fetchCrimeDataForLocation();
  }, [fetchCrimeDataForLocation]);

  useEffect(() => {
    const fetchSafetyScores = async () => {
      if (!map) return;

      const updatedMarkers: google.maps.Marker[] = [];
      const bounds = new google.maps.LatLngBounds();

      for (const route of routes) {
        if (route.points && route.points.length > 0) {
          try {
            const details = await calculateSafetyScore([], route.points);
            
            // Create marker for route start
            const [startLat, startLng] = route.points[0];
            const marker = new google.maps.Marker({
              position: new google.maps.LatLng(startLat, startLng),
              map,
              title: route.name,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: details.score >= 4.5 ? '#22c55e' :
                          details.score >= 3.5 ? '#3b82f6' :
                          details.score >= 2.5 ? '#eab308' :
                          '#ef4444',
                fillOpacity: 0.7,
                strokeWeight: 2,
                strokeColor: '#ffffff',
                scale: 10,
              }
            });

            const infoWindow = new google.maps.InfoWindow({
              content: `
                <div class="p-2">
                  <h3 class="font-medium">${route.name}</h3>
                  <p class="text-sm">Safety Score: ${details.score.toFixed(1)}</p>
                  <p class="text-xs text-gray-600">${details.predictionDetails.explanation}</p>
                </div>
              `
            });

            marker.addListener('click', () => {
              infoWindow.open(map, marker);
            });

            updatedMarkers.push(marker);
            bounds.extend(marker.getPosition()!);
          } catch (error) {
            console.error('Error calculating safety score:', error);
          }
        }
      }

      // Clear old markers
      markers.forEach(marker => marker.setMap(null));
      
      // Update markers state
      setMarkers(updatedMarkers);

      // Fit map to bounds if there are markers
      if (updatedMarkers.length > 0) {
        map.fitBounds(bounds);
      }
    };

    fetchSafetyScores();
  }, [routes, map]);

  // Memoize the toggle handler to prevent unnecessary re-creation
  const handleToggleCrimeData = useCallback(() => {
    setShowCrimeData(prev => !prev);
  }, []);

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

  // Memoize MapComponent props to prevent unnecessary re-renders
  const mapProps = useMemo(() => ({
    center,
    zoom,
    routes,
    crimeData,
    showCrimeData,
    height,
    className,
    onMapLoad: (map: google.maps.Map) => setMap(map)
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
    </div>
  );
};

export default RoutesMap;
