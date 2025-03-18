import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Share2, ArrowLeft, User, Calendar, Shield } from "lucide-react";
import { RunRoute } from './RouteCard';
import MapComponent from './MapComponent';

interface RouteDetailViewProps {
  route: RunRoute | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RouteDetailView = ({ route, open, onOpenChange }: RouteDetailViewProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);

  useEffect(() => {
    if (route) {
      // In a real app, you would fetch actual route coordinates from an API
      // For this demo, we'll generate a simple route based on the route distance
      generateSampleRoute();
    }
  }, [route]);

  const generateSampleRoute = () => {
    if (!route) return;
    
    // Generate a sample route - in a real app, these would come from your backend
    // For this demo, we'll create a simple loop starting from a fixed point
    
    // Use Washington DC as a default center (or any other location)
    const centerLat = 38.8977;
    const centerLng = -77.0365;
    
    // Create a route based on the distance (very simplified)
    // In a real app, you would use actual route data from a routing API
    const points: [number, number][] = [];
    const routeDistance = route.distanceNum;
    const steps = Math.max(20, Math.floor(routeDistance * 10));
    
    // Create a circular route
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      // Scale based on distance (very approximate)
      const scaleFactor = routeDistance * 0.005;
      const lat = centerLat + Math.sin(angle) * scaleFactor;
      const lng = centerLng + Math.cos(angle) * scaleFactor;
      points.push([lat, lng]);
    }
    
    // Close the loop
    points.push(points[0]);
    
    setRouteCoordinates(points);
  };

  if (!route) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="mr-2 h-8 w-8" 
              onClick={() => onOpenChange(false)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            {route.name}
          </DialogTitle>
          <DialogDescription className="flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            {route.location}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div>
            <div className="rounded-lg overflow-hidden mb-4">
              <img 
                src={route.imageUrl} 
                alt={route.name} 
                className="w-full h-48 object-cover"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-secondary rounded-md p-3">
                <div className="text-sm text-muted-foreground">Distance</div>
                <div className="font-medium text-lg">{route.distance}</div>
              </div>
              <div className="bg-secondary rounded-md p-3">
                <div className="text-sm text-muted-foreground">Elevation</div>
                <div className="font-medium text-lg">{route.elevation}</div>
              </div>
              <div className="bg-secondary rounded-md p-3">
                <div className="text-sm text-muted-foreground">Difficulty</div>
                <div className="font-medium text-lg">{route.difficulty}</div>
              </div>
              <div className="bg-secondary rounded-md p-3">
                <div className="text-sm text-muted-foreground">Terrain</div>
                <div className="font-medium text-lg">{route.terrain}</div>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Route Details</h3>
              <p className="text-muted-foreground mb-4">
                This {route.distance} {route.difficulty.toLowerCase()} route features {route.terrain.toLowerCase()} terrain
                with {route.elevation} of elevation gain. Perfect for {route.difficulty === "Easy" ? "beginners" : 
                route.difficulty === "Moderate" ? "intermediate runners" : "experienced runners"}.
              </p>
              
              {route.safetyRating && (
                <div className="flex items-center mb-2">
                  <Shield className="h-4 w-4 mr-2 text-runher" />
                  <span className="font-medium">Safety Rating: {route.safetyRating}/5</span>
                </div>
              )}
              
              <div className="flex items-center mb-2">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Popular with {route.favorites} runners</span>
              </div>
              
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Best time to run: Early morning or evening</span>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button className="flex-1 bg-runher hover:bg-runher-dark">
                Start Run
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                className={isFavorite ? "text-red-500" : ""}
                onClick={() => setIsFavorite(!isFavorite)}
              >
                <Heart className={isFavorite ? "fill-red-500" : ""} />
              </Button>
              <Button variant="outline" size="icon">
                <Share2 />
              </Button>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Route Map</h3>
            <div className="rounded-lg overflow-hidden border">
              {routeCoordinates.length > 0 ? (
                <MapComponent
                  center={routeCoordinates[0]}
                  zoom={14}
                  height="400px"
                  routes={[
                    {
                      points: routeCoordinates,
                      color: '#FF5757', // RunHer color
                      name: route.name
                    }
                  ]}
                  markers={[
                    {
                      position: routeCoordinates[0],
                      title: "Start/End Point"
                    }
                  ]}
                />
              ) : (
                <div className="h-[400px] flex items-center justify-center bg-secondary">
                  Loading map...
                </div>
              )}
            </div>
            
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Nearby Amenities</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-secondary">Water Fountain</Badge>
                <Badge variant="outline" className="bg-secondary">Restroom</Badge>
                <Badge variant="outline" className="bg-secondary">Parking</Badge>
                <Badge variant="outline" className="bg-secondary">Coffee Shop</Badge>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Weather Conditions</h3>
              <p className="text-muted-foreground">
                Current conditions: Sunny, 72°F
              </p>
              <p className="text-muted-foreground">
                Forecast: Clear skies, perfect for running!
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RouteDetailView;
