import { useEffect } from "react";
import { useLocation } from "@/hooks/useLocation";
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

  // Update document title for SEO
  useEffect(() => {
    const cityName = citySlug.charAt(0).toUpperCase() + citySlug.slice(1);
    document.title = `Alcohol Prices in ${cityName} | BevOry - Compare Liquor Prices`;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        `Compare alcohol prices in ${cityName}. Find the best deals on whiskey, beer, wine, rum and more. Check today's liquor prices at BevOry.`
      );
    }
  }, [citySlug]);

  return <Home />;
};

export default CityHome;