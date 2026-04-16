import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BrandSpotlight {
  id: string;
  brand_name: string;
  slug: string | null;
  description: string | null;
  logo_emoji: string | null;
  logo_url: string | null;
  country: string | null;
}

interface ProductBrandSpotlightProps {
  brandName: string;
}

const ProductBrandSpotlight = ({ brandName }: ProductBrandSpotlightProps) => {
  const [brand, setBrand] = useState<BrandSpotlight | null>(null);

  useEffect(() => {
    const fetchBrand = async () => {
      const { data } = await supabase
        .from("brand_spotlights")
        .select("*")
        .ilike("brand_name", brandName)
        .eq("is_active", true)
        .maybeSingle();

      if (data) setBrand(data);
    };
    if (brandName) fetchBrand();
  }, [brandName]);

  if (!brand) return null;

  return (
    <div>
      <h3 className="font-semibold mb-3">Brand Spotlight</h3>
      <Link to={`/brand/${brand.slug || brand.id}`}>
        <div className="p-4 rounded-xl bg-card border border-border hover:border-accent/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
              {brand.logo_url ? (
                <img src={brand.logo_url} alt={brand.brand_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">{brand.logo_emoji || "🏷️"}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{brand.brand_name}</p>
              {brand.country && (
                <p className="text-sm text-muted-foreground">{brand.country}</p>
              )}
              {brand.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {brand.description}
                </p>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductBrandSpotlight;
