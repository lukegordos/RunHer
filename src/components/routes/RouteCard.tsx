
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Heart, MapPin, Share2, Shield, Star } from "lucide-react";

export type RunRoute = {
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
  isGenerated?: boolean;
  safetyRating?: number;
};

// Component for the shield icon (safety rating)
const Shield = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
  </svg>
);

const RouteCard = ({ route }: { route: RunRoute }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  
  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast({
      title: isFavorite ? "Removed from favorites" : "Added to favorites",
      description: isFavorite 
        ? `${route.name} has been removed from your favorites.`
        : `${route.name} has been added to your favorites.`,
    });
  };
  
  const handleShare = () => {
    toast({
      title: "Route shared",
      description: `Link to ${route.name} copied to clipboard.`,
    });
  };
  
  return (
    <div className="rounded-xl overflow-hidden bg-white shadow-sm">
      <div 
        className="h-40 bg-cover bg-center relative"
        style={{ 
          backgroundImage: `url(${route.imageUrl})` 
        }}
      >
        {route.isGenerated && (
          <div className="absolute top-3 left-3 bg-runher/80 text-white px-2 py-1 rounded-full text-xs font-medium">
            AI Generated
          </div>
        )}
        
        {route.safetyRating && (
          <div className="absolute top-3 right-3 bg-white/90 text-runher px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <Shield className="h-3 w-3 mr-1" />
            Safety: {route.safetyRating}/5
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{route.name}</h3>
            <div className="flex items-center space-x-1">
              <Star className="fill-yellow-400 stroke-yellow-400 h-4 w-4" />
              <span className="text-sm">{route.rating}</span>
            </div>
          </div>
          <div className="flex items-center text-xs text-white/90 mt-1">
            <MapPin className="h-3 w-3 mr-1" />
            <span>{route.location}</span>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-secondary rounded-md p-2">
            <div className="text-xs text-muted-foreground">Distance</div>
            <div className="font-medium">{route.distance}</div>
          </div>
          <div className="bg-secondary rounded-md p-2">
            <div className="text-xs text-muted-foreground">Elevation</div>
            <div className="font-medium">{route.elevation}</div>
          </div>
          <div className="bg-secondary rounded-md p-2">
            <div className="text-xs text-muted-foreground">Difficulty</div>
            <div className="font-medium">{route.difficulty}</div>
          </div>
          <div className="bg-secondary rounded-md p-2">
            <div className="text-xs text-muted-foreground">Terrain</div>
            <div className="font-medium">{route.terrain}</div>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <Button className="bg-runher hover:bg-runher-dark flex-1 mr-2">
            View Route
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            className={isFavorite ? "text-red-500" : ""}
            onClick={handleFavorite}
          >
            <Heart className={isFavorite ? "fill-red-500" : ""} />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            className="ml-2"
            onClick={handleShare}
          >
            <Share2 />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RouteCard;
