const SITE_ORIGIN = "https://bevory.in";
const seoRoutesCache = new Map();

const isDocumentRequest = (request) =>
  request.method === "GET" && (request.headers.get("accept") || "").includes("text/html");

const cityNames = new Map([
  ["agra", "Agra"], ["asansol", "Asansol"], ["bangalore", "Bangalore"],
  ["bhopal", "Bhopal"], ["delhi", "Delhi"], ["faridabad", "Faridabad"],
  ["ghaziabad", "Ghaziabad"], ["goa", "Goa"], ["gurgaon", "Gurgaon"],
  ["gwalior", "Gwalior"], ["hubli-dharwad", "Hubli Dharwad"],
  ["hyderabad", "Hyderabad"], ["indore", "Indore"], ["jabalpur", "Jabalpur"],
  ["jaipur", "Jaipur"], ["jodhpur", "Jodhpur"], ["kanpur", "Kanpur"],
  ["kolkata", "Kolkata"], ["kota", "Kota"], ["lucknow", "Lucknow"],
  ["mangalore", "Mangalore"], ["mumbai", "Mumbai"], ["mysore", "Mysore"],
  ["nagpur", "Nagpur"], ["nashik", "Nashik"], ["noida", "Noida"],
  ["pune", "Pune"], ["thane", "Thane"], ["udaipur", "Udaipur"],
  ["warangal", "Warangal"],
]);

const stateDefaultCities = new Map([
  ["haryana", "gurgaon"],
  ["karnataka", "bangalore"],
  ["madhya-pradesh", "indore"],
  ["maharashtra", "mumbai"],
  ["rajasthan", "jaipur"],
  ["telangana", "hyderabad"],
  ["uttar-pradesh", "lucknow"],
  ["west-bengal", "kolkata"],
  ["india", "gurgaon"],
]);

const staticSeo = {
  "/categories": ["Drink Categories & Prices | Bevory", "Browse spirits, wine, beer and ready-to-drink categories with local price guides."],
  "/brands": ["Beverage Brands & Products | Bevory", "Explore beverage brands, product ranges and locally available bottle prices on Bevory."],
  "/guide": ["Bevory Guide | Drinks, Prices & Serving Advice", "Read practical beverage guides, tasting notes and responsible serving advice from Bevory."],
  "/cocktails": ["Cocktail Recipes & Drink Ideas | Bevory", "Discover cocktail recipes, ingredients and serving ideas for your next gathering."],
  "/party-planner": ["Drinks Party Planner | Bevory", "Estimate drinks and compare locally priced products for your guest count and budget."],
  "/help": ["Help & Support | Bevory", "Get help using Bevory's local beverage price guide and planning tools."],
  "/contact": ["Contact Bevory", "Contact the Bevory team about product information, corrections or support."],
  "/privacy-policy": ["Privacy Policy | Bevory", "Read how Bevory handles personal data and privacy."],
  "/terms": ["Terms of Use | Bevory", "Read the terms that apply when using Bevory."],
  "/disclaimer": ["Information Disclaimer | Bevory", "Read important information about Bevory price guides and beverage content."],
};

const privatePrefixes = [
  "/admin", "/auth", "/favorites", "/locations", "/notifications", "/profile",
  "/recent", "/search", "/settings",
];

const humanize = (value) => value
  .split("-")
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(" ");

const shortTitle = (value) => value.length <= 60 ? value : `${value.slice(0, 57).trim()}...`;
const shortDescription = (value) => value.length <= 160 ? value : `${value.slice(0, 157).trim()}...`;

const escapeHtml = (value) => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

const seoBucketForPath = (pathname) => {
  const parts = pathname.split("/").filter(Boolean);
  const citySlug = parts[0];
  if (!cityNames.has(citySlug)) return "content";
  if (parts[1] === "product" && parts[2]) {
    const initial = parts[2].charAt(0).toLowerCase();
    return `${citySlug}-product-${/[a-z0-9]/.test(initial) ? initial : "other"}`;
  }
  return `${citySlug}-pages`;
};

