import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, ChevronDown, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation } from "@/hooks/useLocation";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation as useRouterLocation } from "react-router-dom";

interface City {
  id: string;
  name: string;
  state_id: string;
  state_name?: string;
}

interface StateGroup {
  state_name: string;
  cities: City[];
}

const POPULAR_CITIES = [
  "Goa", "Jaipur", "Lucknow", "Delhi", "Gurgaon", 
  "Kolkata", "Bangalore", "Hyderabad", "Mumbai"
];

// Sorted alphabetically by state name
const STATE_ORDER = [
  "Delhi",
  "Goa",
  "Haryana",
  "Karnataka",
  "Madhya Pradesh",
  "Maharashtra",
  "Rajasthan", 
  "Telangana",
  "Uttar Pradesh",
  "West Bengal"
];

interface LocationSelectorNewProps {
  variant?: "default" | "compact";
  className?: string;
  onCitySelect?: () => void;
}

const LocationSelectorNew = ({ variant = "default", className, onCitySelect }: LocationSelectorNewProps) => {
  const {
    selectedCity,
    setSelectedCity,
    setSelectedState,
    states,
    loading: locationLoading,
  } = useLocation();

  const navigate = useNavigate();
  const routerLocation = useRouterLocation();

  const [open, setOpen] = useState(false);
  const [allCities, setAllCities] = useState<City[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Use ref to track if we've already initialized - persists across renders
  const hasInitialized = useRef(false);

  // Fetch all cities with state names
  useEffect(() => {
    const fetchAllCities = async () => {
      const { data, error } = await supabase
        .from("cities")
        .select(`
          id,
          name,
          state_id,
          states!inner(name)
        `)
        .order("name");

      if (!error && data) {
        const citiesWithState = data.map((city: any) => ({
          id: city.id,
          name: city.name,
          state_id: city.state_id,
          state_name: city.states?.name,
        }));
        setAllCities(citiesWithState);
      }
      setLoading(false);
    };
    fetchAllCities();
  }, []);

  // Initialize city ONLY ONCE when cities are loaded and no city is selected
  useEffect(() => {
    // Skip if already initialized or cities not loaded yet
    if (hasInitialized.current || allCities.length === 0) return;
    
    // If user already has a selected city from context (loaded from localStorage), mark as initialized
    if (selectedCity && selectedCity.id) {
      hasInitialized.current = true;
      return;
    }

    // Try to get city from cookie
    const cookieCity = document.cookie
      .split("; ")
      .find((row) => row.startsWith("bevory_city="))
      ?.split("=")[1];

    if (cookieCity) {
      const city = allCities.find(
        (c) => c.name.toLowerCase() === decodeURIComponent(cookieCity).toLowerCase()
      );
      if (city) {
        // Set city without triggering navigation for initial load
        const state = states.find((s) => s.id === city.state_id);
        if (state) {
          setSelectedState(state);
        }
        setSelectedCity({ id: city.id, name: city.name, state_id: city.state_id });
        hasInitialized.current = true;
        return;
      }
    }

    // Default to Gurgaon only if nothing is selected
    const gurgaon = allCities.find((c) => c.name.toLowerCase() === "gurgaon");
    if (gurgaon) {
      const state = states.find((s) => s.id === gurgaon.state_id);
      if (state) {
        setSelectedState(state);
      }
      setSelectedCity({ id: gurgaon.id, name: gurgaon.name, state_id: gurgaon.state_id });
    }
    hasInitialized.current = true;
  }, [allCities, states, selectedCity, setSelectedCity, setSelectedState]);

  // Convert city name to slug
  const getCitySlug = useCallback((cityName: string) => {
    return cityName.toLowerCase().replace(/\s+/g, '-');
  }, []);

  const handleCitySelect = useCallback((city: City) => {
    // Find and set state first
    const state = states.find((s) => s.id === city.state_id);
    if (state) {
      setSelectedState(state);
    }
    setSelectedCity({ id: city.id, name: city.name, state_id: city.state_id });
    
    // Save to cookie
    document.cookie = `bevory_city=${encodeURIComponent(city.name)}; max-age=31536000; path=/`;
    
    // Navigate to the city route if on homepage
    const citySlug = getCitySlug(city.name);
    if (routerLocation.pathname === '/' || routerLocation.pathname.match(/^\/[a-z-]+$/)) {
      navigate(`/${citySlug}`, { replace: true });
    }
    
    setOpen(false);
    onCitySelect?.();
  }, [states, setSelectedState, setSelectedCity, getCitySlug, navigate, routerLocation.pathname, onCitySelect]);

  // Filter and group cities
  const popularCities = allCities.filter((c) =>
    POPULAR_CITIES.some((pc) => c.name.toLowerCase().includes(pc.toLowerCase()))
  );

  const groupedCities: StateGroup[] = STATE_ORDER.map((stateName) => ({
    state_name: stateName,
    cities: allCities.filter((c) => c.state_name === stateName),
  })).filter((group) => group.cities.length > 0);

  // Search filter
  const filteredCities = searchQuery
    ? allCities.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.state_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const displayText = selectedCity?.name || "Select City";

  if (locationLoading || loading) {
    return (
      <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary animate-pulse", className)}>
        <MapPin className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-muted transition-colors",
            className
          )}
        >
          <MapPin className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium truncate max-w-[100px]">{displayText}</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-accent" />
            Select Your City
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
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

          <ScrollArea className="h-[calc(85vh-160px)]">
            {searchQuery ? (
              // Search Results
              <div className="space-y-2">
                {filteredCities.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No cities found</p>
                ) : (
                  filteredCities.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => handleCitySelect(city)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors",
                        selectedCity?.id === city.id && "bg-accent/10"
                      )}
                    >
                      <div className="text-left">
                        <p className="font-medium">{city.name}</p>
                        <p className="text-xs text-muted-foreground">{city.state_name}</p>
                      </div>
                      {selectedCity?.id === city.id && (
                        <Check className="w-4 h-4 text-accent" />
                      )}
                    </button>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Popular Cities */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                    Popular Cities
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {popularCities.map((city) => (
                      <button
                        key={city.id}
                        onClick={() => handleCitySelect(city)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                          selectedCity?.id === city.id
                            ? "bg-accent text-accent-foreground"
                            : "bg-secondary hover:bg-muted"
                        )}
                      >
                        {city.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grouped by State */}
                {groupedCities.map((group) => (
                  <div key={group.state_name}>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                      {group.state_name}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {group.cities.map((city) => (
                        <button
                          key={city.id}
                          onClick={() => handleCitySelect(city)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-sm transition-colors",
                            selectedCity?.id === city.id
                              ? "bg-accent text-accent-foreground"
                              : "bg-secondary/50 hover:bg-secondary"
                          )}
                        >
                          {city.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LocationSelectorNew;
