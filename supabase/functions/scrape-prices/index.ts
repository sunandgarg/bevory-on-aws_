import { errorResponse, requireAdmin } from "../_shared/requireAdmin.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LIVCHEERS_BASE = 'https://www.livcheers.com';

const CITY_SLUG_MAP: Record<string, string> = {
  'Bangalore': 'bangalore', 'Bhopal': 'bhopal', 'Gurgaon': 'gurgaon',
  'Hyderabad': 'hyderabad', 'Indore': 'indore', 'Jaipur': 'jaipur',
  'Kolkata': 'kolkata', 'Lucknow': 'lucknow', 'Mumbai': 'mumbai',
  'Mysore': 'mysore', 'Nagpur': 'nagpur', 'New Delhi': 'delhi',
  'Noida': 'noida', 'Panaji': 'goa', 'Pune': 'pune',
};

const LIVCHEERS_CATEGORIES = [
  'blended-scotch', 'single-malts', 'made-in-india-whisky', 'world-whisky',
  'indian-blended-whisky', 'bourbon', 'irish-whiskey', 'japanese-whisky',
  'indian-single-malt', 'rye-whiskey', 'tennessee-whiskey', 'canadian-whisky',
  'vodka', 'flavoured-vodka', 'premium-vodka',
  'rum', 'dark-rum', 'white-rum', 'spiced-rum', 'aged-rum', 'gold-rum',
  'gin', 'london-dry-gin', 'indian-craft-gin', 'contemporary-gin',
  'tequila', 'blanco-tequila', 'reposado-tequila', 'anejo-tequila',
  'brandy', 'cognac', 'indian-brandy',
  'beer', 'craft-beer', 'premium-beer', 'lager', 'ale', 'stout',
  'wine', 'red-wine', 'white-wine', 'rose-wine', 'sparkling-wine',
  'champagne', 'liqueurs', 'cream-liqueur', 'ready-to-drink',
];

interface ScrapedProduct {
  name: string;
  volume: string;
  price: number;
  slug: string;
}

