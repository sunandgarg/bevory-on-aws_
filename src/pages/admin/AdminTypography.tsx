import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const AdminTypography = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Typography System</h2>
        <p className="text-muted-foreground text-sm">
          Preview all heading and text styles used across the application
        </p>
      </div>

      {/* Font Families */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Font Families</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-secondary/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Headings — Playfair Display</p>
            <h2 className="text-2xl">The quick brown fox jumps over the lazy dog</h2>
          </div>
          <div className="p-4 bg-secondary/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Body — DM Sans</p>
            <p className="text-base">The quick brown fox jumps over the lazy dog</p>
          </div>
        </CardContent>
      </Card>

      {/* Headings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Headings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-mono">h1 — text-2xl md:text-3xl lg:text-4xl</span>
            <h1>Heading Level 1</h1>
          </div>
          <Separator />
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-mono">h2 — text-xl md:text-2xl</span>
            <h2>Heading Level 2</h2>
          </div>
          <Separator />
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-mono">h3 — text-lg md:text-xl</span>
            <h3>Heading Level 3</h3>
          </div>
          <Separator />
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-mono">h4 — DM Sans, font-semibold</span>
            <h4 className="text-base font-semibold">Heading Level 4</h4>
          </div>
        </CardContent>
      </Card>

      {/* Body Text */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Body Text</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-mono">text-base (16px) — Default body</span>
            <p className="text-base">
              Bevory is your ultimate guide to the world of beverages. Compare prices, explore brands, 
              plan parties, and make informed choices for every celebration.
            </p>
          </div>
          <Separator />
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-mono">text-sm (14px) — Secondary text</span>
            <p className="text-sm text-muted-foreground">
              Discover premium whisky, gin, rum, vodka, wine, and beer from around the world. 
              Our curated collection helps you find the perfect drink for any occasion.
            </p>
          </div>
          <Separator />
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-mono">text-xs (12px) — Captions, labels</span>
            <p className="text-xs text-muted-foreground">
              Prices may vary by location. Always drink responsibly. Must be 21+ to purchase alcohol.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Font Weights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Font Weights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-secondary/50 rounded-lg">
              <span className="text-xs text-muted-foreground font-mono">font-normal (400)</span>
              <p className="font-normal text-lg">Regular Text</p>
            </div>
            <div className="p-3 bg-secondary/50 rounded-lg">
              <span className="text-xs text-muted-foreground font-mono">font-medium (500)</span>
              <p className="font-medium text-lg">Medium Text</p>
            </div>
            <div className="p-3 bg-secondary/50 rounded-lg">
              <span className="text-xs text-muted-foreground font-mono">font-semibold (600)</span>
              <p className="font-semibold text-lg">Semibold Text</p>
            </div>
            <div className="p-3 bg-secondary/50 rounded-lg">
              <span className="text-xs text-muted-foreground font-mono">font-bold (700)</span>
              <p className="font-bold text-lg">Bold Text</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Text Colors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-3 bg-secondary/50 rounded-lg">
              <span className="text-xs text-muted-foreground font-mono">text-foreground</span>
              <p className="text-foreground font-medium">Primary Text</p>
            </div>
            <div className="p-3 bg-secondary/50 rounded-lg">
              <span className="text-xs text-muted-foreground font-mono">text-muted-foreground</span>
              <p className="text-muted-foreground font-medium">Muted Text</p>
            </div>
            <div className="p-3 bg-secondary/50 rounded-lg">
              <span className="text-xs text-muted-foreground font-mono">text-accent</span>
              <p className="text-accent font-medium">Accent Text</p>
            </div>
            <div className="p-3 bg-secondary/50 rounded-lg">
              <span className="text-xs text-muted-foreground font-mono">text-destructive</span>
              <p className="text-destructive font-medium">Error Text</p>
            </div>
            <div className="p-3 bg-secondary/50 rounded-lg">
              <span className="text-xs text-muted-foreground font-mono">text-gradient-gold</span>
              <p className="text-gradient-gold font-medium">Gold Gradient</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Usage Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 border rounded-lg space-y-2">
            <span className="text-xs text-muted-foreground font-mono">Page Header</span>
            <h1>Explore Categories</h1>
            <p className="text-muted-foreground">
              Browse our curated collection of premium spirits and beverages
            </p>
          </div>
          
          <div className="p-4 border rounded-lg space-y-2">
            <span className="text-xs text-muted-foreground font-mono">Section Header</span>
            <div className="flex items-center justify-between">
              <h2 className="text-xl">Trending Products</h2>
              <span className="text-sm text-accent">View all</span>
            </div>
          </div>
          
          <div className="p-4 border rounded-lg space-y-2">
            <span className="text-xs text-muted-foreground font-mono">Card Title</span>
            <h3 className="text-lg">Johnnie Walker Blue Label</h3>
            <p className="text-sm text-muted-foreground">Premium blended Scotch whisky</p>
            <p className="text-xs text-muted-foreground">750ml • 40% ABV</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTypography;