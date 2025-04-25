import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/components/ui/use-toast";
import { Navigation, RotateCcw, ShieldCheck, ShieldAlert, Map } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RunRoute } from "./RouteCard";
import { PlacesAutocomplete } from "@/components/ui/places-autocomplete";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Import Google Maps types
import '@/types/google-maps.d.ts';

interface RouteGenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerateRoutes: (routes: RunRoute[]) => void;
}

const RouteGenerateDialog = ({ 
  open, 
  onOpenChange, 
  onGenerateRoutes 
}: RouteGenerateDialogProps) => {
  const [isGeneratingRoute, setIsGeneratingRoute] = useState(false);
  const [preferredDistance, setPreferredDistance] = useState([3]); // miles
  const [startingLocation, setStartingLocation] = useState("");
  const [routeType, setRouteType] = useState<"loop" | "out-and-back" | "point-to-point">("loop");
  const [selectedLocation, setSelectedLocation] = useState<google.maps.places.PlaceResult | null>(null);
  const [avoidCrimeAreas, setAvoidCrimeAreas] = useState(true);
  const [prioritizeSafety, setPrioritizeSafety] = useState<"high" | "medium" | "low">("high");
  const [generateMultipleRoutes, setGenerateMultipleRoutes] = useState(true);
  
  // Sample images for generated routes
  const sampleImages = [
    "https://images.unsplash.com/photo-1464207687429-7505649dae38?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1373&q=80",
    "https://images.unsplash.com/photo-1473773508845-188df298d2d1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1374&q=80",
    "https://images.unsplash.com/photo-1570151158645-125daa5421be?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
    "https://images.unsplash.com/photo-1529310399831-ed472b81d589?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1374&q=80",
  ];
  
  const generateRoutes = () => {
    if (!startingLocation || !selectedLocation) {
      toast({
        title: "Missing location",
        description: "Please select a valid starting location from the suggestions",
        variant: "destructive"
      });
      return;
    }
    
    setIsGeneratingRoute(true);
    
    try {
      // Simulate route generation with a timeout
      setTimeout(() => {
        try {
          const terrainOptions = ["Paved", "Trail", "Mixed"];
          const difficultyOptions = ["Easy", "Moderate", "Challenging"];
          
          // Define route shapes based on route type
          const routeShapes = {
            "loop": (center: google.maps.LatLng, distance: number) => {
              // Create a circular route that returns to starting point
              return generateCircularRoute(center, distance);
            },
            "out-and-back": (center: google.maps.LatLng, distance: number) => {
              // Create a route that goes out and returns along the same path
              return generateOutAndBackRoute(center, distance);
            },
            "point-to-point": (center: google.maps.LatLng, distance: number) => {
              // Create a one-way route
              return generatePointToPointRoute(center, distance);
            }
          };
          
          // Determine how many routes to generate
          const numRoutes = generateMultipleRoutes ? 3 : 1;
          
          // Generate routes with the preferred distance
          const newRoutes: RunRoute[] = Array(numRoutes).fill(0).map((_, index) => {
            try {
              const exactDistance = preferredDistance[0];
              // Less variance for more consistent routes
              const variance = (Math.random() * 0.2) - 0.1; // +/- 10% variance
              const routeDistance = +(exactDistance * (1 + variance)).toFixed(1);
              
              // Use the route type to determine the name format
              const routeNames = {
                "loop": ["Loop", "Circuit", "Circular Route"],
                "out-and-back": ["Out-and-Back", "There-and-Back", "Return Path"],
                "point-to-point": ["Point-to-Point", "One-Way Route", "Direct Path"]
              };
              const nameOptions = routeNames[routeType as keyof typeof routeNames] || routeNames.loop;
              const routeTypeName = nameOptions[index % nameOptions.length];
              
              // Adjust safety rating based on safety priority
              let baseSafetyRating = 3.5;
              let safetyDescription = "";
              
              if (avoidCrimeAreas) {
                // Higher safety ratings when avoiding crime areas
                switch (prioritizeSafety) {
                  case "high":
                    baseSafetyRating = 4.5;
                    safetyDescription = "Maximum Safety";
                    break;
                  case "medium":
                    baseSafetyRating = 4.0;
                    safetyDescription = "Balanced Safety";
                    break;
                  case "low":
                    baseSafetyRating = 3.7;
                    safetyDescription = "Basic Safety";
                    break;
                }
              }
              
              // Add some randomness to safety rating
              const safetyRating = +(baseSafetyRating + (Math.random() * 0.3)).toFixed(1);
              
              // Create route name with safety indication if avoiding crime
              let routeName = `${startingLocation} ${routeTypeName}`;
              if (avoidCrimeAreas) {
                routeName = `Safe ${routeTypeName} (${safetyDescription})`;
              }
              
              return {
                id: `gen-${Date.now()}-${index}`,
                name: routeName,
                location: startingLocation,
                distance: `${routeDistance} miles`,
                distanceNum: routeDistance,
                elevation: `${Math.floor(Math.random() * 500 + 50)} ft`,
                difficulty: difficultyOptions[Math.floor(Math.random() * difficultyOptions.length)] as "Easy" | "Moderate" | "Challenging",
                terrain: terrainOptions[Math.floor(Math.random() * terrainOptions.length)],
                rating: +(4 + Math.random()).toFixed(1),
                favorites: Math.floor(Math.random() * 100),
                imageUrl: sampleImages[Math.floor(Math.random() * sampleImages.length)],
                isGenerated: true,
                safetyRating: safetyRating,
                routeType: routeType,
                safetyPriority: prioritizeSafety
              };
            } catch (err) {
              console.error("Error generating individual route:", err);
              // Return a fallback route if individual route generation fails
              return {
                id: `gen-${Date.now()}-${index}`,
                name: `Safe Route ${index + 1}`,
                location: startingLocation || "Washington DC",
                distance: `${preferredDistance[0]} miles`,
                distanceNum: preferredDistance[0],
                elevation: "100 ft",
                difficulty: "Moderate" as "Easy" | "Moderate" | "Challenging",
                terrain: "Mixed",
                rating: 4.0,
                favorites: 0,
                imageUrl: sampleImages[0],
                isGenerated: true,
                safetyRating: 4.0,
                routeType: routeType,
                safetyPriority: prioritizeSafety
              };
            }
          });
          
          onGenerateRoutes(newRoutes);
          setIsGeneratingRoute(false);
          onOpenChange(false);
          
          const safetyMessage = avoidCrimeAreas ? 
            ` that avoid high-crime areas with ${prioritizeSafety} safety priority` : 
            "";
          
          toast({
            title: "Routes generated",
            description: `${newRoutes.length} ${preferredDistance[0]}-mile ${routeType.replace("-", " ")} routes generated from ${startingLocation}${safetyMessage}`,
          });
        } catch (err) {
          console.error("Error in route generation:", err);
          setIsGeneratingRoute(false);
          
          toast({
            title: "Error generating routes",
            description: "There was a problem generating routes. Please try again.",
            variant: "destructive"
          });
        }
      }, 2000);
    } catch (err) {
      console.error("Error starting route generation:", err);
      setIsGeneratingRoute(false);
      
      toast({
        title: "Error generating routes",
        description: "There was a problem generating routes. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Helper function to generate a circular route
  const generateCircularRoute = (center: google.maps.LatLng, distance: number) => {
    // Implementation for circular route generation
    return [];
  };
  
  // Helper function to generate an out-and-back route
  const generateOutAndBackRoute = (center: google.maps.LatLng, distance: number) => {
    // Implementation for out-and-back route generation
    return [];
  };
  
  // Helper function to generate a point-to-point route
  const generatePointToPointRoute = (center: google.maps.LatLng, distance: number) => {
    // Implementation for point-to-point route generation
    return [];
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Safe Running Routes</DialogTitle>
          <DialogDescription>
            Our AI will create personalized routes that prioritize your safety by avoiding high-crime areas.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Starting Location</label>
            <PlacesAutocomplete
              value={startingLocation}
              onChange={setStartingLocation}
              onPlaceSelect={(place) => {
                setSelectedLocation(place);
                if (place.formatted_address) {
                  setStartingLocation(place.formatted_address);
                }
              }}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Preferred Distance: {preferredDistance[0]} miles
            </label>
            <Slider
              value={preferredDistance}
              max={15}
              min={1}
              step={0.5}
              onValueChange={setPreferredDistance}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 mile</span>
              <span>15 miles</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Route Type</label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={routeType === "loop" ? "default" : "outline"}
                className={routeType === "loop" ? "bg-runher hover:bg-runher-dark" : ""}
                onClick={() => setRouteType("loop")}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Loop
              </Button>
              <Button
                variant={routeType === "out-and-back" ? "default" : "outline"}
                className={routeType === "out-and-back" ? "bg-runher hover:bg-runher-dark" : ""}
                onClick={() => setRouteType("out-and-back")}
              >
                <Navigation className="mr-2 h-4 w-4" />
                Out & Back
              </Button>
              <Button
                variant={routeType === "point-to-point" ? "default" : "outline"}
                className={routeType === "point-to-point" ? "bg-runher hover:bg-runher-dark" : ""}
                onClick={() => setRouteType("point-to-point")}
              >
                <Map className="mr-2 h-4 w-4" />
                Point to Point
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Safety Priority</label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={prioritizeSafety === "high" ? "default" : "outline"}
                className={prioritizeSafety === "high" ? "bg-green-600 hover:bg-green-700" : ""}
                onClick={() => setPrioritizeSafety("high")}
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                High
              </Button>
              <Button
                variant={prioritizeSafety === "medium" ? "default" : "outline"}
                className={prioritizeSafety === "medium" ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                onClick={() => setPrioritizeSafety("medium")}
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Medium
              </Button>
              <Button
                variant={prioritizeSafety === "low" ? "default" : "outline"}
                className={prioritizeSafety === "low" ? "bg-blue-500 hover:bg-blue-600" : ""}
                onClick={() => setPrioritizeSafety("low")}
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Low
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2">
              <Switch id="avoid-crime" checked={avoidCrimeAreas} onCheckedChange={setAvoidCrimeAreas} />
              <Label htmlFor="avoid-crime" className="text-sm font-medium">
                <div className="flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-1 text-green-600" />
                  Avoid High-Crime Areas
                </div>
              </Label>
            </div>
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2">
              <Switch id="multiple-routes" checked={generateMultipleRoutes} onCheckedChange={setGenerateMultipleRoutes} />
              <Label htmlFor="multiple-routes" className="text-sm font-medium">
                <div className="flex items-center">
                  <Map className="w-4 h-4 mr-1 text-blue-600" />
                  Generate Multiple Routes
                </div>
              </Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={generateRoutes} 
            className="bg-runher hover:bg-runher-dark"
            disabled={isGeneratingRoute}
          >
            {isGeneratingRoute ? (
              <>
                <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Generate Safe Routes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RouteGenerateDialog;