function parseProductsFromHtml(html: string): ScrapedProduct[] {
  const products: ScrapedProduct[] = [];
  
  // Extract product data from HTML patterns
  const priceRegex = /₹([\d,]+)/g;
  const lines = html.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const priceMatch = line.match(/₹([\d,]+)/);
    if (!priceMatch) continue;
    
    const price = parseInt(priceMatch[1].replace(/,/g, ''));
    if (price < 50 || price > 500000) continue;
    
    let name = '';
    let volume = '';
    let slug = '';
    
    for (let j = Math.max(0, i - 15); j < i; j++) {
      const prevLine = lines[j].trim();
      const slugMatch = prevLine.match(/\/liquor\/([\w-]+)/);
      if (slugMatch) slug = slugMatch[1];
      const boldMatch = prevLine.match(/\*\*([^*]+)\*\*/);
      if (boldMatch && !name) name = boldMatch[1].trim();
      const volMatch = prevLine.match(/(\d+\s*ML|\d+\s*L\b)/i);
      if (volMatch) volume = volMatch[1].trim().toUpperCase();
    }
    
    if (name && price > 0) {
      products.push({ name, volume, price, slug });
    }
  }
  
  const seen = new Set<string>();
  return products.filter(p => {
    const key = p.slug || `${p.name}-${p.volume}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeForMatch(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/ml$/, '').replace(/\d+$/, '');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    await requireAdmin(req);
    const { city_name, city_id, category_slug, dry_run } = await req.json();

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const livcheersCitySlug = CITY_SLUG_MAP[city_name];
    if (!livcheersCitySlug) {
      return new Response(
        JSON.stringify({ success: false, error: `City "${city_name}" not available. Available: ${Object.keys(CITY_SLUG_MAP).join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const categoriesToScrape = category_slug ? [category_slug] : LIVCHEERS_CATEGORIES;
    const allScraped: ScrapedProduct[] = [];
    const errors: string[] = [];

    for (const catSlug of categoriesToScrape) {
      const url = `${LIVCHEERS_BASE}/${livcheersCitySlug}/category/${catSlug}`;
      console.log(`Scraping: ${url}`);

      try {
        // Use native fetch instead of Firecrawl
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; BevoryBot/1.0)',
            'Accept': 'text/html',
          },
        });

        if (!response.ok) {
          errors.push(`${catSlug}: HTTP ${response.status}`);
          continue;
        }

        const html = await response.text();
        const products = parseProductsFromHtml(html);
        console.log(`${catSlug}: found ${products.length} products`);
        allScraped.push(...products);
      } catch (err) {
        errors.push(`${catSlug}: ${err instanceof Error ? err.message : 'unknown error'}`);
      }

      await new Promise(r => setTimeout(r, 300));
    }

    if (allScraped.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No products scraped', details: errors }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch our products for matching
    const productsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=id,name,slug,volume&limit=5000`,
      { headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
    );
    const ourProducts = await productsRes.json();

    const slugIndex = new Map<string, { id: string; name: string; slug: string }>();
    const nameIndex = new Map<string, { id: string; name: string; slug: string }>();

    for (const p of ourProducts) {
      if (p.slug) slugIndex.set(p.slug.toLowerCase(), p);
      nameIndex.set(normalizeForMatch(p.name), p);
    }

    const matched: { product_id: string; price: number; product_name: string; scraped_name: string }[] = [];
    const unmatched: string[] = [];

    for (const sp of allScraped) {
      let match = sp.slug ? slugIndex.get(sp.slug.toLowerCase()) : null;
      if (!match) match = nameIndex.get(normalizeForMatch(sp.name));
      if (!match && sp.slug) {
        for (const [key, val] of slugIndex) {
          if (key.startsWith(sp.slug.toLowerCase()) || sp.slug.toLowerCase().startsWith(key)) {
            match = val;
            break;
          }
        }
      }

      if (match) {
        matched.push({ product_id: match.id, price: sp.price, product_name: match.name, scraped_name: sp.name });
      } else {
        unmatched.push(`${sp.name} (${sp.volume}) - ₹${sp.price}`);
      }
    }

    if (dry_run) {
      return new Response(
        JSON.stringify({
          success: true, dry_run: true, city: city_name,
          total_scraped: allScraped.length, matched: matched.length,
          unmatched_count: unmatched.length,
          matched_products: matched.slice(0, 20),
          unmatched_products: unmatched.slice(0, 20), errors,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let upserted = 0;
    let upsertErrors = 0;
    const batchSize = 50;

    for (let i = 0; i < matched.length; i += batchSize) {
      const batch = matched.slice(i, i + batchSize);
      const rows = batch.map(m => ({
        product_id: m.product_id, city_id, price: m.price, volume: '750ml', in_stock: true,
      }));

      const productIds = rows.map(r => r.product_id);
      const existingRes = await fetch(
        `${SUPABASE_URL}/rest/v1/product_prices?select=id,product_id&city_id=eq.${city_id}&product_id=in.(${productIds.join(',')})`,
        { headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
      );
      const existing = await existingRes.json();
      const existingMap = new Map<string, string>();
      if (Array.isArray(existing)) {
        for (const e of existing) existingMap.set(e.product_id, e.id);
      }

      for (const row of rows) {
        try {
          const existingId = existingMap.get(row.product_id);
          if (existingId) {
            const res = await fetch(
              `${SUPABASE_URL}/rest/v1/product_prices?id=eq.${existingId}`,
              {
                method: 'PATCH',
                headers: {
                  'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                  'Content-Type': 'application/json', 'Prefer': 'return=minimal',
                },
                body: JSON.stringify({ price: row.price, in_stock: true, updated_at: new Date().toISOString() }),
              }
            );
            if (res.ok) upserted++; else upsertErrors++;
          } else {
            const res = await fetch(
              `${SUPABASE_URL}/rest/v1/product_prices`,
              {
                method: 'POST',
                headers: {
                  'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                  'Content-Type': 'application/json', 'Prefer': 'return=minimal',
                },
                body: JSON.stringify(row),
              }
            );
            if (res.ok) upserted++; else upsertErrors++;
          }
        } catch { upsertErrors++; }
      }
    }

    return new Response(
      JSON.stringify({
        success: true, city: city_name, total_scraped: allScraped.length,
        matched: matched.length, upserted, upsert_errors: upsertErrors,
        unmatched_count: unmatched.length, unmatched_sample: unmatched.slice(0, 10), errors,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return errorResponse(error, corsHeaders);
  }
});
