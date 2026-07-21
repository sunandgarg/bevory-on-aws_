import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

export interface AdminAuthResult {
  userId: string;
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function requireAdmin(req: Request): Promise<AdminAuthResult> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new HttpError(401, "Authentication required");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    throw new HttpError(500, "Supabase credentials are not configured");
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const token = authHeader.slice("Bearer ".length);
  const { data: { user }, error: authError } = await adminClient.auth.getUser(token);

  if (authError || !user) {
    throw new HttpError(401, "Invalid authentication");
  }

  const { data: role, error: roleError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (roleError || !role) {
    throw new HttpError(403, "Admin access required");
  }

  return { userId: user.id };
}

export function errorResponse(error: unknown, corsHeaders: Record<string, string>): Response {
  const status = error instanceof HttpError ? error.status : 500;
  const message = error instanceof Error ? error.message : "Unknown error";
  if (status === 500) console.error(message);
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
