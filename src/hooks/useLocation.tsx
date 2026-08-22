import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { apiClient } from "@/integrations/api/client";

interface Country {
  id: string;
  name: string;
  code: string;
  flag: string | null;
}

interface State {
  id: string;
  name: string;
  code: string;
  country_id: string;
}

interface City {
  id: string;
  name: string;
  state_id: string;
}

interface CityWithState extends City {
  state?: State;
}

interface LocationContextType {
  countries: Country[];
  states: State[];
  cities: City[];
  allCities: CityWithState[];
  selectedCountry: Country | null;
  selectedState: State | null;
  selectedCity: City | null;
  setSelectedCountry: (country: Country | null) => void;
  setSelectedState: (state: State | null) => void;
  setSelectedCity: (city: City | null) => void;
  setCityByName: (cityName: string) => Promise<boolean>;
  loading: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const LOCATION_CACHE_KEY = "bevory_location";
const AGE_VERIFIED_KEY = "bevory-age-verified";

// Popular cities list (shown first)
export const POPULAR_CITIES = [
  "Goa", "Jaipur", "Lucknow", "Delhi", "Gurgaon", 
  "Kolkata", "Bangalore", "Hyderabad", "Mumbai"
];

// Cities grouped by state (sorted alphabetically by state)
export const CITIES_BY_STATE: Record<string, string[]> = {
  "Delhi": ["Delhi"],
  "Goa": ["Goa"],
  "Haryana": ["Faridabad", "Gurgaon"],
  "Karnataka": ["Bangalore", "Hubli-Dharwad", "Mangalore", "Mysore"],
  "Madhya Pradesh": ["Bhopal", "Gwalior", "Indore", "Jabalpur"],
  "Maharashtra": ["Mumbai"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Kota", "Udaipur"],
  "Telangana": ["Hyderabad", "Warangal"],
  "Uttar Pradesh": ["Agra", "Ghaziabad", "Kanpur", "Lucknow", "Noida"],
  "West Bengal": ["Asansol", "Kolkata"],
};

// Default city if no match found
export const DEFAULT_CITY = "Gurgaon";
export const DEFAULT_CITY_ID = "00000000-0000-0000-0002-000000000012";

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [allCities, setAllCities] = useState<CityWithState[]>([]);
  const [selectedCountry, setSelectedCountryState] = useState<Country | null>(null);
  const [selectedState, setSelectedStateState] = useState<State | null>(null);
  const [selectedCity, setSelectedCityState] = useState<City | null>(null);
  const [loading, setLoading] = useState(true);

  // Load cached location on mount
  useEffect(() => {
    const cached = localStorage.getItem(LOCATION_CACHE_KEY);
    if (cached) {
      try {
        const { country, state, city } = JSON.parse(cached);
        if (country) setSelectedCountryState(country);
        if (state) setSelectedStateState(state);
        if (city) setSelectedCityState(city);
      } catch (e) {
        console.error("Failed to parse cached location:", e);
      }
    }
  }, []);

  // Fetch countries
  useEffect(() => {
    const fetchCountries = async () => {
      const { data, error } = await apiClient
        .from("countries")
        .select("*")
        .order("name");
      
      if (!error && data) {
        setCountries(data);
        // Auto-select India if no country selected
        if (!selectedCountry) {
          const india = data.find(c => c.code === "IN");
          if (india) setSelectedCountryState(india);
        }
      }
      setLoading(false);
    };
    fetchCountries();
  }, []);

  // Fetch all cities with their states for the new selector
  useEffect(() => {
    const fetchAllCities = async () => {
      const { data, error } = await apiClient
        .from("cities")
        .select(`
          *,
          state:states(*)
        `)
        .order("name");
      
      if (!error && data) {
        setAllCities(data as CityWithState[]);
      }
    };
    fetchAllCities();
  }, []);

  // Fetch states when country changes
  useEffect(() => {
    if (!selectedCountry) {
      setStates([]);
      return;
    }

    const fetchStates = async () => {
      const { data, error } = await apiClient
        .from("states")
        .select("*")
        .eq("country_id", selectedCountry.id)
        .order("name");
      
      if (!error && data) {
        setStates(data);
      }
    };
    fetchStates();
  }, [selectedCountry]);

  // Fetch cities when state changes
  useEffect(() => {
    if (!selectedState) {
      setCities([]);
      return;
    }

    const fetchCities = async () => {
      const { data, error } = await apiClient
        .from("cities")
        .select("*")
        .eq("state_id", selectedState.id)
        .order("name");
      
      if (!error && data) {
        setCities(data);
      }
    };
    fetchCities();
  }, [selectedState]);

  // Save to cache when location changes
  useEffect(() => {
    if (selectedCountry || selectedState || selectedCity) {
      localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify({
        country: selectedCountry,
        state: selectedState,
        city: selectedCity,
      }));
    }
  }, [selectedCountry, selectedState, selectedCity]);

  const setSelectedCountry = (country: Country | null) => {
    setSelectedCountryState(country);
    setSelectedStateState(null);
    setSelectedCityState(null);
  };

  const setSelectedState = (state: State | null) => {
    setSelectedStateState(state);
    setSelectedCityState(null);
  };

  const setSelectedCity = (city: City | null) => {
    setSelectedCityState(city);
  };

  // Set city by name - returns true if city was found and set
  const setCityByName = async (cityName: string): Promise<boolean> => {
    const normalizedName = cityName.toLowerCase().trim();
    
    // First check in allCities
    let foundCity = allCities.find(
      c => c.name.toLowerCase() === normalizedName
    );

    // If not found locally, fetch from DB
    if (!foundCity) {
      const { data } = await apiClient
        .from("cities")
        .select(`
          *,
          state:states(*)
        `)
        .ilike("name", cityName)
        .limit(1)
        .maybeSingle();
      
      if (data) {
        foundCity = data as CityWithState;
      }
    }

    if (foundCity) {
      // Also set the state and country
      if (foundCity.state) {
        // Fetch country for the state
        const { data: countryData } = await apiClient
          .from("countries")
          .select("*")
          .eq("id", foundCity.state.country_id)
          .maybeSingle();
        
        if (countryData) {
          setSelectedCountryState(countryData);
        }
        setSelectedStateState(foundCity.state);
      }
      setSelectedCityState(foundCity);
      return true;
    }
    
    return false;
  };

  return (
    <LocationContext.Provider
      value={{
        countries,
        states,
        cities,
        allCities,
        selectedCountry,
        selectedState,
        selectedCity,
        setSelectedCountry,
        setSelectedState,
        setSelectedCity,
        setCityByName,
        loading,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
};