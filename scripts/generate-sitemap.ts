import "dotenv/config";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { PrismaClient, type Prisma } from "@prisma/client";
import { BEVORY_CITIES, CITY_SLUGS } from "../src/lib/locations.js";

type SitemapImage = { loc: string; title?: string };
type SitemapEntry = { path: string; lastmod?: string; images?: SitemapImage[] };
type DataRow = { table: string; id: string; data: Prisma.JsonObject };
type Breadcrumb = { name: string; path: string };
type SeoRoute = {
  title: string;
  description: string;
  heading: string;
  body: string[];
  image?: string;
  breadcrumbs: Breadcrumb[];
  structuredData?: Record<string, unknown>;
};

const origin = "https://bevory.in";
const prisma = new PrismaClient();
const tableNames = [
  "blog_posts",
  "brand_spotlights",
  "categories",
  "cities",
  "cocktails",
  "product_prices",
  "products",
  "sub_categories",
  "video_creators",
  "video_reviews",
] as const;

const jsonObject = (value: Prisma.JsonValue): Prisma.JsonObject =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Prisma.JsonObject : {};

const xmlEscape = (value: string) => value
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&apos;");

const validImageUrl = (value: unknown): string | null => {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value, origin);
    return ["https:", "http:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
};

const latestTimestamp = (...values: unknown[]) => {
  const dates = values
    .flat()
    .map((value) => new Date(String(value ?? "")))
    .filter((date) => !Number.isNaN(date.getTime()));
  return dates.length
    ? new Date(Math.max(...dates.map((date) => date.getTime()))).toISOString()
    : undefined;
};

const plainText = (value: unknown) => String(value ?? "")
  .replace(/<[^>]*>/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const shortText = (value: unknown, max = 155) => {
  const text = plainText(value);
  return text.length <= max ? text : `${text.slice(0, max - 3).trim()}...`;
};

const volumeSlug = (row: DataRow) => String(
  row.data.volume || `${row.data.volume_ml || ""}ml`,
).toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9.-]/g, "-");

const seoBucketForPath = (path: string) => {
  const parts = path.split("/").filter(Boolean);
  const citySlug = parts[0];
  if (!CITY_SLUGS.includes(citySlug)) return "content";
  if (parts[1] === "product" && parts[2]) {
    const initial = parts[2].charAt(0).toLowerCase();
    return `${citySlug}-product-${/[a-z0-9]/.test(initial) ? initial : "other"}`;
  }
  return `${citySlug}-pages`;
};

const groupBy = (rows: DataRow[], key: (row: DataRow) => string) => {
  const grouped = new Map<string, DataRow[]>();
  for (const row of rows) {
    const value = key(row);
    if (!value) continue;
    const group = grouped.get(value) ?? [];
    group.push(row);
    grouped.set(value, group);
  }
  return grouped;
};

const loadRows = async (): Promise<DataRow[]> => {
  try {
    const records = await prisma.contentRecord.findMany({
      where: { tableName: { in: [...tableNames] } },
    });
    return records.map((record) => ({
      table: record.tableName,
      id: record.recordId,
      data: jsonObject(record.data),
    }));
  } catch (error) {
    const apiUrl = process.env.SITEMAP_API_URL || `${origin}/api/query`;
    console.warn(
      `Database unavailable; generating from ${apiUrl} `
      + `(${error instanceof Error ? error.message.split("\n")[0] : "connection failed"})`,
    );
    const tables = await Promise.all(tableNames.map(async (table) => {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ table, operation: "select" }),
      });
      if (!response.ok) throw new Error(`Failed to fetch ${table}: HTTP ${response.status}`);
      const body = await response.json() as { data?: Array<Record<string, unknown>> };
      if (!Array.isArray(body.data)) throw new Error(`Invalid ${table} response`);
      return body.data.map((data) => ({
        table,
        id: String(data.id ?? ""),
        data: data as Prisma.JsonObject,
      }));
    }));
    return tables.flat();
  }
};

