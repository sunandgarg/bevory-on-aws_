import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, MapPin, Eye, EyeOff, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import FormField from "@/components/admin/FormField";
import { useFormValidation, ValidationSchema } from "@/hooks/useFormValidation";
import CsvButtons from "@/components/admin/CsvButtons";
import { useCsvOperations } from "@/hooks/useCsvOperations";

interface State {
  id: string;
  name: string;
  code: string;
  country_id: string;
  is_visible: boolean | null;
  is_popular: boolean | null;
}

interface City {
  id: string;
  name: string;
  state_id: string;
  is_visible: boolean | null;
  is_popular: boolean | null;
  state?: State;
}

const stateValidationSchema: ValidationSchema = {
  name: { required: true, minLength: 2 },
  code: { required: true, minLength: 2, maxLength: 3 },
};

const cityValidationSchema: ValidationSchema = {
  name: { required: true, minLength: 2 },
  state_id: { required: true },
};

const AdminLocations = () => {
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [editState, setEditState] = useState<State | null>(null);
  const [editCity, setEditCity] = useState<City | null>(null);
  const [showStateDialog, setShowStateDialog] = useState(false);
  const [showCityDialog, setShowCityDialog] = useState(false);
  const [countryId, setCountryId] = useState<string | null>(null);
  const { toast } = useToast();
  const stateValidation = useFormValidation(stateValidationSchema);
  const cityValidation = useFormValidation(cityValidationSchema);

  const fetchData = async () => {
    let { data: countryData } = await apiClient
      .from("countries")
      .select("id")
      .eq("code", "IN")
      .maybeSingle();

    // Auto-seed India if it doesn't exist so admins can add states immediately
    if (!countryData) {
      const { data: inserted } = await apiClient
        .from("countries")
        .insert({ name: "India", code: "IN", flag: "🇮🇳" })
        .select("id")
        .maybeSingle();
      countryData = inserted;
    }

    if (countryData) {
      setCountryId(countryData.id);
    }

    const [statesRes, citiesRes] = await Promise.all([
      apiClient.from("states").select("*").order("name"),
      apiClient.from("cities").select("*, state:states(*)").order("name"),
    ]);

    if (statesRes.data) setStates(statesRes.data);
    if (citiesRes.data) setCities(citiesRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveState = async () => {
    if (!editState) return;
    if (!countryId) {
      toast({ title: "Setup error", description: "Default country (India) not initialised. Please refresh the page.", variant: "destructive" });
      return;
    }

    if (!stateValidation.validate({ name: editState.name, code: editState.code })) {
      toast({ title: "Validation Error", description: "Please fix the highlighted fields", variant: "destructive" });
      return;
    }

    const stateData = { ...editState, country_id: countryId };
    if (!stateData.id) delete (stateData as any).id;

    const { error } = editState.id
      ? await apiClient.from("states").update(stateData).eq("id", editState.id)
      : await apiClient.from("states").insert(stateData);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "State saved!" });
      setShowStateDialog(false);
      stateValidation.clearErrors();
      fetchData();
    }
  };

  const handleDeleteState = async (id: string) => {
    if (!confirm("Delete this state? All cities in this state will also be deleted.")) return;
    await apiClient.from("states").delete().eq("id", id);
    fetchData();
  };

  const toggleStateVisibility = async (id: string, visible: boolean) => {
    await apiClient.from("states").update({ is_visible: visible }).eq("id", id);
    fetchData();
  };

  const toggleStatePopular = async (id: string, popular: boolean) => {
    await apiClient.from("states").update({ is_popular: popular }).eq("id", id);
    fetchData();
  };

  const handleSaveCity = async () => {
    if (!editCity) return;

    if (!cityValidation.validate({ name: editCity.name, state_id: editCity.state_id })) {
      toast({ title: "Validation Error", description: "Please fix the highlighted fields", variant: "destructive" });
      return;
    }

    const cityData = { ...editCity };
    if (!cityData.id) delete (cityData as any).id;
    delete (cityData as any).state;

    const { error } = editCity.id
      ? await apiClient.from("cities").update(cityData).eq("id", editCity.id)
      : await apiClient.from("cities").insert(cityData);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "City saved!" });
      setShowCityDialog(false);
      cityValidation.clearErrors();
      fetchData();
    }
  };

  const handleDeleteCity = async (id: string) => {
    if (!confirm("Delete this city?")) return;
    await apiClient.from("cities").delete().eq("id", id);
    fetchData();
  };

  const toggleCityVisibility = async (id: string, visible: boolean) => {
    await apiClient.from("cities").update({ is_visible: visible }).eq("id", id);
    fetchData();
  };

  const toggleCityPopular = async (id: string, popular: boolean) => {
    await apiClient.from("cities").update({ is_popular: popular }).eq("id", id);
    fetchData();
  };

  const newState: State = {
    id: "",
    name: "",
    code: "",
    country_id: countryId || "",
    is_visible: true,
    is_popular: false,
  };

  const newCity: City = {
    id: "",
    name: "",
    state_id: "",
    is_visible: true,
    is_popular: false,
  };

  const openStateDialog = (state: State) => {
    setEditState(state);
    stateValidation.clearErrors();
    setShowStateDialog(true);
  };

  const openCityDialog = (city: City) => {
    setEditCity(city);
    cityValidation.clearErrors();
    setShowCityDialog(true);
  };

  const visibleStates = states.filter((s) => s.is_visible);
  const visibleCities = cities.filter((c) => c.is_visible);
  const popularCities = cities.filter((c) => c.is_popular);

  const cityCsvOps = useCsvOperations<City>({
    tableName: "cities",
    columns: ["id", "name", "state_id", "is_visible", "is_popular"],
    excludeColumns: ["id", "state"],
  });

  const handleCityCsvImport = async (rows: Partial<City>[]) => {
    for (const row of rows) {
      const { id, state, ...data } = row as City;
      if (id) {
        await apiClient.from("cities").update(data).eq("id", id);
      } else {
        await apiClient.from("cities").insert([data]);
      }
    }
    fetchData();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold">Locations</h2>
        <CsvButtons
          onExport={() => cityCsvOps.exportToCsv(cities.map(({ state, ...rest }) => rest))}
          onImportClick={cityCsvOps.triggerFileInput}
          fileInputRef={cityCsvOps.fileInputRef}
          onFileChange={(e) => {
            const file = e.target.files?.[0];
            if (file) cityCsvOps.importFromCsv(file, handleCityCsvImport);
            e.target.value = "";
          }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-card border text-center">
          <p className="text-2xl font-bold">{states.length}</p>
          <p className="text-sm text-muted-foreground">Total States</p>
        </div>
        <div className="p-4 rounded-xl bg-card border text-center">
          <p className="text-2xl font-bold">{visibleStates.length}</p>
          <p className="text-sm text-muted-foreground">Visible States</p>
        </div>
        <div className="p-4 rounded-xl bg-card border text-center">
          <p className="text-2xl font-bold">{cities.length}</p>
          <p className="text-sm text-muted-foreground">Total Cities</p>
        </div>
        <div className="p-4 rounded-xl bg-card border text-center">
          <p className="text-2xl font-bold">{popularCities.length}</p>
          <p className="text-sm text-muted-foreground">Popular Cities</p>
        </div>
      </div>

      <Tabs defaultValue="states" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="states">States</TabsTrigger>
          <TabsTrigger value="cities">Cities</TabsTrigger>
        </TabsList>

        <TabsContent value="states" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => openStateDialog(newState)}>
              <Plus className="w-4 h-4 mr-1" /> Add State
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="space-y-2">
              {states.map((state) => (
                <div
                  key={state.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border"
                >
                  <MapPin className="w-5 h-5 text-accent" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{state.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {state.code}
                      </Badge>
                      {!state.is_visible && (
                        <Badge variant="secondary" className="text-xs">
                          Hidden
                        </Badge>
                      )}
                      {state.is_popular && (
                        <Badge className="bg-accent text-xs">Popular</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {cities.filter((c) => c.state_id === state.id).length} cities
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => toggleStateVisibility(state.id, !state.is_visible)}
                    title={state.is_visible ? "Hide" : "Show"}
                  >
                    {state.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => toggleStatePopular(state.id, !state.is_popular)}
                    title={state.is_popular ? "Remove from popular" : "Mark as popular"}
                  >
                    <Star className={`w-4 h-4 ${state.is_popular ? "fill-accent text-accent" : ""}`} />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => openStateDialog(state)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleDeleteState(state.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cities" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => openCityDialog(newCity)}>
              <Plus className="w-4 h-4 mr-1" /> Add City
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="space-y-2">
              {cities.map((city) => (
                <div
                  key={city.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border"
                >
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{city.name}</p>
                      {city.state && (
                        <Badge variant="outline" className="text-xs">
                          {city.state.name}
                        </Badge>
                      )}
                      {!city.is_visible && (
                        <Badge variant="secondary" className="text-xs">
                          Hidden
                        </Badge>
                      )}
                      {city.is_popular && (
                        <Badge className="bg-accent text-xs">Popular</Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => toggleCityVisibility(city.id, !city.is_visible)}
                    title={city.is_visible ? "Hide" : "Show"}
                  >
                    {city.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => toggleCityPopular(city.id, !city.is_popular)}
                    title={city.is_popular ? "Remove from popular" : "Mark as popular"}
                  >
                    <Star className={`w-4 h-4 ${city.is_popular ? "fill-accent text-accent" : ""}`} />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => openCityDialog(city)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleDeleteCity(city.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* State Dialog */}
      <Dialog open={showStateDialog} onOpenChange={setShowStateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editState?.id ? "Edit" : "Add"} State</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <FormField label="State Name" required error={stateValidation.errors.name}>
              <Input
                placeholder="e.g., Haryana"
                value={editState?.name || ""}
                onChange={(e) => {
                  setEditState((p) => (p ? { ...p, name: e.target.value } : p));
                  stateValidation.clearError("name");
                }}
              />
            </FormField>
            <FormField label="State Code" required error={stateValidation.errors.code}>
              <Input
                placeholder="e.g., HR"
                value={editState?.code || ""}
                onChange={(e) => {
                  setEditState((p) => (p ? { ...p, code: e.target.value.toUpperCase() } : p));
                  stateValidation.clearError("code");
                }}
              />
            </FormField>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={editState?.is_visible ?? true}
                  onCheckedChange={(v) => setEditState((p) => (p ? { ...p, is_visible: v } : p))}
                />
                <span className="text-sm">Visible</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editState?.is_popular ?? false}
                  onCheckedChange={(v) => setEditState((p) => (p ? { ...p, is_popular: v } : p))}
                />
                <span className="text-sm">Popular</span>
              </div>
            </div>
            <Button className="w-full" onClick={handleSaveState}>
              Save State
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* City Dialog */}
      <Dialog open={showCityDialog} onOpenChange={setShowCityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editCity?.id ? "Edit" : "Add"} City</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <FormField label="City Name" required error={cityValidation.errors.name}>
              <Input
                placeholder="e.g., Gurgaon"
                value={editCity?.name || ""}
                onChange={(e) => {
                  setEditCity((p) => (p ? { ...p, name: e.target.value } : p));
                  cityValidation.clearError("name");
                }}
              />
            </FormField>
            <FormField label="State" required error={cityValidation.errors.state_id}>
              <Select
                value={editCity?.state_id || ""}
                onValueChange={(v) => {
                  setEditCity((p) => (p ? { ...p, state_id: v } : p));
                  cityValidation.clearError("state_id");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={editCity?.is_visible ?? true}
                  onCheckedChange={(v) => setEditCity((p) => (p ? { ...p, is_visible: v } : p))}
                />
                <span className="text-sm">Visible</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editCity?.is_popular ?? false}
                  onCheckedChange={(v) => setEditCity((p) => (p ? { ...p, is_popular: v } : p))}
                />
                <span className="text-sm">Popular</span>
              </div>
            </div>
            <Button className="w-full" onClick={handleSaveCity}>
              Save City
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLocations;