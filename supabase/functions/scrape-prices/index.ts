const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LIVCHEERS_BASE = 'https://www.livcheers.com';

// Map our city names to livcheers city slugs
const CITY_SLUG_MAP: Record<string, string> = {
  'Bangalore': 'bangalore',
  'Bhopal': 'bhopal',
  'Gurgaon': 'gurgaon',
  'Hyderabad': 'hyderabad',
  'Indore': 'indore',
  'Jaipur': 'jaipur',
  'Kolkata': 'kolkata',
  'Lucknow': 'lucknow',
  'Mumbai': 'mumbai',
  'Mysore': 'mysore',
  'Nagpur': 'nagpur',
  'New Delhi': 'delhi',
  'Noida': 'noida',
  'Panaji': 'goa',
  'Pune': 'pune',
};

// Livcheers category slugs to scrape
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
  'champagne',
  'liqueurs', 'cream-liqueur',
  'ready-to-drink',
];

interface ScrapedProduct {
  name: string;
  volume: string;
  price: number;
  slug: string;
}

function parseProductsFromMarkdown(markdown: string): ScrapedProduct[] {
  const products: ScrapedProduct[] = [];

  // Pattern: product cards show as image links with name, volume, price
  // Example: [![King David](img)\\\nKing David\\\n**King David** \\\n750ML\\\nOverall Rating: 4.6\\\n₹600\\\nBlended Scotch
  // Also extract from links: /liquor/product-slug

  // Strategy: Find all ₹ prices with context
  const lines = markdown.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Look for price patterns ₹X,XXX or ₹XXX
    const priceMatch = line.match(/₹([\d,]+)/);
    if (!priceMatch) continue;

    const price = parseInt(priceMatch[1].replace(/,/g, ''));
    if (price < 50 || price > 500000) continue; // sanity check

    // Look backwards for product name and volume
    let name = '';
    let volume = '';
    let slug = '';

    for (let j = Math.max(0, i - 15); j < i; j++) {
      const prevLine = lines[j].trim();

      // Extract slug from liquor URL
      const slugMatch = prevLine.match(/\/liquor\/([\w-]+)/);
      if (slugMatch) slug = slugMatch[1];

      // Extract bold name: **Product Name**
      const boldMatch = prevLine.match(/\*\*([^*]+)\*\*/);
      if (boldMatch && !name) name = boldMatch[1].trim();

      // Extract volume: 750ML, 700ML, 180ML, 1L, etc.
      const volMatch = prevLine.match(/(\d+\s*ML|\d+\s*L\b)/i);
      if (volMatch) volume = volMatch[1].trim().toUpperCase();
    }

    if (name && price > 0) {
      products.push({ name, volume, price, slug });
    }
  }

  // Deduplicate by slug
  const seen = new Set<string>();
  return products.filter(p => {
    const key = p.slug || `${p.name}-${p.volume}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeForMatch(str: string): string {
  return str.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/ml$/, '')
    .replace(/\d+$/, '');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { city_name, city_id, category_slug, dry_run } = await req.json();

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const livcheersCitySlug = CITY_SLUG_MAP[city_name];
    if (!livcheersCitySlug) {
      return new Response(
        JSON.stringify({ success: false, error: `City "${city_name}" not available on source. Available: ${Object.keys(CITY_SLUG_MAP).join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine which categories to scrape
    const categoriesToScrape = category_slug ? [category_slug] : LIVCHEERS_CATEGORIES;

    const allScraped: ScrapedProduct[] = [];
    const errors: string[] = [];

    for (const catSlug of categoriesToScrape) {
      const url = `${LIVCHEERS_BASE}/${livcheersCitySlug}/category/${catSlug}`;
      console.log(`Scraping: ${url}`);

      try {
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url,
            formats: ['markdown'],
            onlyMainContent: true,
            waitFor: 3000,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          errors.push(`${catSlug}: ${data.error || response.status}`);
          continue;
        }

        const markdown = data.data?.markdown || data.markdown || '';
        const products = parseProductsFromMarkdown(markdown);
        console.log(`${catSlug}: found ${products.length} products`);
        allScraped.push(...products);
      } catch (err) {
        errors.push(`${catSlug}: ${err instanceof Error ? err.message : 'unknown error'}`);
      }

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 500));
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

    // Build index for matching: slug -> product
    const slugIndex = new Map<string, { id: string; name: string; slug: string }>();
    const nameIndex = new Map<string, { id: string; name: string; slug: string }>();

    for (const p of ourProducts) {
      if (p.slug) slugIndex.set(p.slug.toLowerCase(), p);
      nameIndex.set(normalizeForMatch(p.name), p);
    }

    // Match scraped products to our products
    const matched: { product_id: string; price: number; product_name: string; scraped_name: string }[] = [];
    const unmatched: string[] = [];

    for (const sp of allScraped) {
      // Try exact slug match first
      let match = sp.slug ? slugIndex.get(sp.slug.toLowerCase()) : null;

      // Try normalized name match
      if (!match) {
        match = nameIndex.get(normalizeForMatch(sp.name));
      }

      // Try partial slug match (our slug might have volume suffix)
      if (!match && sp.slug) {
        for (const [key, val] of slugIndex) {
          if (key.startsWith(sp.slug.toLowerCase()) || sp.slug.toLowerCase().startsWith(key)) {
            match = val;
            break;
          }
        }
      }

      if (match) {
        matched.push({
          product_id: match.id,
          price: sp.price,
          product_name: match.name,
          scraped_name: sp.name,
        });
      } else {
        unmatched.push(`${sp.name} (${sp.volume}) - ₹${sp.price}`);
      }
    }

    if (dry_run) {
      return new Response(
        JSON.stringify({
          success: true,
          dry_run: true,
          city: city_name,
          total_scraped: allScraped.length,
          matched: matched.length,
          unmatched_count: unmatched.length,
          matched_products: matched.slice(0, 20),
          unmatched_products: unmatched.slice(0, 20),
          errors,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upsert prices into product_prices
    let upserted = 0;
    let upsertErrors = 0;

    // Batch upsert in chunks of 50
    const batchSize = 50;
    for (let i = 0; i < matched.length; i += batchSize) {
      const batch = matched.slice(i, i + batchSize);
      const rows = batch.map(m => ({
        product_id: m.product_id,
        city_id: city_id,
        price: m.price,
        volume: '750ml',
        in_stock: true,
      }));

      // Check existing prices first
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
            // Update existing
            const res = await fetch(
              `${SUPABASE_URL}/rest/v1/product_prices?id=eq.${existingId}`,
              {
                method: 'PATCH',
                headers: {
                  'apikey': SUPABASE_SERVICE_ROLE_KEY,
                  'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=minimal',
                },
                body: JSON.stringify({ price: row.price, in_stock: true, updated_at: new Date().toISOString() }),
              }
            );
            if (res.ok) upserted++;
            else upsertErrors++;
          } else {
            // Insert new
            const res = await fetch(
              `${SUPABASE_URL}/rest/v1/product_prices`,
              {
                method: 'POST',
                headers: {
                  'apikey': SUPABASE_SERVICE_ROLE_KEY,
                  'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=minimal',
                },
                body: JSON.stringify(row),
              }
            );
            if (res.ok) upserted++;
            else upsertErrors++;
          }
        } catch {
          upsertErrors++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        city: city_name,
        total_scraped: allScraped.length,
        matched: matched.length,
        upserted,
        upsert_errors: upsertErrors,
        unmatched_count: unmatched.length,
        unmatched_sample: unmatched.slice(0, 10),
        errors,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Scrape error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
