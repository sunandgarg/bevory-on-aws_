import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ChevronDown, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation, POPULAR_CITIES, CITIES_BY_STATE } from "@/hooks/useLocation";
import { useAppSettings } from "@/hooks/useAppSettings";
import BrandingDisplay from "@/components/layout/BrandingDisplay";

const AGE_VERIFIED_KEY = "bevory-age-verified-v25";

const AgeVerificationModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCityName, setSelectedCityName] = useState<string>("Gurgaon");
  const { setCityByName } = useLocation();
  const { ageSettings, loading: settingsLoading } = useAppSettings();

  useEffect(() => {
    if (settingsLoading) return;
    
    // If popup is disabled, mark as verified immediately
    if (!ageSettings.enabled) {
      setIsVerified(true);
      return;
    }

    const verified = localStorage.getItem(AGE_VERIFIED_KEY);
    if (!verified) {
      setIsOpen(true);
      setSelectedCityName(ageSettings.defaultCity || "Gurgaon");
    } else {
      setIsVerified(true);
    }
  }, [settingsLoading, ageSettings]);

  const handleVerify = async () => {
    await setCityByName(selectedCityName);
    localStorage.setItem(AGE_VERIFIED_KEY, "true");
    setIsVerified(true);
    setIsOpen(false);
  };

  const handleDecline = () => {
    window.location.href = "https://www.google.com";
  };

  const handleCitySelect = (cityName: string) => {
    setSelectedCityName(cityName);
    setShowCitySelector(false);
  };

  const getFilteredCities = () => {
    if (!searchQuery) return null;
    
    const query = searchQuery.toLowerCase();
    const filtered: string[] = [];
    
    POPULAR_CITIES.forEach(city => {
      if (city.toLowerCase().includes(query) && !filtered.includes(city)) {
        filtered.push(city);
      }
    });
    
    Object.values(CITIES_BY_STATE).forEach(cities => {
      cities.forEach(city => {
        if (city.toLowerCase().includes(query) && !filtered.includes(city)) {
          filtered.push(city);
        }
      });
    });
    
    return filtered;
  };

  if (isVerified || settingsLoading) return null;

  const filteredCities = getFilteredCities();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: "hsl(220 20% 15% / 0.95)" }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="w-full max-w-md rounded-3xl bg-card border border-border text-center shadow-elevated overflow-hidden"
          >
            {!showCitySelector ? (
              <div className="p-8">
                <div className="flex justify-center mb-6">
                  <BrandingDisplay variant="auth" />
                </div>

                <h2 className="text-2xl font-serif font-bold text-foreground mb-2">
                  {ageSettings.title}
                </h2>

                <p className="text-muted-foreground mb-6">
                  {ageSettings.description}
                </p>

                {/* City Selector Button */}
                <button
                  onClick={() => setShowCitySelector(true)}
                  className="w-full flex items-center justify-between p-4 mb-6 rounded-xl bg-muted/50 border border-border hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-accent" />
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">Your City</p>
                      <p className="font-medium text-foreground">{selectedCityName}</p>
                    </div>
                  </div>
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </button>

                <div className="flex flex-col gap-3">
                  <Button onClick={handleVerify} variant="gold" size="xl" className="w-full">
                    {ageSettings.confirmButtonText}
                  </Button>
                  <Button
                    onClick={handleDecline}
                    variant="ghost"
                    className="w-full py-6 text-muted-foreground hover:text-foreground"
                  >
                    {ageSettings.declineButtonText}
                  </Button>
                </div>

                <p className="mt-6 text-xs text-muted-foreground">
                  {ageSettings.termsText}
                </p>
              </div>
            ) : (
              <div className="h-[80vh] max-h-[600px] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Select Your City</h3>
                    <button 
                      onClick={() => setShowCitySelector(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  </div>
                  
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search city..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Cities List */}
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-6">
                    {filteredCities ? (
                      <div className="space-y-1">
                        {filteredCities.map((city) => (
                          <button
                            key={city}
                            onClick={() => handleCitySelect(city)}
                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors"
                          >
                            <span className="font-medium">{city}</span>
                            {selectedCityName === city && (
                              <Check className="w-5 h-5 text-accent" />
                            )}
                          </button>
                        ))}
                        {filteredCities.length === 0 && (
                          <p className="text-center text-muted-foreground py-8">
                            No cities found
                          </p>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* Popular Cities */}
                        <div>
                          <h4 className="text-sm font-semibold text-muted-foreground mb-2 px-3">
                            Popular Cities
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {POPULAR_CITIES.map((city) => (
                              <button
                                key={city}
                                onClick={() => handleCitySelect(city)}
                                className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                                  selectedCityName === city 
                                    ? "bg-accent/20 border border-accent" 
                                    : "bg-muted/50 hover:bg-muted"
                                }`}
                              >
                                <span className="font-medium text-sm">{city}</span>
                                {selectedCityName === city && (
                                  <Check className="w-4 h-4 text-accent" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Cities by State */}
                        {Object.entries(CITIES_BY_STATE).map(([state, cities]) => (
                          <div key={state}>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2 px-3">
                              {state}
                            </h4>
                            <div className="space-y-1">
                              {cities.map((city) => (
                                <button
                                  key={`${state}-${city}`}
                                  onClick={() => handleCitySelect(city)}
                                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                                    selectedCityName === city 
                                      ? "bg-accent/20 border border-accent" 
                                      : "hover:bg-muted"
                                  }`}
                                >
                                  <span className="font-medium">{city}</span>
                                  {selectedCityName === city && (
                                    <Check className="w-5 h-5 text-accent" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </ScrollArea>

                {/* Confirm Button */}
                <div className="p-4 border-t border-border">
                  <Button 
                    onClick={() => setShowCitySelector(false)}
                    className="w-full"
                    variant="gold"
                  >
                    Confirm: {selectedCityName}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AgeVerificationModal;