const loadSeoRoutes = async (env, pathname) => {
  const bucket = seoBucketForPath(pathname);
  if (seoRoutesCache.has(bucket)) return seoRoutesCache.get(bucket);
  try {
    const response = await env.ASSETS.fetch(new Request(`${SITE_ORIGIN}/seo-routes/${bucket}.json`));
    const routes = response.ok ? await response.json() : {};
    seoRoutesCache.set(bucket, routes);
    return routes;
  } catch {
    return {};
  }
};

const routeSeo = (pathname, seoRoutes = {}) => {
  const cleanPath = pathname !== "/" ? pathname.replace(/\/$/, "") : "/";
  const parts = cleanPath.split("/").filter(Boolean).map((part) => {
    try {
      return decodeURIComponent(part);
    } catch {
      return part;
    }
  });
  const seo = {
    title: "Bevory | Compare Local Beverage Prices",
    description: "Compare local beverage prices, bottle sizes and brands with Bevory's city-aware price guide.",
    heading: "Compare local beverage prices with Bevory",
    canonicalPath: cleanPath,
    robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    breadcrumbs: [{ name: "Home", path: "/" }],
  };

  const generated = seoRoutes[cleanPath];
  if (generated) {
    return {
      ...seo,
      ...generated,
      canonicalPath: cleanPath,
      robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      breadcrumbs: Array.isArray(generated.breadcrumbs) ? generated.breadcrumbs : seo.breadcrumbs,
    };
  }

  if (privatePrefixes.some((prefix) => cleanPath === prefix || cleanPath.startsWith(`${prefix}/`))) {
    return { ...seo, robots: "noindex, follow, max-image-preview:large" };
  }

  if (cleanPath === "/") return seo;

  if (staticSeo[cleanPath]) {
    const [title, description] = staticSeo[cleanPath];
    return {
      ...seo,
      title,
      description,
      heading: title.replace(/ \| Bevory$/, ""),
      breadcrumbs: [...seo.breadcrumbs, { name: humanize(parts[0]), path: cleanPath }],
    };
  }

  return { ...seo, robots: "noindex, follow, max-image-preview:large" };
};

const routeSchema = (seo) => {
  const canonical = `${SITE_ORIGIN}${seo.canonicalPath}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${canonical}#webpage`,
        name: seo.title,
        description: seo.description,
        url: canonical,
        isPartOf: { "@id": `${SITE_ORIGIN}/#website` },
        inLanguage: "en-IN",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: seo.breadcrumbs.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: `${SITE_ORIGIN}${item.path}`,
        })),
      },
      ...(seo.structuredData ? [seo.structuredData] : []),
    ],
  };
};

const seoShell = (seo) => {
  const body = Array.isArray(seo.body) && seo.body.length ? seo.body : [seo.description];
  const image = seo.image
    ? `<img src="${escapeHtml(seo.image)}" alt="${escapeHtml(seo.heading)}" width="720" height="720" style="display:block;width:min(100%,360px);height:auto;object-fit:contain;margin:20px 0" />`
    : "";
  return `
  <main aria-label="Bevory page summary" style="max-width:760px;margin:0 auto;padding:24px;font-family:system-ui,sans-serif;line-height:1.55">
    <h1>${escapeHtml(seo.heading)}</h1>
    ${image}
    ${body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("\n    ")}
    <nav aria-label="Explore Bevory">
      <a href="/categories">Categories</a> | <a href="/brands">Brands</a> | <a href="/guide">Guide</a> | <a href="/party-planner">Party planner</a>
    </nav>
  </main>`;
};