const staticRoutes: Array<SitemapEntry & { seo: SeoRoute }> = [
  ["/categories", "Drink Categories & Prices | Bevory", "Browse spirits, wine, beer and ready-to-drink categories with local prices.", "Drink categories"],
  ["/brands", "Beverage Brands & Products | Bevory", "Explore beverage brands, products and locally available bottle prices.", "Beverage brands"],
  ["/guide", "Bevory Guide | Drinks & Serving Advice", "Read practical beverage guides, tasting notes and responsible serving advice.", "Bevory Guide"],
  ["/cocktails", "Cocktail Recipes & Drink Ideas | Bevory", "Discover cocktail recipes, ingredients and serving ideas.", "Cocktail recipes"],
  ["/party-planner", "Drinks Party Planner | Bevory", "Estimate drinks and compare locally priced products for a guest count and budget.", "Drinks party planner"],
  ["/masterclass", "Beverage Masterclasses | Bevory", "Watch beverage reviews, explainers and creator masterclasses.", "Beverage masterclasses"],
  ["/help", "Help & Support | Bevory", "Get help using Bevory's local beverage price guide and planning tools.", "Help and support"],
  ["/contact", "Contact Bevory", "Contact Bevory about product information, corrections or support.", "Contact Bevory"],
  ["/privacy-policy", "Privacy Policy | Bevory", "Read how Bevory handles personal data and privacy.", "Privacy policy"],
  ["/terms", "Terms of Use | Bevory", "Read the terms that apply when using Bevory.", "Terms of use"],
  ["/disclaimer", "Information Disclaimer | Bevory", "Read important information about Bevory price guides and beverage content.", "Information disclaimer"],
].map(([path, title, description, heading]) => ({
  path,
  seo: {
    title,
    description,
    heading,
    body: [description],
    breadcrumbs: path === "/" ? [] : [{ name: "Home", path: "/" }, { name: heading, path }],
  },
}));

