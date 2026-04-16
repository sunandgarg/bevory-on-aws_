const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, provider, context } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine which provider/key to use
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Fetch AI settings from app_settings
    const settingsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/app_settings?key=eq.ai_recommendation_settings&select=value`,
      { headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
    );
    const settingsData = await settingsRes.json();
    const aiSettings = settingsData?.[0]?.value || {};

    // Priority: request provider > settings default > lovable
    const selectedProvider = provider || aiSettings.default_provider || 'lovable';

    let apiKey: string | undefined;
    let apiUrl: string;
    let model: string;
    let requestBody: any;

    const systemPrompt = `You are Bevory AI, an expert beverage recommendation assistant. You help users discover drinks, cocktails, and pairings. Be concise and helpful. ${context ? `Context: ${context}` : ''}`;

    switch (selectedProvider) {
      case 'openai': {
        apiKey = aiSettings.openai_api_key || Deno.env.get('OPENAI_API_KEY');
        if (!apiKey) throw new Error('OpenAI API key not configured');
        apiUrl = 'https://api.openai.com/v1/chat/completions';
        model = aiSettings.openai_model || 'gpt-4o-mini';
        requestBody = {
          model,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
          max_tokens: 1000,
          temperature: 0.7,
        };
        break;
      }
      case 'claude': {
        apiKey = aiSettings.claude_api_key || Deno.env.get('ANTHROPIC_API_KEY');
        if (!apiKey) throw new Error('Claude API key not configured');
        apiUrl = 'https://api.anthropic.com/v1/messages';
        model = aiSettings.claude_model || 'claude-3-haiku-20240307';
        requestBody = {
          model,
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: 'user', content: prompt }],
        };
        break;
      }
      case 'perplexity': {
        apiKey = aiSettings.perplexity_api_key || Deno.env.get('PERPLEXITY_API_KEY');
        if (!apiKey) throw new Error('Perplexity API key not configured');
        apiUrl = 'https://api.perplexity.ai/chat/completions';
        model = aiSettings.perplexity_model || 'llama-3.1-sonar-small-128k-online';
        requestBody = {
          model,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
          max_tokens: 1000,
        };
        break;
      }
      case 'lovable':
      default: {
        apiKey = Deno.env.get('LOVABLE_API_KEY');
        if (!apiKey) throw new Error('LOVABLE_API_KEY not configured');
        apiUrl = 'https://ai.gateway.lovable.dev/v1/chat/completions';
        model = 'google/gemini-2.5-flash-lite';
        requestBody = {
          model,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
        };
        break;
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (selectedProvider === 'claude') {
      headers['x-api-key'] = apiKey!;
      headers['anthropic-version'] = '2023-06-01';
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limited. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Credits exhausted. Please add funds.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errText = await response.text();
      throw new Error(`AI API error [${response.status}]: ${errText}`);
    }

    const result = await response.json();

    let content: string;
    if (selectedProvider === 'claude') {
      content = result.content?.[0]?.text || '';
    } else {
      content = result.choices?.[0]?.message?.content || '';
    }

    return new Response(
      JSON.stringify({ success: true, content, provider: selectedProvider, model }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('AI recommendation error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