const legacyRedirectPath = (pathname) => {
  const cleanPath = pathname !== "/" ? pathname.replace(/\/$/, "") : "/";
  const parts = cleanPath.split("/").filter(Boolean);

  if (cleanPath === "/") return "/gurgaon";

  if (parts.length === 1 && stateDefaultCities.has(parts[0])) {
    return `/${stateDefaultCities.get(parts[0])}`;
  }

  let stateSlug;
  let productSlug;
  if (parts[0] === "bevory" && parts.length === 5) {
    [, stateSlug, , , productSlug] = parts;
  } else if (parts.length === 4 && !["category", "product"].includes(parts[1])) {
    [stateSlug, , , productSlug] = parts;
  }
  if (!stateSlug || !productSlug) return null;

  const preferredCity = stateDefaultCities.get(stateSlug)
    || (cityNames.has(stateSlug) ? stateSlug : null);
  return preferredCity ? `/${preferredCity}/product/${productSlug}` : null;
};

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

const rewriteDocument = (response, url, routeData) => {
  const seo = { ...routeData };
  seo.title = shortTitle(seo.title);
  seo.description = shortDescription(seo.description);
  const canonical = `${SITE_ORIGIN}${seo.canonicalPath}`;
  const shareImage = seo.image || `${SITE_ORIGIN}/og-image.png`;
  const schema = JSON.stringify(routeSchema(seo)).replace(/</g, "\\u003c");
  const headers = new Headers(response.headers);
  headers.delete("etag");
  headers.set("cache-control", "public, max-age=0, must-revalidate");

  const htmlResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });

  return new HTMLRewriter()
    .on("title", { element: (element) => element.setInnerContent(seo.title) })
    .on('meta[name="description"]', { element: (element) => element.setAttribute("content", seo.description) })
    .on('meta[property="og:title"]', { element: (element) => element.setAttribute("content", seo.title) })
    .on('meta[property="og:description"]', { element: (element) => element.setAttribute("content", seo.description) })
    .on('meta[property="og:url"]', { element: (element) => element.setAttribute("content", canonical) })
    .on('meta[property="og:image"]', { element: (element) => element.setAttribute("content", shareImage) })
    .on('meta[name="twitter:title"]', { element: (element) => element.setAttribute("content", seo.title) })
    .on('meta[name="twitter:description"]', { element: (element) => element.setAttribute("content", seo.description) })
    .on('meta[name="twitter:image"]', { element: (element) => element.setAttribute("content", shareImage) })
    .on('meta[name="robots"]', { element: (element) => element.setAttribute("content", seo.robots) })
    .on('link[rel="canonical"]', { element: (element) => element.setAttribute("href", canonical) })
    .on("head", {
      element: (element) => element.append(
        `<script id="bevory-route-schema" type="application/ld+json">${schema}</script>`,
        { html: true },
      ),
    })
    .on("#root", { element: (element) => element.setInnerContent(seoShell(seo), { html: true }) })
    .transform(htmlResponse);
};

export async function onRequest({ request, env }) {
  const url = new URL(request.url);

  if (url.hostname === "www.bevory.in") {
    url.hostname = "bevory.in";
    return Response.redirect(url.toString(), 308);
  }

  if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
    return proxyApiRequest(request, env);
  }

  if (isDocumentRequest(request)) {
    const redirectPath = legacyRedirectPath(url.pathname);
    if (redirectPath && redirectPath !== url.pathname) {
      url.pathname = redirectPath;
      return Response.redirect(url.toString(), 308);
    }
  }

  const seoRoutes = isDocumentRequest(request) ? await loadSeoRoutes(env, url.pathname) : {};

  let response = await env.ASSETS.fetch(request);
  if (response.status === 404 && isDocumentRequest(request)) {
    const appShellUrl = new URL("/index.html", url);
    response = await env.ASSETS.fetch(new Request(appShellUrl, request));
  }

  if (!isDocumentRequest(request) || !response.ok) return response;
  return rewriteDocument(response, url, routeSeo(url.pathname, seoRoutes));
}
