const SITE_ORIGIN = "https://bevory.in";

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

const routeSeo = (pathname) => {
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

  if (parts.length === 1 && cityNames.has(parts[0])) {
    const city = cityNames.get(parts[0]);
    return {
      ...seo,
      title: `Alcohol Prices in ${city} | Bevory`,
      description: `Compare whisky, beer, wine, rum, gin and vodka prices available in ${city}.`,
      heading: `Alcohol prices in ${city}`,
      breadcrumbs: [...seo.breadcrumbs, { name: city, path: cleanPath }],
    };
  }

  if (parts[0] === "category" && parts[1]) {
    const category = humanize(parts[1]);
    const subcategory = parts[2] ? humanize(parts[2]) : null;
    const label = subcategory || category;
    return {
      ...seo,
      title: `${label} Prices & Products | Bevory`,
      description: `Compare ${label.toLowerCase()} products, bottle sizes and locally available prices on Bevory.`,
      heading: `${label} prices and products`,
      breadcrumbs: [
        ...seo.breadcrumbs,
        { name: category, path: `/category/${parts[1]}` },
        ...(subcategory ? [{ name: subcategory, path: cleanPath }] : []),
      ],
    };
  }

  if ((parts[0] === "product" || parts[0] === "brand" || parts[0] === "guide") && parts[1]) {
    const label = humanize(parts[1]);
    const section = parts[0] === "product" ? "Product" : parts[0] === "brand" ? "Brand" : "Guide";
    const sectionPath = section === "Product" ? "/categories" : section === "Brand" ? "/brands" : "/guide";
    return {
      ...seo,
      title: `${label} ${section === "Product" ? "Price" : section} | Bevory`,
      description: section === "Product"
        ? `See ${label} bottle sizes, local prices and product details on Bevory.`
        : `Explore ${label} ${section.toLowerCase()} information on Bevory.`,
      heading: label,
      breadcrumbs: [...seo.breadcrumbs, { name: section, path: sectionPath }, { name: label, path: cleanPath }],
    };
  }

  if ((parts[0] === "bevory" && parts.length === 5) || parts.length === 4) {
    const productSlug = parts.at(-1);
    const label = humanize(productSlug);
    return {
      ...seo,
      title: `${label} Price | Bevory`,
      description: `See ${label} bottle sizes, local prices and product details on Bevory.`,
      heading: label,
      canonicalPath: `/product/${productSlug}`,
      breadcrumbs: [...seo.breadcrumbs, { name: "Product", path: `/product/${productSlug}` }],
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
    ],
  };
};

const seoShell = (seo) => `
  <main aria-label="Bevory page summary" style="max-width:760px;margin:0 auto;padding:24px;font-family:system-ui,sans-serif;line-height:1.55">
    <h1>${escapeHtml(seo.heading)}</h1>
    <p>${escapeHtml(seo.description)}</p>
    <h2>How Bevory's local price guide works</h2>
    <p>Bevory organizes beverage products by brand, category, subcategory, bottle size and city so people can compare relevant listings without sorting through unavailable variants. A product or bottle size appears for a selected city only when a positive local price record is available and has passed the catalogue review rules. Prices are informational and may change at the retailer, so shoppers should confirm the current amount and legal availability locally. Bevory does not sell alcohol. The catalogue is designed for adults aged 25 or older and supports responsible, informed discovery through clear product relationships, useful guides and consistent canonical pages.</p>
    <nav aria-label="Explore Bevory">
      <a href="/categories">Categories</a> | <a href="/brands">Brands</a> | <a href="/guide">Guide</a> | <a href="/party-planner">Party planner</a>
    </nav>
  </main>`;

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

const rewriteDocument = (response, url) => {
  const seo = routeSeo(url.pathname);
  seo.title = shortTitle(seo.title);
  seo.description = shortDescription(seo.description);
  const canonical = `${SITE_ORIGIN}${seo.canonicalPath}`;
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
    .on('meta[name="twitter:title"]', { element: (element) => element.setAttribute("content", seo.title) })
    .on('meta[name="twitter:description"]', { element: (element) => element.setAttribute("content", seo.description) })
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

    let response = await env.ASSETS.fetch(request);
    if (response.status === 404 && isDocumentRequest(request)) {
      const appShellUrl = new URL("/index.html", url);
      response = await env.ASSETS.fetch(new Request(appShellUrl, request));
    }

    if (!isDocumentRequest(request) || !response.ok) return response;
    return rewriteDocument(response, url);
  },
};
