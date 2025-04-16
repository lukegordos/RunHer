import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/components/ui/use-toast";
import { Navigation, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RunRoute } from "./RouteCard";
import { PlacesAutocomplete } from "@/components/ui/places-autocomplete";

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
  const [routeType, setRouteType] = useState("loop");
  const [selectedLocation, setSelectedLocation] = useState<google.maps.places.PlaceResult | null>(null);
  
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
    
    // Simulate route generation with a timeout
    setTimeout(() => {
      const terrainOptions = ["Paved", "Trail", "Mixed"];
      const difficultyOptions = ["Easy", "Moderate", "Challenging"];
      const routeNames = {
        "loop": ["Loop", "Circuit", "Circular Route"],
        "out-and-back": ["Out-and-Back", "There-and-Back", "Return Path"],
        "point-to-point": ["Point-to-Point", "One-Way Route", "Direct Path"]
      };
      
      // Generate 3 routes with the preferred distance
      const newRoutes: RunRoute[] = Array(3).fill(0).map((_, index) => {
        const exactDistance = preferredDistance[0];
        const variance = (Math.random() * 0.4) - 0.2; // +/- 20% variance
        const routeDistance = +(exactDistance * (1 + variance)).toFixed(1);
        
        // Use the route type to determine the name format
        const nameOptions = routeNames[routeType as keyof typeof routeNames] || routeNames.loop;
        const routeTypeName = nameOptions[index % nameOptions.length];
        
        return {
          id: `gen-${Date.now()}-${index}`,
          name: `${startingLocation} ${routeTypeName}`,
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
          safetyRating: +(3.5 + Math.random() * 1.5).toFixed(1)
        };
      });
      
      onGenerateRoutes(newRoutes);
      setIsGeneratingRoute(false);
      onOpenChange(false);
      
      toast({
        title: "Routes generated",
        description: `Three ${preferredDistance[0]}-mile ${routeType.replace("-", " ")} routes generated from ${startingLocation}`,
      });
    }, 2000);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Running Route</DialogTitle>
          <DialogDescription>
            Our AI will create personalized routes based on your preferences.
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
            <Select value={routeType} onValueChange={setRouteType}>
              <SelectTrigger>
                <SelectValue placeholder="Select route type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="loop">Loop (Start and end at same point)</SelectItem>
                <SelectItem value="out-and-back">Out-and-Back (Go out and return same way)</SelectItem>
                <SelectItem value="point-to-point">Point-to-Point (Different start and end)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Safety Priority</label>
            <Select defaultValue="high">
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High (well-lit, populated areas)</SelectItem>
                <SelectItem value="medium">Medium (balance with scenic routes)</SelectItem>
                <SelectItem value="low">Low (prioritize best running paths)</SelectItem>
              </SelectContent>
            </Select>
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
                <Navigation className="mr-2 h-4 w-4" />
                Generate Routes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RouteGenerateDialog;
