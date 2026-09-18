# Production Deployment

Last verified: 2026-09-19

## Public endpoints

- Primary site: `https://bevory.in`
- Secondary domain: `https://www.bevory.in` (permanently redirects to the apex domain)
- Pages project: `https://bevory.pages.dev`
- API origin: `https://api.bevory.in`

## Topology

- Cloudflare Pages project `bevory` serves `dist/` and runs `public/_worker.js`.
- The Pages Worker proxies `/api/*` to `https://api.bevory.in` and supplies the
  private origin-verification header.
- AWS Lightsail instance `bevory-api-prod` runs the API and Caddy with Docker
  Compose. Only Caddy publishes ports 80 and 443.
- Lightsail database `bevory-mysql-prod` runs private MySQL 8.4.
- S3 bucket `bevory-uploads-091199627263-ap-south-1` blocks all public access,
  uses AES256 encryption, and has versioning enabled.
- IAM user `bevory-production-uploader` is limited to the uploads bucket.
- AWS Budget `Bevory-Monthly-Budget` is set to USD 25/month with actual and
  forecast alerts.

## DNS

`bevory.in` is delegated to Cloudflare nameservers:

- `aliza.ns.cloudflare.com`
- `kellen.ns.cloudflare.com`

The apex and `www` records point to `bevory.pages.dev`. `api` points directly to
the attached Lightsail static IP and remains DNS-only so Caddy owns origin TLS.

## Expected base cost

- Lightsail 1 GB instance: USD 7/month
- Lightsail 1 GB managed MySQL: USD 15/month
- Cloudflare Pages: free plan
- S3 and CloudFront: usage based

The expected fixed base is USD 22/month before storage, delivery, taxes, and
other usage.

## Verification

The following production checks passed on 2026-09-19:

- Both custom domains are active with SSL in Cloudflare Pages.
- `/api/health` reaches MySQL through the Pages Worker.
- Direct API requests without the verification secret return 404.
- Administrator sign-in, session validation, and an admin-only status endpoint
  work through the production domain.
- Public catalog reads and the party-planner endpoint work.
- The production catalogue contains all 30 supported cities, 18 active
  categories, 121 subcategories, 1,283 brands, 2,936 products, and 4,760
  city-specific size prices.
- City availability is strict: a product size is returned only where that city
  has a price for it.
- 2,920 products have verified source image URLs and 341 brands have verified
  logo URLs. These remote links are requested at a 720 px display target; image
  reuse rights still require review before copying the assets to S3.
- Google OAuth completes end to end with the verified Bevory consent screen;
  only the current production client secret remains enabled.
- The restricted S3 identity can put, inspect, and delete an object; the test
  object was deleted afterward.
- The live `/gurgaon` page renders without browser console errors.
- The adaptive Bevory favicon and logo render correctly in light and dark mode,
  and the production source contains no legacy third-party branding.
- `sitemap.xml` contains 4,251 current catalogue URLs. Search Console previously
  accepted the sitemap; Google must recrawl it to discover the expanded set.

## CloudFront status

The CloudFront origin access control `bevory-uploads-oac` exists, but AWS rejects
new distribution creation until this new account is verified by AWS Support.
The S3 bucket remains private; do not make it public as a workaround. After AWS
removes the restriction, create the distribution using the existing private OAC,
apply a bucket policy scoped to that distribution ARN, point `media.bevory.in`
to the distribution, and verify an uploaded image end to end.

## Operations

Deploy the frontend after a production build:

```bash
npx --yes wrangler@latest pages deploy dist --project-name bevory --branch main
```

Deploy the API from `/opt/bevory` on the Lightsail instance:

```bash
sudo docker compose -f deploy/docker-compose.production.yml build api
sudo docker compose -f deploy/docker-compose.production.yml run --rm api pnpm db:setup
sudo docker compose -f deploy/docker-compose.production.yml up -d
```

Import a reviewed Livcheers catalogue bundle after copying the three CSVs to a
temporary host directory. The importer is idempotent and writes a complete JSON
exception report; remove the temporary CSVs after verification.

```bash
sudo docker compose -f deploy/docker-compose.production.yml run --rm \
  -v /opt/bevory/catalog-import:/catalog:ro api \
  pnpm catalog:import -- \
  --delhi /catalog/delhi.csv \
  --goa /catalog/goa.csv \
  --gurgaon /catalog/gurgaon.csv \
  --report /tmp/livcheers-import-report.json
```

Never commit `.env.production`, AWS access keys, database credentials, JWT
secrets, or the Pages origin-verification secret.
