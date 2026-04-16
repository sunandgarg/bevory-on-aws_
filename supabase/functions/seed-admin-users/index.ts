import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Validate using Authorization header with service role key
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (token !== serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admins = [
      { email: "sunandgarg@gmail.com", password: "Sunand@123" },
      { email: "Manavahlawat2@gmail.com", password: "Manav@123" },
    ];

    const results = [];

    for (const admin of admins) {
      // Check if user already exists by listing users
      const { data: existingUsers } = await adminClient.auth.admin.listUsers();
      const existing = existingUsers?.users?.find(
        (u) => u.email?.toLowerCase() === admin.email.toLowerCase()
      );

      let userId: string;

      if (existing) {
        userId = existing.id;
        results.push({ email: admin.email, status: "already_exists", user_id: userId });
      } else {
        const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
          email: admin.email,
          password: admin.password,
          email_confirm: true,
        });

        if (createError) {
          results.push({ email: admin.email, status: "error", error: createError.message });
          continue;
        }
        userId = userData.user.id;
        results.push({ email: admin.email, status: "created", user_id: userId });
      }

      // Ensure admin role exists
      const { error: roleError } = await adminClient
        .from("user_roles")
        .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

      if (roleError) {
        results.push({ email: admin.email, status: "role_error", error: roleError.message });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
