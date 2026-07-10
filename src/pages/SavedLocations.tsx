import { useState } from "react";
import { MapPin, Plus, Trash2, Star, Check } from "lucide-react";
import { Link } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import { useSavedLocations } from "@/hooks/useSavedLocations";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "@/hooks/useLocation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SavedLocations = () => {
  const { user, loading: authLoading } = useAuth();
  const { locations, loading, addLocation, removeLocation, setDefault } = useSavedLocations();
  const { allCities, setSelectedCity } = useLocation();
  const [showAdd, setShowAdd] = useState(false);
  const [newCityId, setNewCityId] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const handleAdd = async () => {
    if (!newCityId) return;
    const success = await addLocation(newCityId, newLabel || undefined);
    if (success) {
      setShowAdd(false);
      setNewCityId("");
      setNewLabel("");
    }
  };

  const handleUseLocation = (cityId: string) => {
    const city = allCities.find((c) => c.id === cityId);
    if (city) {
      setSelectedCity(city);
    }
  };

  if (authLoading) {
    return (
      <MobileLayout title="Saved Locations" showBack>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  if (!user) {
    return (
      <MobileLayout title="Saved Locations" showBack>
        <div className="p-4 text-center py-12">
          <MapPin className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-serif font-bold mb-2">Sign in Required</h2>
          <p className="text-muted-foreground mb-6">
            Sign in to save your favorite locations
          </p>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Saved Locations" showBack>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-accent" />
            <h1 className="text-xl font-serif font-bold">Saved Locations</h1>
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : locations.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No saved locations yet. Add your favorite cities!
            </p>
            <Button variant="outline" onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Location
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {locations.map((loc) => (
              <div
                key={loc.id}
                className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border"
              >
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{loc.city?.name}</span>
                    {loc.is_default && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {loc.label || loc.city?.state?.name}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleUseLocation(loc.city_id)}
                    title="Use this location"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  {!loc.is_default && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDefault(loc.id)}
                      title="Set as default"
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => removeLocation(loc.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">City</label>
              <Select value={newCityId} onValueChange={setNewCityId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a city" />
                </SelectTrigger>
                <SelectContent>
                  {allCities.map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.name} {city.state ? `(${city.state.name})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Label (optional)</label>
              <Input
                placeholder="e.g., Home, Work"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={handleAdd} disabled={!newCityId}>
              Add Location
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default SavedLocations;
