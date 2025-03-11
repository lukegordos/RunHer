
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FiltersProps {
  filters: {
    distance: number[];
    difficulty: string;
    terrain: string;
    elevation: number[];
  };
  setFilters: (filters: {
    distance: number[];
    difficulty: string;
    terrain: string;
    elevation: number[];
  }) => void;
}

const RouteFilters = ({ filters, setFilters }: FiltersProps) => {
  return (
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
  );
};

export default RouteFilters;
