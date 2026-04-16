import { useState } from "react";
import { MapPin, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation, POPULAR_CITIES } from "@/hooks/useLocation";
import { cn } from "@/lib/utils";

interface LocationSelectorProps {
  variant?: "default" | "compact";
  className?: string;
}

const LocationSelector = ({ variant = "default", className }: LocationSelectorProps) => {
  const {
    allCities,
    selectedCity,
    setSelectedCity,
    loading,
    setCityByName,
  } = useLocation();

  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const displayText = selectedCity?.name || "Select City";

  // Filter cities based on search
  const filteredCities = allCities.filter(city => 
    city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    city.state?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate popular and other cities
  const popularCities = filteredCities.filter(c => POPULAR_CITIES.includes(c.name));
  const otherCities = filteredCities.filter(c => !POPULAR_CITIES.includes(c.name));

  const handleCitySelect = (city: typeof allCities[0]) => {
    setSelectedCity(city);
    setOpen(false);
    setSearchQuery("");
  };

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary animate-pulse", className)}>
        <MapPin className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) setSearchQuery("");
    }}>
      <DialogTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-muted transition-colors",
            className
          )}
        >
          <MapPin className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium truncate max-w-[120px]">{displayText}</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-accent" />
            Select Your City
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search cities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="max-h-[400px]">
          {/* Popular Cities */}
          {popularCities.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2 px-1">Popular Cities</p>
              <div className="grid grid-cols-2 gap-2">
                {popularCities.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => handleCitySelect(city)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-all text-left",
                      selectedCity?.id === city.id 
                        ? "border-accent bg-accent/10" 
                        : "border-border hover:border-accent/50"
                    )}
                  >
                    <div>
                      <p className="font-medium text-sm">{city.name}</p>
                      {city.state && (
                        <p className="text-xs text-muted-foreground">{city.state.name}</p>
                      )}
                    </div>
                    {selectedCity?.id === city.id && (
                      <Check className="w-4 h-4 text-accent" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Other Cities */}
          {otherCities.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
                {searchQuery ? "Search Results" : "Other Cities"}
              </p>
              <div className="space-y-1">
                {otherCities.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => handleCitySelect(city)}
                    className={cn(
                      "flex items-center justify-between w-full p-2 rounded-lg transition-all text-left",
                      selectedCity?.id === city.id 
                        ? "bg-accent/10" 
                        : "hover:bg-secondary"
                    )}
                  >
                    <div>
                      <span className="text-sm">{city.name}</span>
                      {city.state && (
                        <span className="text-xs text-muted-foreground ml-2">({city.state.name})</span>
                      )}
                    </div>
                    {selectedCity?.id === city.id && (
                      <Check className="w-4 h-4 text-accent" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredCities.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No cities found for "{searchQuery}"
            </p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default LocationSelector;
