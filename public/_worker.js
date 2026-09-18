const isDocumentRequest = (request) =>
  request.method === "GET" && (request.headers.get("accept") || "").includes("text/html");

const proxyApiRequest = async (request, env) => {
  if (!env.API_ORIGIN || !env.ORIGIN_VERIFY_SECRET) {
    return Response.json({ error: "API origin is not configured" }, { status: 503 });
  }

  const incomingUrl = new URL(request.url);
  const originUrl = new URL(env.API_ORIGIN);
  originUrl.pathname = incomingUrl.pathname;
  originUrl.search = incomingUrl.search;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.set("x-bevory-origin-verify", env.ORIGIN_VERIFY_SECRET);
  headers.set("x-forwarded-host", incomingUrl.host);
  headers.set("x-forwarded-proto", "https");

  const init = {
    method: request.method,
    headers,
    redirect: "manual",
  };
  if (request.method !== "GET" && request.method !== "HEAD") init.body = request.body;

  return fetch(originUrl.toString(), init);
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.hostname === "www.bevory.in") {
      url.hostname = "bevory.in";
      return Response.redirect(url.toString(), 308);
    }

    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      return proxyApiRequest(request, env);
    }

    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404 || !isDocumentRequest(request)) return assetResponse;

    const appShellUrl = new URL("/index.html", url);
    return env.ASSETS.fetch(new Request(appShellUrl, request));
  },
};
