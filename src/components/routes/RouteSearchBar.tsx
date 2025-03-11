
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Navigation, 
  AlertTriangle 
} from "lucide-react";

interface RouteSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterVisible: boolean;
  setFilterVisible: (visible: boolean) => void;
  setShowGenerateDialog: (show: boolean) => void;
}

const RouteSearchBar = ({
  searchQuery,
  setSearchQuery,
  filterVisible,
  setFilterVisible,
  setShowGenerateDialog,
}: RouteSearchBarProps) => {
  return (
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
  );
};

export default RouteSearchBar;
