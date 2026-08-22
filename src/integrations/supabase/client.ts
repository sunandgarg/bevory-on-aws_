/**
 * Compatibility client for the migrated Node.js/Prisma/MySQL backend.
 *
 * Existing screens keep their original Supabase-style query chains so their
 * rendering and behavior stay unchanged while all requests now go to /api.
 */

export type User = {
  id: string;
  email: string | null;
  phone: string | null;
  user_metadata: Record<string, any>;
  created_at: string;
};

export type Session = {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  user: User;
};

type ApiError = { message: string };
type ApiResult<T = unknown> = { data: T | null; error: ApiError | null; count?: number | null };
type Filter = { column?: string; operator: string; value?: unknown; filters?: Filter[] };

const API_URL = import.meta.env.VITE_API_URL || "/api";
const SESSION_KEY = "bevory-session";
const listeners = new Set<(event: string, session: Session | null) => void>();

let currentSession: Session | null = null;
try {
  currentSession = JSON.parse(localStorage.getItem(SESSION_KEY) || "null") as Session | null;
} catch {
  localStorage.removeItem(SESSION_KEY);
}

const setSession = (session: Session | null, event: string) => {
  currentSession = session;
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
  listeners.forEach((listener) => listener(event, session));
};

const request = async <T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> => {
  try {
    const headers = new Headers(init.headers);
    if (!(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
    if (currentSession?.access_token) headers.set("Authorization", `Bearer ${currentSession.access_token}`);
    const response = await fetch(`${API_URL}${path}`, { ...init, headers });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = body?.error?.message || body?.error || `Request failed (${response.status})`;
      return { data: body?.data ?? null, error: { message }, count: body?.count ?? null };
    }
    return body as ApiResult<T>;
  } catch (error) {
    return { data: null, error: { message: error instanceof Error ? error.message : "Network request failed" } };
  }
};

class QueryBuilder implements PromiseLike<ApiResult<any>> {
  private operation: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private values: unknown;
  private filters: Filter[] = [];
  private orders: Array<{ column: string; ascending?: boolean }> = [];
  private limitValue?: number;
  private rangeValue?: [number, number];
  private selectValue = "*";
  private countValue?: "exact";
  private headValue = false;
  private onConflict?: string;
  private singleMode: "none" | "single" | "maybeSingle" = "none";

  constructor(private readonly table: string) {}

  select(columns = "*", options?: { count?: "exact"; head?: boolean }) {
    this.selectValue = columns;
    this.countValue = options?.count;
    this.headValue = options?.head ?? false;
    return this;
  }

  insert(values: unknown) { this.operation = "insert"; this.values = values; return this; }
  update(values: unknown) { this.operation = "update"; this.values = values; return this; }
  delete() { this.operation = "delete"; return this; }
  upsert(values: unknown, options?: { onConflict?: string; ignoreDuplicates?: boolean }) {
    this.operation = "upsert";
    this.values = values;
    this.onConflict = options?.onConflict;
    return this;
  }

  eq(column: string, value: unknown) { this.filters.push({ column, operator: "eq", value }); return this; }
  neq(column: string, value: unknown) { this.filters.push({ column, operator: "neq", value }); return this; }
  gt(column: string, value: unknown) { this.filters.push({ column, operator: "gt", value }); return this; }
  gte(column: string, value: unknown) { this.filters.push({ column, operator: "gte", value }); return this; }
  lt(column: string, value: unknown) { this.filters.push({ column, operator: "lt", value }); return this; }
  lte(column: string, value: unknown) { this.filters.push({ column, operator: "lte", value }); return this; }
  is(column: string, value: unknown) { this.filters.push({ column, operator: "is", value }); return this; }
  in(column: string, value: unknown[]) { this.filters.push({ column, operator: "in", value }); return this; }
  ilike(column: string, value: string) { this.filters.push({ column, operator: "ilike", value }); return this; }
  contains(column: string, value: unknown[]) { this.filters.push({ column, operator: "contains", value }); return this; }
  not(column: string, operator: string, value: unknown) {
    this.filters.push({ column, operator: operator === "is" ? "neq" : "neq", value });
    return this;
  }

  or(expression: string) {
    const filters = expression.split(",").map((part) => {
      const [column, operator, ...rest] = part.split(".");
      return { column, operator, value: rest.join(".") };
    });
    this.filters.push({ operator: "or", filters });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orders.push({ column, ascending: options?.ascending ?? true });
    return this;
  }

  limit(value: number) { this.limitValue = value; return this; }
  range(from: number, to: number) { this.rangeValue = [from, to]; return this; }
  single() { this.singleMode = "single"; return this.execute(); }
  maybeSingle() { this.singleMode = "maybeSingle"; return this.execute(); }

  private async execute(): Promise<ApiResult<any>> {
    const result = await request<any>("/query", {
      method: "POST",
      body: JSON.stringify({
        table: this.table,
        operation: this.operation,
        values: this.values,
        filters: this.filters,
        orders: this.orders,
        limit: this.limitValue,
        range: this.rangeValue,
        select: this.selectValue,
        count: this.countValue,
        head: this.headValue,
        onConflict: this.onConflict,
      }),
    });
    if (this.singleMode !== "none" && Array.isArray(result.data)) {
      if (result.data.length === 1) return { ...result, data: result.data[0] };
      if (result.data.length === 0 && this.singleMode === "maybeSingle") return { ...result, data: null };
      return { ...result, data: null, error: { message: "Expected a single row" } };
    }
    return result;
  }

  then<TResult1 = ApiResult<any>, TResult2 = never>(
    onfulfilled?: ((value: ApiResult<any>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

const auth = {
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    listeners.add(callback);
    return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } };
  },

  async getSession() {
    if (!currentSession) return { data: { session: null }, error: null };
    const result = await request<{ user: User }>("/auth/me");
    if (result.error || !result.data?.user) {
      setSession(null, "SIGNED_OUT");
      return { data: { session: null }, error: result.error };
    }
    currentSession = { ...currentSession, user: result.data.user };
    return { data: { session: currentSession }, error: null };
  },

  async getUser(token?: string) {
    const previous = currentSession;
    if (token && previous) currentSession = { ...previous, access_token: token };
    const result = await request<{ user: User }>("/auth/me");
    currentSession = previous;
    return result;
  },

  async signInWithPassword(input: { email: string; password: string }) {
    const result = await request<{ user: User; session: Session }>("/auth/signin", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (result.data?.session) setSession(result.data.session, "SIGNED_IN");
    return result;
  },

  async signUp(input: { email?: string; phone?: string; password?: string; options?: { data?: Record<string, unknown> } }) {
    const result = await request<{ user: User; session: Session | null }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ ...input, data: input.options?.data }),
    });
    if (result.data?.session) setSession(result.data.session, "SIGNED_IN");
    return result;
  },

  async signInWithOAuth() {
    return { data: null, error: { message: "Google sign-in requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." } };
  },

  async signInWithOtp() {
    return { data: null, error: { message: "Phone OTP requires Twilio credentials." } };
  },

  async verifyOtp() {
    return { data: null, error: { message: "Phone OTP requires Twilio credentials." } };
  },

  async signOut() {
    setSession(null, "SIGNED_OUT");
    return { error: null };
  },
};

const storage = {
  from(bucket: string) {
    return {
      async upload(path: string, file: File) {
        const body = new FormData();
        body.set("bucket", bucket);
        body.set("path", path);
        body.set("file", file);
        return request<{ id: string; path: string }>("/storage/upload", { method: "POST", body });
      },
      getPublicUrl(path: string) {
        const encoded = path.split("/").map(encodeURIComponent).join("/");
        return { data: { publicUrl: `${window.location.origin}/uploads/${encodeURIComponent(bucket)}/${encoded}` } };
      },
    };
  },
};

const functions = {
  async invoke(name: string, options?: { body?: unknown }) {
    const result = await request<any>(`/functions/${encodeURIComponent(name)}`, {
      method: "POST",
      body: JSON.stringify(options?.body ?? {}),
    });
    return result.error ? { data: result.data, error: result.error } : { data: result.data, error: null };
  },
};

export const supabase: any = {
  from: (table: string) => new QueryBuilder(table),
  auth,
  storage,
  functions,
};
