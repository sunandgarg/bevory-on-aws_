import { createSign } from "node:crypto";

type ServiceAccount = { client_email?: string; private_key?: string; token_uri?: string };
type ReportRow = { dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> };
type ReportResponse = { rows?: ReportRow[]; totals?: ReportRow[]; error?: { message?: string } };

const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");

export const gaConfigured = () => Boolean(process.env.GOOGLE_ANALYTICS_CREDENTIALS_JSON?.trim());

const serviceAccount = () => {
  const source = process.env.GOOGLE_ANALYTICS_CREDENTIALS_JSON?.trim();
  if (!source) throw new Error("GOOGLE_ANALYTICS_CREDENTIALS_JSON is not configured");
  let parsed: ServiceAccount;
  try {
    parsed = JSON.parse(source) as ServiceAccount;
  } catch {
    throw new Error("GOOGLE_ANALYTICS_CREDENTIALS_JSON is not valid JSON");
  }
  if (!parsed.client_email || !parsed.private_key) throw new Error("GA4 service account is missing client_email or private_key");
  return parsed as { client_email: string; private_key: string; token_uri?: string };
};

const getAccessToken = async () => {
  const account = serviceAccount();
  const now = Math.floor(Date.now() / 1000);
  const tokenUri = account.token_uri || "https://oauth2.googleapis.com/token";
  const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: tokenUri,
    iat: now,
    exp: now + 3600,
  })}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const assertion = `${unsigned}.${signer.sign(account.private_key, "base64url")}`;
  const response = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  const body = await response.json() as { access_token?: string; error_description?: string };
  if (!response.ok || !body.access_token) throw new Error(body.error_description || "Unable to authenticate with Google Analytics");
  return body.access_token;
};

const runReport = async (
  accessToken: string,
  propertyId: string,
  body: Record<string, unknown>,
) => {
  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runReport`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json() as ReportResponse;
  if (!response.ok) throw new Error(result.error?.message || `GA4 report failed (${response.status})`);
  return result;
};

const numberAt = (row: ReportRow | undefined, index: number) => Number(row?.metricValues?.[index]?.value || 0);

export const fetchGoogleAnalytics = async (propertyId: string, startDate: string, endDate: string) => {
  if (!/^\d+$/.test(propertyId)) throw new Error("A numeric GA4 property ID is required");
  const token = await getAccessToken();
  const dateRanges = [{ startDate, endDate }];
  const [daily, pages, sources] = await Promise.all([
    runReport(token, propertyId, {
      dateRanges,
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "screenPageViews" },
        { name: "totalUsers" },
        { name: "sessions" },
        { name: "bounceRate" },
        { name: "averageSessionDuration" },
      ],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    }),
    runReport(token, propertyId, {
      dateRanges,
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 10,
    }),
    runReport(token, propertyId, {
      dateRanges,
      dimensions: [{ name: "sessionSource" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10,
    }),
  ]);
  const total = daily.totals?.[0] || {
    metricValues: daily.rows?.reduce((values, row) => {
      row.metricValues?.forEach((metric, index) => {
        const previous = Number(values[index]?.value || 0);
        values[index] = { value: String(previous + Number(metric.value || 0)) };
      });
      return values;
    }, [] as Array<{ value?: string }>),
  };
  return {
    pageViews: numberAt(total, 0),
    uniqueVisitors: numberAt(total, 1),
    sessions: numberAt(total, 2),
    bounceRate: numberAt(total, 3),
    avgSessionDuration: numberAt(total, 4),
    dailyData: (daily.rows || []).map((row) => ({
      date: row.dimensionValues?.[0]?.value || "",
      pageViews: numberAt(row, 0),
      uniqueVisitors: numberAt(row, 1),
      sessions: numberAt(row, 2),
    })),
    topPages: (pages.rows || []).map((row) => ({
      page: row.dimensionValues?.[0]?.value || "(unknown)",
      views: numberAt(row, 0),
    })),
    trafficSources: (sources.rows || []).map((row) => ({
      source: row.dimensionValues?.[0]?.value || "(direct)",
      sessions: numberAt(row, 0),
    })),
  };
};