try {
  const rows = await loadRows();
  const byTable = (table: string) => rows.filter((row) => row.table === table);
  const prices = byTable("product_prices").filter((row) => (
    row.data.price_available !== false
    && row.data.requires_review !== true
    && Number(row.data.price) > 0
  ));
  const products = byTable("products").filter((row) => row.data.is_active !== false && row.data.slug);
  const categories = byTable("categories").filter((row) => row.data.is_active !== false && row.data.slug);
  const subcategories = byTable("sub_categories").filter((row) => row.data.is_active !== false && row.data.slug);
  const brands = byTable("brand_spotlights").filter((row) => row.data.is_active !== false && row.data.slug);
  const productById = new Map(products.map((row) => [row.id, row]));
  const categoryById = new Map(categories.map((row) => [row.id, row]));
  const subcategoryById = new Map(subcategories.map((row) => [row.id, row]));
  const brandById = new Map(brands.map((row) => [row.id, row]));
  const pricesByCity = groupBy(prices, (row) => String(row.data.city_id ?? ""));
  const pricesByCityProduct = groupBy(
    prices.filter((row) => productById.has(String(row.data.product_id ?? ""))),
    (row) => `${row.data.city_id}|${row.data.product_id}`,
  );
  const cities = byTable("cities").flatMap((row) => {
    const city = BEVORY_CITIES.find((candidate) => (
      candidate.name.toLowerCase() === String(row.data.name ?? "").toLowerCase()
    ));
    return city && pricesByCity.has(row.id) ? [{ row, city }] : [];
  });
  const cityById = new Map(cities.map((item) => [item.row.id, item]));
  const entries: SitemapEntry[] = staticRoutes.map(({ seo: _seo, ...entry }) => entry);
  const seoRoutes: Record<string, SeoRoute> = Object.fromEntries(
    staticRoutes.map(({ path, seo }) => [path, seo]),
  );

  const addRoute = (entry: SitemapEntry, seo: SeoRoute) => {
    entries.push(entry);
    seoRoutes[entry.path] = seo;
  };

  for (const { row: cityRow, city } of cities) {
    const cityPrices = pricesByCity.get(cityRow.id) ?? [];
    const cityProductIds = new Set(cityPrices.map((price) => String(price.data.product_id ?? "")));
    const cityProducts = [...cityProductIds].map((id) => productById.get(id)).filter((row): row is DataRow => Boolean(row));
    const categoryIds = new Set(cityProducts.map((product) => String(product.data.category_id ?? "")).filter(Boolean));
    const brandIds = new Set(cityProducts.map((product) => String(product.data.brand_id ?? "")).filter(Boolean));
    const categoryNames = [...categoryIds].map((id) => String(categoryById.get(id)?.data.name ?? "")).filter(Boolean);
    const cityPath = `/${city.slug}`;
    addRoute({
      path: cityPath,
      lastmod: latestTimestamp(cityRow.data.updated_at, cityPrices.map((price) => price.data.updated_at)),
    }, {
      title: `Alcohol Prices in ${city.name} | Bevory`,
      description: `Compare ${cityProducts.length.toLocaleString("en-IN")} locally priced beverage products and bottle sizes in ${city.name}.`,
      heading: `Alcohol prices in ${city.name}`,
      body: [
        `Bevory currently lists ${cityPrices.length.toLocaleString("en-IN")} reviewed bottle prices across ${cityProducts.length.toLocaleString("en-IN")} products in ${city.name}.`,
        categoryNames.length ? `Browse local ${categoryNames.slice(0, 8).join(", ")} prices. Listings are informational and can change at retail.` : "Listings are informational and can change at retail.",
      ],
      breadcrumbs: [{ name: "Home", path: "/" }, { name: city.name, path: cityPath }],
      structuredData: {
        "@type": "CollectionPage",
        name: `Alcohol prices in ${city.name}`,
        url: `${origin}${cityPath}`,
        numberOfItems: cityProducts.length,
        about: { "@type": "City", name: city.name },
      },
    });

    for (const categoryId of categoryIds) {
      const category = categoryById.get(categoryId);
      if (!category) continue;
      const categoryProducts = cityProducts.filter((product) => String(product.data.category_id ?? "") === categoryId);
      const categorySlug = String(category.data.slug);
      const categoryName = String(category.data.name || categorySlug);
      const path = `${cityPath}/category/${categorySlug}`;
      const image = validImageUrl(category.data.image_url);
      addRoute({
        path,
        lastmod: latestTimestamp(category.data.updated_at, categoryProducts.map((product) => product.data.updated_at)),
        images: image ? [{ loc: image, title: `${categoryName} in ${city.name}` }] : [],
      }, {
        title: `${categoryName} Prices in ${city.name} | Bevory`,
        description: `Compare ${categoryProducts.length} ${categoryName.toLowerCase()} products with reviewed bottle prices in ${city.name}.`,
        heading: `${categoryName} prices in ${city.name}`,
        body: [`Browse ${categoryProducts.length} locally priced ${categoryName.toLowerCase()} products in ${city.name}. Only reviewed positive price records are listed.`],
        ...(image ? { image } : {}),
        breadcrumbs: [
          { name: "Home", path: "/" },
          { name: city.name, path: cityPath },
          { name: categoryName, path },
        ],
        structuredData: { "@type": "CollectionPage", name: `${categoryName} in ${city.name}`, url: `${origin}${path}`, numberOfItems: categoryProducts.length },
      });

      const subcategoryIds = new Set(categoryProducts.map((product) => String(product.data.sub_category_id ?? "")).filter(Boolean));
      for (const subcategoryId of subcategoryIds) {
        const subcategory = subcategoryById.get(subcategoryId);
        if (!subcategory) continue;
        const subProducts = categoryProducts.filter((product) => String(product.data.sub_category_id ?? "") === subcategoryId);
        const subSlug = String(subcategory.data.slug);
        const subName = String(subcategory.data.name || subSlug);
        const subPath = `${path}/${subSlug}`;
        const subImage = validImageUrl(subcategory.data.image_url);
        addRoute({
          path: subPath,
          lastmod: latestTimestamp(subcategory.data.updated_at, subProducts.map((product) => product.data.updated_at)),
          images: subImage ? [{ loc: subImage, title: `${subName} in ${city.name}` }] : [],
        }, {
          title: `${subName} Prices in ${city.name} | Bevory`,
          description: `Compare ${subProducts.length} ${subName.toLowerCase()} products and reviewed local prices in ${city.name}.`,
          heading: `${subName} prices in ${city.name}`,
          body: [`Explore ${subProducts.length} locally priced ${subName.toLowerCase()} products in ${city.name}.`],
          ...(subImage ? { image: subImage } : {}),
          breadcrumbs: [
            { name: "Home", path: "/" },
            { name: city.name, path: cityPath },
            { name: categoryName, path },
            { name: subName, path: subPath },
          ],
          structuredData: { "@type": "CollectionPage", name: `${subName} in ${city.name}`, url: `${origin}${subPath}`, numberOfItems: subProducts.length },
        });
      }
    }

    for (const brandId of brandIds) {
      const brand = brandById.get(brandId);
      if (!brand) continue;
      const brandProducts = cityProducts.filter((product) => String(product.data.brand_id ?? "") === brandId);
      const brandName = String(brand.data.brand_name || "Brand");
      const path = `${cityPath}/brand/${brand.data.slug}`;
      const image = validImageUrl(brand.data.logo_url || brand.data.image_url);
      addRoute({
        path,
        lastmod: latestTimestamp(brand.data.updated_at, brandProducts.map((product) => product.data.updated_at)),
        images: image ? [{ loc: image, title: `${brandName} logo` }] : [],
      }, {
        title: `${brandName} Prices in ${city.name} | Bevory`,
        description: `Explore ${brandProducts.length} locally priced ${brandName} products and bottle sizes in ${city.name}.`,
        heading: `${brandName} prices in ${city.name}`,
        body: [shortText(brand.data.description || `Compare ${brandName} products with reviewed local prices in ${city.name}.`, 300)],
        ...(image ? { image } : {}),
        breadcrumbs: [
          { name: "Home", path: "/" },
          { name: city.name, path: cityPath },
          { name: brandName, path },
        ],
        structuredData: { "@type": "Brand", name: brandName, url: `${origin}${path}`, ...(image ? { logo: image } : {}) },
      });
    }
  }

  for (const [key, variantRows] of pricesByCityProduct) {
    const [cityId, productId] = key.split("|");
    const cityItem = cityById.get(cityId);
    const product = productById.get(productId);
    if (!cityItem || !product) continue;
    const { city } = cityItem;
    const productSlug = String(product.data.slug);
    const productName = `${product.data.brand || ""} ${product.data.name || ""}`.trim();
    const category = categoryById.get(String(product.data.category_id ?? ""));
    const image = product.data.image_identity_verified === true ? validImageUrl(product.data.image_url) : null;
    const sortedVariants = [...variantRows].sort((left, right) => Number(right.data.volume_ml) - Number(left.data.volume_ml));
    const basePath = `/${city.slug}/product/${productSlug}`;
    const pricesText = sortedVariants.map((variant) => `${variant.data.volume || `${variant.data.volume_ml}ml`} at ₹${Number(variant.data.price).toLocaleString("en-IN")}`).join(", ");
    const productGroup = {
      "@type": "ProductGroup",
      name: productName,
      description: shortText(product.data.description || `${productName} local price guide for ${city.name}.`, 300),
      brand: { "@type": "Brand", name: String(product.data.brand || "") },
      ...(image ? { image } : {}),
      productGroupID: productSlug,
      variesBy: ["https://schema.org/size"],
      url: `${origin}${basePath}`,
      hasVariant: sortedVariants.map((variant) => {
        const size = String(variant.data.volume || `${variant.data.volume_ml}ml`);
        const variantPath = `${basePath}/${volumeSlug(variant)}`;
        return {
          "@type": "Product",
          name: `${productName} ${size}`,
          sku: `${productSlug}-${volumeSlug(variant)}-${city.slug}`,
          size,
          inProductGroupWithID: productSlug,
          url: `${origin}${variantPath}`,
          offers: {
            "@type": "Offer",
            url: `${origin}${variantPath}`,
            price: Number(variant.data.price),
            priceCurrency: "INR",
            availability: variant.data.in_stock === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
            areaServed: { "@type": "City", name: city.name },
          },
        };
      }),
    };
    addRoute({
      path: basePath,
      lastmod: latestTimestamp(product.data.updated_at, sortedVariants.map((variant) => variant.data.updated_at)),
      images: image ? [{ loc: image, title: `${productName} bottle` }] : [],
    }, {
      title: `${productName} Price in ${city.name} | Bevory`,
      description: shortText(`${productName} price in ${city.name}. Compare ${sortedVariants.length} reviewed bottle size${sortedVariants.length === 1 ? "" : "s"}: ${pricesText}.`),
      heading: `${productName} price in ${city.name}`,
      body: [
        `${productName} has ${sortedVariants.length} reviewed local price ${sortedVariants.length === 1 ? "listing" : "listings"} in ${city.name}: ${pricesText}.`,
        `Prices are indicative and may change at retail. ${category ? `Browse more ${category.data.name} products available in ${city.name}.` : "Confirm current price and legal availability locally."}`,
      ],
      ...(image ? { image } : {}),
      breadcrumbs: [
        { name: "Home", path: "/" },
        { name: city.name, path: `/${city.slug}` },
        ...(category ? [{ name: String(category.data.name), path: `/${city.slug}/category/${category.data.slug}` }] : []),
        { name: productName, path: basePath },
      ],
      structuredData: productGroup,
    });

    for (const variant of sortedVariants) {
      const size = String(variant.data.volume || `${variant.data.volume_ml}ml`);
      const path = `${basePath}/${volumeSlug(variant)}`;
      const price = Number(variant.data.price);
      addRoute({
        path,
        lastmod: latestTimestamp(variant.data.updated_at, product.data.updated_at),
        images: image ? [{ loc: image, title: `${productName} ${size} bottle` }] : [],
      }, {
        title: `${productName} ${size} Price in ${city.name} | Bevory`,
        description: shortText(`${productName} ${size} price in ${city.name} is ₹${price.toLocaleString("en-IN")}. See product details, other locally listed sizes and price guidance.`),
        heading: `${productName} ${size} price in ${city.name}`,
        body: [
          `The reviewed indicative price for ${productName} ${size} in ${city.name} is ₹${price.toLocaleString("en-IN")}.`,
          "This listing is informational; retail price, stock and legal availability can change, so confirm locally before purchase.",
        ],
        ...(image ? { image } : {}),
        breadcrumbs: [
          { name: "Home", path: "/" },
          { name: city.name, path: `/${city.slug}` },
          { name: productName, path: basePath },
          { name: size, path },
        ],
        structuredData: {
          "@type": "Product",
          name: `${productName} ${size}`,
          description: `${productName} ${size} local price guide for ${city.name}.`,
          brand: { "@type": "Brand", name: String(product.data.brand || "") },
          ...(image ? { image } : {}),
          sku: `${productSlug}-${volumeSlug(variant)}-${city.slug}`,
          size,
          isVariantOf: { "@type": "ProductGroup", name: productName, productGroupID: productSlug },
          url: `${origin}${path}`,
          offers: {
            "@type": "Offer",
            url: `${origin}${path}`,
            price,
            priceCurrency: "INR",
            availability: variant.data.in_stock === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
            areaServed: { "@type": "City", name: city.name },
          },
        },
      });
    }
  }

  for (const post of byTable("blog_posts").filter((row) => row.data.is_published === true && row.data.slug)) {
    const path = `/guide/${post.data.slug}`;
    const image = validImageUrl(post.data.cover_image_url);
    const title = String(post.data.meta_title || `${post.data.title} | Bevory Guide`);
    const description = shortText(post.data.meta_description || post.data.excerpt || post.data.content || `Read ${post.data.title} on Bevory.`);
    addRoute({
      path,
      lastmod: latestTimestamp(post.data.updated_at, post.data.published_at, post.data.created_at),
      images: image ? [{ loc: image, title: String(post.data.title) }] : [],
    }, {
      title,
      description,
      heading: String(post.data.title),
      body: [description],
      ...(image ? { image } : {}),
      breadcrumbs: [{ name: "Home", path: "/" }, { name: "Guide", path: "/guide" }, { name: String(post.data.title), path }],
      structuredData: {
        "@type": "Article",
        headline: String(post.data.title),
        description,
        ...(image ? { image: [image] } : {}),
        datePublished: post.data.published_at || post.data.created_at,
        dateModified: post.data.updated_at || post.data.published_at,
        author: { "@type": "Person", name: String(post.data.author || "Bevory Team") },
        publisher: { "@type": "Organization", name: "Bevory", logo: { "@type": "ImageObject", url: `${origin}/favicon.png` } },
        mainEntityOfPage: `${origin}${path}`,
      },
    });
  }

  for (const cocktail of byTable("cocktails").filter((row) => row.data.is_active !== false && row.data.slug)) {
    const path = `/cocktail/${cocktail.data.slug}`;
    const image = validImageUrl(cocktail.data.image_url);
    const name = String(cocktail.data.name || "Cocktail");
    const description = shortText(cocktail.data.description || `Ingredients and method for the ${name} cocktail.`);
    const ingredients = Array.isArray(cocktail.data.ingredients) ? cocktail.data.ingredients.map(String) : [];
    const instructions = plainText(cocktail.data.instructions);
    addRoute({
      path,
      lastmod: latestTimestamp(cocktail.data.updated_at, cocktail.data.created_at),
      images: image ? [{ loc: image, title: `${name} cocktail` }] : [],
    }, {
      title: `${name} Cocktail Recipe | Bevory`,
      description,
      heading: `${name} cocktail recipe`,
      body: [description, ingredients.length ? `Ingredients: ${ingredients.join(", ")}.` : instructions].filter(Boolean),
      ...(image ? { image } : {}),
      breadcrumbs: [{ name: "Home", path: "/" }, { name: "Cocktails", path: "/cocktails" }, { name, path }],
      structuredData: {
        "@type": "Recipe",
        name,
        description,
        ...(image ? { image } : {}),
        recipeCategory: "Cocktail",
        recipeIngredient: ingredients,
        ...(instructions ? { recipeInstructions: [{ "@type": "HowToStep", text: instructions }] } : {}),
        author: { "@type": "Organization", name: "Bevory" },
        url: `${origin}${path}`,
      },
    });
  }

  for (const video of byTable("video_reviews").filter((row) => row.data.is_active === true && row.data.slug)) {
    const path = `/masterclass/${video.data.slug}`;
    const image = validImageUrl(video.data.thumbnail_url);
    const title = String(video.data.title || "Beverage video");
    const description = shortText(video.data.description || `Watch ${title} on Bevory.`);
    addRoute({ path, lastmod: latestTimestamp(video.data.updated_at, video.data.created_at), images: image ? [{ loc: image, title }] : [] }, {
      title: `${title} | Bevory Masterclass`,
      description,
      heading: title,
      body: [description],
      ...(image ? { image } : {}),
      breadcrumbs: [{ name: "Home", path: "/" }, { name: "Masterclass", path: "/masterclass" }, { name: title, path }],
    });
  }

  for (const creator of byTable("video_creators").filter((row) => row.data.is_active === true && row.data.slug)) {
    const path = `/creator/${creator.data.slug}`;
    const image = validImageUrl(creator.data.avatar_url);
    const name = String(creator.data.name || "Creator");
    const description = shortText(creator.data.bio || `Watch beverage videos from ${name} on Bevory.`);
    addRoute({ path, lastmod: latestTimestamp(creator.data.updated_at, creator.data.created_at), images: image ? [{ loc: image, title: name }] : [] }, {
      title: `${name} | Bevory Creator`,
      description,
      heading: name,
      body: [description],
      ...(image ? { image } : {}),
      breadcrumbs: [{ name: "Home", path: "/" }, { name: "Masterclass", path: "/masterclass" }, { name, path }],
      structuredData: { "@type": "Person", name, description, ...(image ? { image } : {}), url: `${origin}${path}` },
    });
  }

  const uniqueEntries = [...new Map(entries.map((entry) => [entry.path, entry])).values()];
  if (uniqueEntries.length > 50_000) {
    throw new Error(`Sitemap has ${uniqueEntries.length} URLs; split into a sitemap index before publishing.`);
  }
  const urls = uniqueEntries.map(({ path, lastmod, images = [] }) => {
    const imageTags = [...new Map(images.map((item) => [item.loc, item])).values()].map((item) => [
      "    <image:image>",
      `      <image:loc>${xmlEscape(item.loc)}</image:loc>`,
      ...(item.title ? [`      <image:title>${xmlEscape(item.title)}</image:title>`] : []),
      "    </image:image>",
    ].join("\n"));
    return [
      "  <url>",
      `    <loc>${xmlEscape(`${origin}${path}`)}</loc>`,
      ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []),
      ...imageTags,
      "  </url>",
    ].join("\n");
  }).join("\n");

  const seoBuckets = new Map<string, Record<string, SeoRoute>>();
  for (const [path, seo] of Object.entries(seoRoutes)) {
    const bucket = seoBucketForPath(path);
    const routes = seoBuckets.get(bucket) ?? {};
    routes[path] = seo;
    seoBuckets.set(bucket, routes);
  }
  const seoDirectory = new URL("../public/seo-routes/", import.meta.url);
  await rm(seoDirectory, { recursive: true, force: true });
  await mkdir(seoDirectory, { recursive: true });
  const seoBucketNames = [...new Set([
    "content",
    ...CITY_SLUGS.map((citySlug) => `${citySlug}-pages`),
    ...seoBuckets.keys(),
  ])];

  await Promise.all([
    writeFile(
      new URL("../public/sitemap.xml", import.meta.url),
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls}\n</urlset>\n`,
    ),
    ...seoBucketNames.map((bucket) => writeFile(
      new URL(`${bucket}.json`, seoDirectory),
      `${JSON.stringify(seoBuckets.get(bucket) ?? {})}\n`,
    )),
    writeFile(
      new URL("manifest.json", seoDirectory),
      `${JSON.stringify({
        generatedAt: new Date().toISOString(),
        routes: Object.keys(seoRoutes).length,
        buckets: Object.fromEntries(seoBucketNames.map((bucket) => [
          bucket,
          Object.keys(seoBuckets.get(bucket) ?? {}).length,
        ])),
      })}\n`,
    ),
  ]);

  const imageCount = uniqueEntries.reduce((total, entry) => total + new Set((entry.images ?? []).map((item) => item.loc)).size, 0);
  const variantCount = uniqueEntries.filter((entry) => /^\/[a-z-]+\/product\/[^/]+\/[^/]+$/.test(entry.path)).length;
  const productCount = uniqueEntries.filter((entry) => /^\/[a-z-]+\/product\/[^/]+$/.test(entry.path)).length;
  console.log(`Generated sitemap with ${uniqueEntries.length} URLs and ${imageCount} images (${productCount} city products, ${variantCount} city variants, ${Object.keys(seoRoutes).length} SEO routes)`);
} finally {
  await prisma.$disconnect();
}
