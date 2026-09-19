import { useEffect } from "react";
import { cityFromSlug } from "@/lib/locations";
import { useLocation } from "@/hooks/useLocation";

export const useRouteCity = (citySlug?: string, fallbackSlug?: string) => {
  const location = useLocation();
  const routeCity = citySlug || fallbackSlug ? cityFromSlug(citySlug || fallbackSlug || "") : undefined;
  const routeCityName = routeCity?.name;
  const selectedMatchesRoute = !routeCityName
    || location.selectedCity?.name.toLowerCase() === routeCityName.toLowerCase();
  const { setCityByName } = location;

  useEffect(() => {
    if (routeCityName && !selectedMatchesRoute) void setCityByName(routeCityName);
  }, [routeCityName, selectedMatchesRoute, setCityByName]);

  return {
    ...location,
    routeCity,
    routeCityReady: selectedMatchesRoute,
  };
};
