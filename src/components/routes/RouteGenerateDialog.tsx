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
import { generateGoogleMapsRoute } from "@/services/routeService";

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
  const [routeType, setRouteType] = useState<'loop' | 'out-and-back' | 'point-to-point'>('loop');
  const [selectedLocation, setSelectedLocation] = useState<google.maps.places.PlaceResult | null>(null);
  
  const generateRoutes = async () => {
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
      const routes = await generateGoogleMapsRoute({
        startLocation: selectedLocation,
        distance: preferredDistance[0],
        routeType: routeType
      });
      
      onGenerateRoutes(routes);
      onOpenChange(false);
      
      toast({
        title: "Routes generated",
        description: `Three ${preferredDistance[0]}-mile ${routeType.replace("-", " ")} routes generated from ${startingLocation}`,
      });
    } catch (error) {
      console.error('Error generating routes:', error);
      toast({
        title: "Error generating routes",
        description: "There was an error generating the routes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingRoute(false);
    }
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
            <Select value={routeType} onValueChange={(value: 'loop' | 'out-and-back' | 'point-to-point') => setRouteType(value)}>
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
