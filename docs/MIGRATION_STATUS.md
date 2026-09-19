# Migration Status

Last updated: 2026-09-19

## Summary

Bevory is live at `https://bevory.in`. Cloudflare Pages serves the React/Vite
frontend and proxies `/api/*` to the first-party Node.js/Express API on AWS
Lightsail. Prisma persists application data in Lightsail Managed MySQL, and
uploads use a private encrypted S3 bucket.

The application no longer depends on the previous backend. The production
catalogue, authentication, administration, Google OAuth, city-specific prices,
Guide content, DNS, TLS, budget alerts, and private object storage are deployed
and verified.

## Current Status

| Area | Status | Verification |
| --- | --- | --- |
| Cloudflare Pages frontend | Complete | `bevory.in`, `www.bevory.in`, and the Pages production deployment are active |
| AWS Lightsail API | Complete | Container health check and public `/api/health` pass |
| Lightsail Managed MySQL | Complete | Prisma schema, seed, catalogue, and integration tests pass |
| Catalogue import | Complete | 30 cities, 18 active categories, 121 subcategories, 1,283 brands, 2,936 products, and 4,760 valid price variants |
| City availability | Complete | Only approved variants priced in the selected city are returned |
| Product images | Complete as linked sources | All 2,936 products have verified Livcheers source image URLs; 341 brand logos are verified |
| Guide recovery | Complete | 50 articles reconstructed, 2,179 fragments quarantined, and 11 evergreen articles published |
| 25+ compliance UI | Complete | The configurable 25+ gate is mounted globally across public, auth, and admin routes |
| Authentication | Complete | Email/password, sessions, admin authorization, phone OTP tests, and Google OAuth pass |
| S3 uploads | Complete | Bucket is private, encrypted, versioned, and restricted to the production uploader |
| CloudFront media CDN | Blocked by AWS | Existing OAC is ready, but AWS still rejects distribution creation until account verification |

## Import Exceptions

- Four source rows were excluded because they contain no positive INR price:
  three Goa rows and one Gurgaon row.
- 59 source-conflict or anomaly price rows remain stored with
  `requires_review=true`. Public catalogue, product, comparison, favorite,
  brand, party-planner, and sitemap reads exclude them until an administrator
  approves the values.
- Three multi-category and six category-conflict warnings are retained in the
  production import report for editorial review.
- Product images remain externally linked as requested. Their identity is
  verified, but reuse rights must be confirmed before copying them to S3.

Production audit reports are stored with restricted permissions in
`/opt/bevory/reports`. The pre-repair Guide backup is encrypted in S3 at
`s3://bevory-uploads-091199627263-ap-south-1/backups/blog/blog-posts-before-repair-2026-09-19T04-18-15-288Z.json`.

## Remaining External Blocker

AWS still returns `Your account must be verified before you can add new
CloudFront resources` when creating the approved distribution. AWS Support case
`178975941700756` already tracks the account-verification request. The private
bucket must not be made public as a workaround. Once AWS verifies the account,
create the distribution with OAC `bevory-uploads-oac`, scope the bucket policy
to its ARN, and then attach `media.bevory.in`.

## Verification Record

- Production build and all frontend, server, and script TypeScript checks pass.
- Automated suite: 25/25 tests across nine files.
- ESLint: zero errors; 20 retained advisory warnings.
- Gurgaon catalogue: 1,888 products and 2,127 approved variants, with zero
  missing product images.
- Catalogue response: about 0.35 seconds cold locally and 0.017 seconds cached;
  the full 2.7 MB response is compressed at the production proxy.
- The live Guide API returns exactly 11 published reconstructed articles.
- Desktop and 390 x 844 mobile browser checks show no horizontal overflow or
  console errors.
- Service worker v6 fetches route documents network-first so compliance changes
  are not hidden behind stale HTML.
- `sitemap.xml` contains 4,246 current URLs: 2,920 approved products, 1,283
  brands, and 11 published guides, plus city, category, and static pages.
- Lightsail exposes only TCP ports 80 and 443; temporary SSH access was closed.
