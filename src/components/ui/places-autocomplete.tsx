import { useEffect, useRef, useState } from "react";
import { Input } from "./input";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
  className?: string;
}

export function PlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  className,
}: PlacesAutocompleteProps) {
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize services only once when the component mounts
    if (window.google && !autocompleteService.current) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
      
      // Create a hidden map div for PlacesService
      if (!mapRef.current) {
        const mapDiv = document.createElement('div');
        mapDiv.style.display = 'none';
        document.body.appendChild(mapDiv);
        mapRef.current = mapDiv;
        
        // Initialize PlacesService with the hidden map div
        const map = new google.maps.Map(mapDiv, {
          center: { lat: 0, lng: 0 },
          zoom: 1
        });
        placesService.current = new google.maps.places.PlacesService(map);
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = async (inputValue: string) => {
    onChange(inputValue);
    
    if (!inputValue.trim()) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }

    try {
      if (autocompleteService.current) {
        const request: google.maps.places.AutocompletionRequest = {
          input: inputValue,
          componentRestrictions: { country: "us" },
          types: ["address"], // Only use address type to avoid mixing types
        };

        const response = await new Promise<google.maps.places.AutocompletePrediction[]>((resolve, reject) => {
          autocompleteService.current!.getPlacePredictions(
            request,
            (results, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                resolve(results);
              } else {
                reject(status);
              }
            }
          );
        });

        setPredictions(response);
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Autocomplete error:', error);
      setPredictions([]);
      setIsOpen(false);
    }
  };

  const handlePredictionClick = async (prediction: google.maps.places.AutocompletePrediction) => {
    try {
      if (placesService.current) {
        const request: google.maps.places.PlaceDetailsRequest = {
          placeId: prediction.place_id,
          fields: ["formatted_address", "geometry", "name"],
        };

        const place = await new Promise<google.maps.places.PlaceResult>((resolve, reject) => {
          placesService.current!.getDetails(request, (result, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && result) {
              resolve(result);
            } else {
              reject(status);
            }
          });
        });

        onChange(place.formatted_address || prediction.description);
        onPlaceSelect(place);
        setIsOpen(false);
        setPredictions([]);
      }
    } catch (error) {
      console.error('Place details error:', error);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <MapPin className="absolute left-2 top-2.5 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => value && predictions.length > 0 && setIsOpen(true)}
          className={cn(
            "pl-9 pr-4",
            className
          )}
          placeholder="Enter starting location"
        />
      </div>
      {isOpen && predictions.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover py-1 text-popover-foreground shadow-md">
          {predictions.map((prediction) => (
            <div
              key={prediction.place_id}
              className="relative flex cursor-pointer select-none items-center px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
              onClick={() => handlePredictionClick(prediction)}
            >
              <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="font-medium">{prediction.structured_formatting.main_text}</span>
                <span className="text-xs text-muted-foreground">{prediction.structured_formatting.secondary_text}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
