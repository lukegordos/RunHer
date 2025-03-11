
import { useState } from "react";
import { Route, Map, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import AppLayout from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import the refactored components
import RouteCard, { RunRoute } from "@/components/routes/RouteCard";
import RouteGenerateDialog from "@/components/routes/RouteGenerateDialog";
import RouteFilters from "@/components/routes/RouteFilters";
import RouteSearchBar from "@/components/routes/RouteSearchBar";
import EmptyTabState from "@/components/routes/EmptyTabState";
import { sampleRoutes } from "@/components/routes/RoutesData";

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
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generatedRoutes, setGeneratedRoutes] = useState<RunRoute[]>([]);
  
  // Combine standard routes with generated routes
  const allRoutes = [...sampleRoutes, ...generatedRoutes];
  
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
  
  const handleGenerateRoutes = (newRoutes: RunRoute[]) => {
    setGeneratedRoutes([...newRoutes]);
    // Switch to discover tab to show the new routes
    setActiveTab("discover");
  };
  
  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-6 flex items-center">
            <Route className="mr-2 h-6 w-6 text-runher" />
            Running Routes
          </h1>
          
          <RouteSearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterVisible={filterVisible}
            setFilterVisible={setFilterVisible}
            setShowGenerateDialog={setShowGenerateDialog}
          />
          
          {filterVisible && (
            <RouteFilters
              filters={filters}
              setFilters={setFilters}
            />
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
              <EmptyTabState
                icon={Map}
                title="No routes found"
                description="We couldn't find any routes matching your search criteria. Try adjusting your filters or search terms."
                actionText="Clear Filters"
                onAction={() => {
                  setSearchQuery("");
                  setFilters({
                    distance: [5],
                    difficulty: "",
                    terrain: "",
                    elevation: [100],
                  });
                }}
              />
            )}
          </TabsContent>
          
          <TabsContent value="favorites" className="mt-0">
            <EmptyTabState
              icon={Heart}
              title="No favorite routes yet"
              description="When you find routes you love, mark them as favorites to access them quickly."
              actionText="Discover Routes"
              onAction={() => setActiveTab("discover")}
            />
          </TabsContent>
          
          <TabsContent value="created" className="mt-0">
            <EmptyTabState
              icon={Route}
              title="Create your own routes"
              description="Plan and save your favorite running paths to share with the community."
              actionText="Create New Route"
              onAction={() => {}}
            />
          </TabsContent>
        </Tabs>
        
        <RouteGenerateDialog 
          open={showGenerateDialog} 
          onOpenChange={setShowGenerateDialog}
          onGenerateRoutes={handleGenerateRoutes}
        />
      </div>
    </AppLayout>
  );
};

export default RunningRoutes;
