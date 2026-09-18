import { useEffect } from "react";
import { useLocation } from "@/hooks/useLocation";
import SEOHead from "@/components/SEOHead";
import Home from "./Home";

interface CityHomeProps {
  citySlug: string;
}

const CityHome = ({ citySlug }: CityHomeProps) => {
  const { setCityByName, selectedCity } = useLocation();

  useEffect(() => {
    // Capitalize city name for display
    const cityName = citySlug.charAt(0).toUpperCase() + citySlug.slice(1);
    
    // Set city if not already selected or different
    if (!selectedCity || selectedCity.name.toLowerCase() !== citySlug.toLowerCase()) {
      setCityByName(cityName);
    }
  }, [citySlug, setCityByName, selectedCity]);

  const cityName = citySlug.charAt(0).toUpperCase() + citySlug.slice(1);

  return (
    <>
      <SEOHead
        title={`Alcohol Prices in ${cityName} | Bevory`}
        description={`Compare alcohol prices in ${cityName}. Explore whisky, beer, wine, rum and more with Bevory's local price guide.`}
        canonical={`/${citySlug}`}
        geoPlacename={cityName}
      />
      <Home />
    </>
  );
};

export default CityHome;
