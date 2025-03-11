import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Map, 
  MapPin, 
  Route, 
  Star,
  Filter,
  ArrowUpDown,
  Heart,
  Share2,
  Navigation,
  RotateCcw,
  Flag,
  AlertTriangle
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import AppLayout from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type RunRoute = {
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

const RunningRoutes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("discover");
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState({
    distance: [5],
    difficulty: "",
    terrain: "",
    elevation: [100],
  });
  const [isGeneratingRoute, setIsGeneratingRoute] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [preferredDistance, setPreferredDistance] = useState([3]); // miles
  const [generatedRoutes, setGeneratedRoutes] = useState<RunRoute[]>([]);
  const [startingLocation, setStartingLocation] = useState("");
  const [routeType, setRouteType] = useState("loop");
  
  const routes: RunRoute[] = [
    {
      id: "1",
      name: "Waterfront Loop",
      location: "Downtown Portland",
      distance: "4.2 miles",
      distanceNum: 4.2,
      elevation: "65 ft",
      difficulty: "Easy",
      terrain: "Paved",
      rating: 4.8,
      favorites: 245,
      imageUrl: "https://images.unsplash.com/photo-1465188162913-8fb5709d6d57?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
      safetyRating: 4.5
    },
    {
      id: "2",
      name: "Forest Park Trail",
      location: "Northwest Portland",
      distance: "7.8 miles",
      distanceNum: 7.8,
      elevation: "820 ft",
      difficulty: "Moderate",
      terrain: "Trail",
      rating: 4.7,
      favorites: 189,
      imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1471&q=80",
      safetyRating: 3.8
    },
    {
      id: "3",
      name: "Mt. Tabor Circuit",
      location: "Southeast Portland",
      distance: "3.1 miles",
      distanceNum: 3.1,
      elevation: "350 ft",
      difficulty: "Moderate",
      terrain: "Mixed",
      rating: 4.5,
      favorites: 132,
      imageUrl: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
      safetyRating: 4.2
    },
    {
      id: "4",
      name: "Springwater Corridor",
      location: "Southeast Portland",
      distance: "10.5 miles",
      distanceNum: 10.5,
      elevation: "120 ft",
      difficulty: "Easy",
      terrain: "Paved",
      rating: 4.6,
      favorites: 178,
      imageUrl: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1374&q=80",
      safetyRating: 3.5
    },
    {
      id: "5",
      name: "Powell Butte Loop",
      location: "East Portland",
      distance: "5.7 miles",
      distanceNum: 5.7,
      elevation: "580 ft",
      difficulty: "Moderate",
      terrain: "Trail",
      rating: 4.4,
      favorites: 97,
      imageUrl: "https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1469&q=80",
      safetyRating: 4.0
    },
    {
      id: "6",
      name: "North Portland Greenway",
      location: "North Portland",
      distance: "8.2 miles",
      distanceNum: 8.2,
      elevation: "210 ft",
      difficulty: "Easy",
      terrain: "Mixed",
      rating: 4.2,
      favorites: 85,
      imageUrl: "https://images.unsplash.com/photo-1475113548554-5a36f1f523d6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1373&q=80",
      safetyRating: 3.9
    },
  ];
  
  // Sample images for generated routes
  const sampleImages = [
    "https://images.unsplash.com/photo-1464207687429-7505649dae38?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1373&q=80",
    "https://images.unsplash.com/photo-1473773508845-188df298d2d1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1374&q=80",
    "https://images.unsplash.com/photo-1570151158645-125daa5421be?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
    "https://images.unsplash.com/photo-1529310399831-ed472b81d589?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1374&q=80",
  ];
  
  // Combine standard routes with generated routes
  const allRoutes = [...routes, ...generatedRoutes];
  
  // Filter routes based on search and filters
  const filteredRoutes = allRoutes.filter(route => {
    if (searchQuery && !route.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !route.location.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    if (filters.difficulty && route.difficulty !== filters.difficulty) {
      return false;
    }
    
    if (filters.terrain && route.terrain !== filters.terrain) {
      return false;
    }
    
    // Check if route distance is less than or equal to the filter distance
    if (filters.distance[0] && route.distanceNum > filters.distance[0]) {
      return false;
    }
    
    return true;
  });
  
  const generateRoutes = () => {
    if (!startingLocation) {
      toast({
        title: "Missing location",
        description: "Please enter a starting location",
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
      
      setGeneratedRoutes([...newRoutes]);
      setIsGeneratingRoute(false);
      setShowGenerateDialog(false);
      
      toast({
        title: "Routes generated",
        description: `Three ${preferredDistance[0]}-mile ${routeType.replace("-", " ")} routes generated from ${startingLocation}`,
      });
      
      // Switch to discover tab to show the new routes
      setActiveTab("discover");
    }, 2000);
  };
  
  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-6 flex items-center">
            <Route className="mr-2 h-6 w-6 text-runher" />
            Running Routes
          </h1>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                placeholder="Search routes by name or location"
                className="pl-10 h-11"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              className="h-11 flex items-center gap-2"
              onClick={() => setFilterVisible(!filterVisible)}
            >
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button 
              variant="outline" 
              className="h-11 flex items-center gap-2"
            >
              <ArrowUpDown className="h-4 w-4" />
              Sort
            </Button>
            
            <Button 
              className="h-11 bg-runher hover:bg-runher-dark flex items-center gap-2"
              onClick={() => setShowGenerateDialog(true)}
            >
              <Navigation className="h-4 w-4" />
              Generate Route
            </Button>
            
            <Link to="/hazards">
              <Button 
                variant="outline" 
                className="h-11 flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Report Hazard
              </Button>
            </Link>
          </div>
          
          {filterVisible && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 p-4 bg-white rounded-lg shadow-sm">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Distance (up to {filters.distance[0]} miles)
                </label>
                <Slider
                  defaultValue={[5]}
                  max={20}
                  step={1}
                  onValueChange={(value) => setFilters({...filters, distance: value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Difficulty</label>
                <Select 
                  value={filters.difficulty}
                  onValueChange={(value) => setFilters({...filters, difficulty: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any difficulty</SelectItem>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Moderate">Moderate</SelectItem>
                    <SelectItem value="Challenging">Challenging</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Terrain</label>
                <Select
                  value={filters.terrain}
                  onValueChange={(value) => setFilters({...filters, terrain: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any terrain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any terrain</SelectItem>
                    <SelectItem value="Paved">Paved</SelectItem>
                    <SelectItem value="Trail">Trail</SelectItem>
                    <SelectItem value="Mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Elevation (up to {filters.elevation[0]} ft)
                </label>
                <Slider
                  defaultValue={[100]}
                  max={1000}
                  step={50}
                  onValueChange={(value) => setFilters({...filters, elevation: value})}
                />
              </div>
            </div>
          )}
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="discover">Discover Routes</TabsTrigger>
            <TabsTrigger value="favorites">My Favorites</TabsTrigger>
            <TabsTrigger value="created">My Routes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="discover" className="mt-0">
            {filteredRoutes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRoutes.map(route => (
                  <RouteCard key={route.id} route={route} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <Map className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">No routes found</h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
                  We couldn't find any routes matching your search criteria. Try adjusting your filters or search terms.
                </p>
                <Button 
                  className="mt-4 bg-runher hover:bg-runher-dark" 
                  onClick={() => {
                    setSearchQuery("");
                    setFilters({
                      distance: [5],
                      difficulty: "",
                      terrain: "",
                      elevation: [100],
                    });
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="favorites" className="mt-0">
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <Heart className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No favorite routes yet</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
                When you find routes you love, mark them as favorites to access them quickly.
              </p>
              <Button 
                className="mt-4 bg-runher hover:bg-runher-dark"
                onClick={() => setActiveTab("discover")}
              >
                Discover Routes
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="created" className="mt-0">
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <Route className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">Create your own routes</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
                Plan and save your favorite running paths to share with the community.
              </p>
              <Button className="mt-4 bg-runher hover:bg-runher-dark">
                Create New Route
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Generate routes dialog */}
        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
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
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Enter your starting point"
                    className="pl-10"
                    value={startingLocation}
                    onChange={(e) => setStartingLocation(e.target.value)}
                  />
                </div>
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
              <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
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
      </div>
    </AppLayout>
  );
};

export default RunningRoutes;
