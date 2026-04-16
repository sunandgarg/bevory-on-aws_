const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TABLES = [
  'products', 'categories', 'sub_categories', 'product_prices', 'product_types',
  'cities', 'states', 'countries', 'brand_spotlights', 'cocktails',
  'blog_posts', 'spiritz_magazine', 'cheers_guides', 'video_reviews',
  'video_creators', 'video_categories', 'help_support_items',
  'announcements', 'party_recommendations', 'preferred_brands',
  'product_reviews', 'app_settings',
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const { action, data } = await req.json();

    if (action === 'export') {
      const exportData: Record<string, any[]> = {};

      for (const table of TABLES) {
        let allRows: any[] = [];
        let from = 0;
        const batchSize = 1000;

        while (true) {
          const res = await fetch(
            `${SUPABASE_URL}/rest/v1/${table}?select=*&order=created_at.asc&offset=${from}&limit=${batchSize}`,
            {
              headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              },
            }
          );

          if (!res.ok) {
            console.error(`Failed to fetch ${table}: ${res.status}`);
            break;
          }

          const batch = await res.json();
          if (!Array.isArray(batch) || batch.length === 0) break;
          allRows = allRows.concat(batch);
          if (batch.length < batchSize) break;
          from += batchSize;
        }

        exportData[table] = allRows;
      }

      const summary: Record<string, number> = {};
      for (const [table, rows] of Object.entries(exportData)) {
        summary[table] = rows.length;
      }

      return new Response(
        JSON.stringify({
          success: true,
          exported_at: new Date().toISOString(),
          summary,
          data: exportData,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'import') {
      if (!data || typeof data !== 'object') {
        return new Response(
          JSON.stringify({ success: false, error: 'No data provided for import' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const results: Record<string, { inserted: number; errors: number }> = {};

      // Import in order to respect foreign key dependencies
      const importOrder = [
        'countries', 'states', 'cities', 'categories', 'sub_categories',
        'product_types', 'products', 'product_prices', 'brand_spotlights',
        'cocktails', 'blog_posts', 'spiritz_magazine', 'cheers_guides',
        'video_categories', 'video_creators', 'video_reviews',
        'help_support_items', 'announcements', 'party_recommendations',
        'preferred_brands', 'product_reviews', 'app_settings',
      ];

      for (const table of importOrder) {
        const rows = data[table];
        if (!Array.isArray(rows) || rows.length === 0) {
          results[table] = { inserted: 0, errors: 0 };
          continue;
        }

        let inserted = 0;
        let errors = 0;
        const batchSize = 100;

        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);

          const res = await fetch(
            `${SUPABASE_URL}/rest/v1/${table}`,
            {
              method: 'POST',
              headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates,return=minimal',
              },
              body: JSON.stringify(batch),
            }
          );

          if (res.ok) {
            inserted += batch.length;
          } else {
            const errText = await res.text();
            console.error(`Import error for ${table}: ${errText}`);
            errors += batch.length;
          }
        }

        results[table] = { inserted, errors };
      }

      return new Response(
        JSON.stringify({ success: true, imported_at: new Date().toISOString(), results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action. Use "export" or "import".' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Database operation error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
