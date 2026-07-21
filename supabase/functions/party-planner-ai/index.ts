import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 5;
const requestBuckets = new Map<string, { count: number; resetAt: number }>();

function enforceRateLimit(req: Request) {
  const now = Date.now();
  const clientId = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const bucket = requestBuckets.get(clientId);
  if (!bucket || bucket.resetAt <= now) {
    requestBuckets.set(clientId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return;
  }
  if (bucket.count >= RATE_LIMIT) throw new Error("RATE_LIMITED");
  bucket.count += 1;
}

async function fetchFromSupabase(url: string, table: string, query: string, apiKey: string) {
  const response = await fetch(`${url}/rest/v1/${table}?${query}`, {
    headers: {
      "apikey": apiKey,
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${table}: ${response.statusText}`);
  }
  return response.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    enforceRateLimit(req);
    const { guests, budget, city, categories: selectedCategories } = await req.json();
    if (!Number.isInteger(guests) || guests < 1 || guests > 500) {
      return new Response(JSON.stringify({ error: "Guests must be an integer between 1 and 500" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof budget !== "number" || !Number.isFinite(budget) || budget < 100 || budget > 10_000_000) {
      return new Response(JSON.stringify({ error: "Budget must be between 100 and 10,000,000" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (city != null && (typeof city !== "string" || city.length > 100)) {
      return new Response(JSON.stringify({ error: "Invalid city" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (selectedCategories != null && (!Array.isArray(selectedCategories) || selectedCategories.length > 20 || selectedCategories.some((item) => typeof item !== "string" || item.length > 80))) {
      return new Response(JSON.stringify({ error: "Invalid categories" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    // Fetch categories
    const categories = await fetchFromSupabase(
      SUPABASE_URL,
      "categories",
      "select=id,name,emoji",
      SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch products with category info
    const products = await fetchFromSupabase(
      SUPABASE_URL,
      "products",
      "select=id,name,brand,abv,rating,image_emoji,category_id,categories(name)&limit=100",
      SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch product prices
    const pricesQuery = "select=product_id,price,city_id";
    const prices = await fetchFromSupabase(
      SUPABASE_URL,
      "product_prices",
      pricesQuery,
      SUPABASE_SERVICE_ROLE_KEY
    );

    // If city is provided, try to find city-specific prices
    let cityId: string | null = null;
    if (city) {
      const cities = await fetchFromSupabase(
        SUPABASE_URL,
        "cities",
        `select=id&name=ilike.${encodeURIComponent(city)}`,
        SUPABASE_SERVICE_ROLE_KEY
      );
      if (cities && cities.length > 0) {
        cityId = cities[0].id;
      }
    }

    // Build price map (prefer city-specific prices)
    const priceMap = new Map<string, number>();
    for (const p of prices || []) {
      if (cityId && p.city_id === cityId) {
        priceMap.set(p.product_id, p.price);
      } else if (!priceMap.has(p.product_id)) {
        priceMap.set(p.product_id, p.price);
      }
    }

    // Build product list for AI context
    const productList = (products || []).map((p: any) => {
      const price = priceMap.get(p.id);
      const categoryName = p.categories?.name || "Unknown";
      return `- ${p.brand} ${p.name} (${categoryName}): ₹${price || 'N/A'}, ABV: ${p.abv || 'N/A'}%, Rating: ${p.rating || 'N/A'}`;
    }).join('\n');

    // Build category list for the prompt - use selected categories if provided
    const categoryList = selectedCategories && selectedCategories.length > 0 
      ? selectedCategories.join(', ')
      : (categories || []).map((c: { name: string }) => c.name).join(', ');

    const systemPrompt = `You are BevOry's Party Planning AI assistant. You help users plan perfect drink selections for their parties based on:
- Number of guests
- Budget
- Available products in the database
- City-specific pricing

Rules:
1. Only recommend products from the provided list
2. Stay within the budget
3. Suggest a good variety across categories
4. Consider 2-3 drinks per person for a 3-hour party
5. Include mix of categories when budget allows
6. Always explain your reasoning briefly`;

    const userPrompt = `Plan a party for ${guests} guests with a budget of ₹${budget.toLocaleString()}${city ? ` in ${city}` : ''}.

Selected Categories: ${categoryList}

Available Products:
${productList}

Please provide:
1. Recommended products with quantities
2. Total estimated cost
3. Brief rationale for selections
4. Any tips for the party

Format your response as JSON with this structure:
{
  "recommendations": [
    {
      "category": "Category Name",
      "quantity": 2,
      "estimatedCost": 3000,
      "suggestions": ["Product 1", "Product 2"],
      "reasoning": "Why this selection"
    }
  ],
  "totalEstimatedCost": 15000,
  "partyTips": ["Tip 1", "Tip 2"],
  "budgetAnalysis": "Brief budget analysis"
}`;

    console.log("Calling AI gateway with", products?.length || 0, "products");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI service unavailable");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    // Try to parse JSON from the response
    let parsedResponse;
    try {
      // Find JSON in the response (it might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      parsedResponse = JSON.parse(jsonStr);
    } catch {
      // If JSON parsing fails, return the raw content
      parsedResponse = { raw_response: content };
    }

    return new Response(
      JSON.stringify(parsedResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Party planner error:", error);
    if (error instanceof Error && error.message === "RATE_LIMITED") {
      return new Response(JSON.stringify({ error: "Too many requests. Please wait a minute." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "An error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
