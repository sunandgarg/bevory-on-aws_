import { useEffect } from "react";
import { useLocation } from "@/hooks/useLocation";
import SEOHead from "@/components/SEOHead";
import { cityFromSlug } from "@/lib/locations";
import Home from "./Home";

interface CityHomeProps {
  citySlug: string;
}

const CityHome = ({ citySlug }: CityHomeProps) => {
  const { setCityByName, selectedCity } = useLocation();
  const city = cityFromSlug(citySlug);
  const cityName = city?.name || citySlug.split("-").map((part) => (
    part.charAt(0).toUpperCase() + part.slice(1)
  )).join(" ");

  useEffect(() => {
    // Set city if not already selected or different
    if (!selectedCity || selectedCity.name.toLowerCase() !== cityName.toLowerCase()) {
      setCityByName(cityName);
    }
  }, [cityName, setCityByName, selectedCity]);

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
