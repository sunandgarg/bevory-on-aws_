export type BevoryCity = {
  name: string;
  slug: string;
  state: string;
  stateCode: string;
  popular?: boolean;
};

export const BEVORY_CITIES: readonly BevoryCity[] = [
  { name: "Delhi", slug: "delhi", state: "Delhi", stateCode: "DL", popular: true },
  { name: "Goa", slug: "goa", state: "Goa", stateCode: "GA", popular: true },
  { name: "Faridabad", slug: "faridabad", state: "Haryana", stateCode: "HR" },
  { name: "Gurgaon", slug: "gurgaon", state: "Haryana", stateCode: "HR", popular: true },
  { name: "Bangalore", slug: "bangalore", state: "Karnataka", stateCode: "KA", popular: true },
  { name: "Hubli Dharwad", slug: "hubli-dharwad", state: "Karnataka", stateCode: "KA" },
  { name: "Mangalore", slug: "mangalore", state: "Karnataka", stateCode: "KA" },
  { name: "Mysore", slug: "mysore", state: "Karnataka", stateCode: "KA" },
  { name: "Bhopal", slug: "bhopal", state: "Madhya Pradesh", stateCode: "MP" },
  { name: "Gwalior", slug: "gwalior", state: "Madhya Pradesh", stateCode: "MP" },
  { name: "Indore", slug: "indore", state: "Madhya Pradesh", stateCode: "MP" },
  { name: "Jabalpur", slug: "jabalpur", state: "Madhya Pradesh", stateCode: "MP" },
  { name: "Mumbai", slug: "mumbai", state: "Maharashtra", stateCode: "MH", popular: true },
  { name: "Nagpur", slug: "nagpur", state: "Maharashtra", stateCode: "MH" },
  { name: "Nashik", slug: "nashik", state: "Maharashtra", stateCode: "MH" },
  { name: "Pune", slug: "pune", state: "Maharashtra", stateCode: "MH" },
  { name: "Thane", slug: "thane", state: "Maharashtra", stateCode: "MH" },
  { name: "Jaipur", slug: "jaipur", state: "Rajasthan", stateCode: "RJ", popular: true },
  { name: "Jodhpur", slug: "jodhpur", state: "Rajasthan", stateCode: "RJ" },
  { name: "Kota", slug: "kota", state: "Rajasthan", stateCode: "RJ" },
  { name: "Udaipur", slug: "udaipur", state: "Rajasthan", stateCode: "RJ" },
  { name: "Hyderabad", slug: "hyderabad", state: "Telangana", stateCode: "TS", popular: true },
  { name: "Warangal", slug: "warangal", state: "Telangana", stateCode: "TS" },
  { name: "Agra", slug: "agra", state: "Uttar Pradesh", stateCode: "UP" },
  { name: "Ghaziabad", slug: "ghaziabad", state: "Uttar Pradesh", stateCode: "UP" },
  { name: "Kanpur", slug: "kanpur", state: "Uttar Pradesh", stateCode: "UP" },
  { name: "Lucknow", slug: "lucknow", state: "Uttar Pradesh", stateCode: "UP", popular: true },
  { name: "Noida", slug: "noida", state: "Uttar Pradesh", stateCode: "UP" },
  { name: "Asansol", slug: "asansol", state: "West Bengal", stateCode: "WB" },
  { name: "Kolkata", slug: "kolkata", state: "West Bengal", stateCode: "WB", popular: true },
];

export const STATE_ORDER = [...new Set(BEVORY_CITIES.map(({ state }) => state))];
export const CITY_SLUGS = BEVORY_CITIES.map(({ slug }) => slug);
export const POPULAR_CITIES = BEVORY_CITIES.filter(({ popular }) => popular).map(({ name }) => name);
export const CITIES_BY_STATE = Object.fromEntries(
  STATE_ORDER.map((state) => [
    state,
    BEVORY_CITIES.filter((city) => city.state === state).map(({ name }) => name),
  ]),
) as Record<string, string[]>;

export const cityFromSlug = (slug: string) => BEVORY_CITIES.find((city) => city.slug === slug);
export const citySlugFromName = (name?: string | null) => BEVORY_CITIES.find((city) => (
  city.name.toLowerCase() === name?.toLowerCase()
))?.slug;
