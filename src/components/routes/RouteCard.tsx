import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MapPin, Share2, Shield, Star } from "lucide-react";
import RouteDetailView from "./RouteDetailView";
import RoutesMap from "./RoutesMap";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { calculateSafetyScore, SafetyScoreDetails } from "@/services/crimeDataService";

export interface RunRoute {
  id: string;
  name: string;
  location: string;
  distance: string;
  distanceNum: number;
  elevation: string;
  difficulty: "Easy" | "Moderate" | "Challenging";
  terrain: string;
  rating: number;
  favorites: number;
  imageUrl: string;
  safetyScore?: number;
  safetyDetails?: SafetyScoreDetails;
  safetyExplanation?: string;
  points?: [number, number][];
  directions?: google.maps.DirectionsResult;
  isGenerated?: boolean;
  color?: string;
}

const RouteCard = ({ route }: { route: RunRoute }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [safetyDetails, setSafetyDetails] = useState<SafetyScoreDetails | null>(null);
  const [isLoadingSafety, setIsLoadingSafety] = useState(false);

  useEffect(() => {
    const fetchSafetyScore = async () => {
      if (route.points && route.points.length > 0) {
        try {
          setIsLoadingSafety(true);
          // Get all points along the route for safety calculation
          const details = await calculateSafetyScore([], route.points);
          setSafetyDetails(details);
          // Update route's safety score
          route.safetyScore = details.score;
          route.safetyExplanation = details.predictionDetails?.explanation;
        } catch (error) {
          console.error('Error calculating safety score:', error);
        } finally {
          setIsLoadingSafety(false);
        }
      }
    };

    if (!route.safetyDetails) {
      fetchSafetyScore();
    } else {
      setSafetyDetails(route.safetyDetails);
    }
  }, [route]);

  const safetyScore = safetyDetails?.score || route.safetyScore || 5;
  const safetyColor = (safetyDetails?.score || route.safetyScore) >= 4.5 ? "text-green-500" :
                      (safetyDetails?.score || route.safetyScore) >= 3.5 ? "text-blue-500" :
                      (safetyDetails?.score || route.safetyScore) >= 2.5 ? "text-yellow-500" :
                      "text-red-500";

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Implement share functionality
  };

  return (
    <>
      <Card 
        className="overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg"
        onClick={() => setShowDetail(true)}
      >
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-lg">{route.name}</h3>
              <Button
                variant="ghost"
                size="icon"
                className="mt-[-4px]"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">{route.location}</p>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{route.distance}</Badge>
              <Badge variant="secondary">{route.elevation}</Badge>
              <Badge variant="secondary">{route.difficulty}</Badge>
              <Badge variant="secondary">{route.terrain}</Badge>
            </div>
            
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center gap-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <span className={cn("font-medium", isLoadingSafety ? "text-muted-foreground animate-pulse" : 
                        (safetyDetails?.score || route.safetyScore) >= 4.5 ? "text-green-500" :
                        (safetyDetails?.score || route.safetyScore) >= 3.5 ? "text-blue-500" :
                        (safetyDetails?.score || route.safetyScore) >= 2.5 ? "text-yellow-500" :
                        "text-red-500"
                      )}>
                        {isLoadingSafety ? "Loading safety score..." : 
                         `Safety: ${(safetyDetails?.score || route.safetyScore || 0).toFixed(2)}`}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="max-w-xs space-y-1">
                        {isLoadingSafety ? (
                          <p>Calculating safety score based on local crime data...</p>
                        ) : (
                          <>
                            <p>{safetyDetails?.predictionDetails?.explanation || route.safetyExplanation || "Safety score based on local crime data."}</p>
                            {safetyDetails?.crimeFactors && (
                              <>
                                <p className="text-sm text-muted-foreground">
                                  Recent incidents: {safetyDetails.crimeFactors.crimeCount} ({safetyDetails.crimeFactors.severityCounts.high} high, {safetyDetails.crimeFactors.severityCounts.medium} medium, {safetyDetails.crimeFactors.severityCounts.low} low)
                                </p>
                                {safetyDetails.newsFactors && (
                                  <p className="text-sm text-muted-foreground">
                                    Recent news impact: {safetyDetails.newsFactors.impact > 0 ? "Positive" : "Negative"} ({Math.abs(safetyDetails.newsFactors.impact).toFixed(1)} points)
                                  </p>
                                )}
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-sm text-muted-foreground">
                {route.favorites} favorites
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <RouteDetailView
        open={showDetail}
        onOpenChange={setShowDetail}
        route={route}
        safetyDetails={safetyDetails}
      >
        {isMapExpanded ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="w-[90vw] h-[90vh] overflow-hidden">
              <div className="p-4 h-full">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">{route.name}</h2>
                  <Button variant="ghost" onClick={() => setIsMapExpanded(false)}>Close</Button>
                </div>
                <RoutesMap
                  routes={[route]}
                  height="calc(100% - 4rem)"
                  className="w-full rounded-lg overflow-hidden"
                  center={route.points ? [route.points[0][0], route.points[0][1]] : [38.9072, -77.0369]}
                  zoom={14}
                />
              </div>
            </Card>
          </div>
        ) : null}
      </RouteDetailView>
    </>
  );
};

export default RouteCard;
