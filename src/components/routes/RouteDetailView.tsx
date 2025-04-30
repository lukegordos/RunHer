import { ReactNode, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Star, NewspaperIcon, TrendingUpIcon, TrendingDownIcon, MinusIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import MapComponent from "./MapComponent";
import type { SafetyScoreDetails } from "@/services/crimeDataService";
import type { RunRoute } from "./RouteCard";

interface RouteDetailViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  route: RunRoute;
  safetyDetails: SafetyScoreDetails | null;
  children?: ReactNode;
}

const RouteDetailView = ({ open, onOpenChange, route, safetyDetails, children }: RouteDetailViewProps) => {
  const score = safetyDetails?.score || route.safetyScore || 5;
  const explanation = safetyDetails?.predictionDetails?.explanation || route.safetyExplanation || "Safety score based on local crime data.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-none">
          <DialogTitle>{route.name}</DialogTitle>
          <DialogDescription>
            {route.location} • {route.distance} • {route.elevation} elevation
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Route Details</h3>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-muted-foreground">Distance</dt>
                    <dd className="font-medium">{route.distance}</dd>
                    <dt className="text-muted-foreground">Elevation</dt>
                    <dd className="font-medium">{route.elevation}</dd>
                    <dt className="text-muted-foreground">Difficulty</dt>
                    <dd className="font-medium">{route.difficulty}</dd>
                    <dt className="text-muted-foreground">Terrain</dt>
                    <dd className="font-medium">{route.terrain}</dd>
                  </dl>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Safety Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-lg font-semibold",
                        score >= 4.5 ? "text-green-500" :
                        score >= 3.5 ? "text-blue-500" :
                        score >= 2.5 ? "text-yellow-500" :
                        "text-red-500"
                      )}>
                        Safety: {score.toFixed(2)}
                      </span>
                      {safetyDetails?.newsFactors && (
                        <Badge variant="secondary" className="bg-blue-50">
                          <NewspaperIcon className="w-3 h-3 mr-1" />
                          News
                        </Badge>
                      )}
                      {safetyDetails?.predictionDetails?.trendDirection === 'improving' ? (
                        <TrendingUpIcon className="w-3 h-3 text-green-600" />
                      ) : safetyDetails?.predictionDetails?.trendDirection === 'worsening' ? (
                        <TrendingDownIcon className="w-3 h-3 text-red-600" />
                      ) : (
                        <MinusIcon className="w-3 h-3 text-gray-400" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {explanation}
                    </p>
                    {safetyDetails?.crimeFactors && (
                      <div className="mt-4 space-y-2">
                        <h4 className="font-medium">Recent Crime Activity</h4>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="p-2 rounded bg-red-50">
                            <div className="font-medium text-red-700">{safetyDetails.crimeFactors.severityCounts.high}</div>
                            <div className="text-xs text-red-600">High Severity</div>
                          </div>
                          <div className="p-2 rounded bg-yellow-50">
                            <div className="font-medium text-yellow-700">{safetyDetails.crimeFactors.severityCounts.medium}</div>
                            <div className="text-xs text-yellow-600">Medium Severity</div>
                          </div>
                          <div className="p-2 rounded bg-green-50">
                            <div className="font-medium text-green-700">{safetyDetails.crimeFactors.severityCounts.low}</div>
                            <div className="text-xs text-green-600">Low Severity</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Route Map</h3>
                  <div className="rounded-lg overflow-hidden border">
                    <MapComponent
                      center={route.points ? [route.points[0][0], route.points[0][1]] : [38.9072, -77.0369]}
                      zoom={14}
                      routes={[{
                        points: route.points,
                        color: "#FF5757", // RunHer color
                        name: route.name
                      }]}
                      height="300px"
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Ratings & Reviews</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      <span className="ml-1 font-medium">{route.rating.toFixed(1)}</span>
                    </div>
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-pink-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add favorite functionality
                        }}
                      >
                        <Heart className="w-5 h-5 mr-1 fill-current" />
                        {route.favorites} favorites
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default RouteDetailView;
