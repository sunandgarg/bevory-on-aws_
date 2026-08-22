# Migration Status

Last updated: 2026-08-22

## Summary

The repository has been converted from a React/Supabase application to a React + Node.js + Prisma + MySQL application. The existing React pages, routes, styles, responsive layouts, and admin screens are retained. A compatibility client maps their existing query chains to the new Node API, avoiding visual rewrites and reducing regression risk.

The application is locally runnable. Public source content was migrated into a sanitized Prisma seed, and all source Supabase Storage URLs referenced by that content were replaced by repository-local assets.

## Status by area

| Area | Status | Verification |
| --- | --- | --- |
| Existing React UI, routes, and styling | ✅ Fully completed | Vite production build succeeded; home, product, auth, and admin pages rendered locally |
| Node.js/Express API | ✅ Fully completed | TypeScript passed; `/api/health` returned `status: ok` |
| Prisma/MySQL persistence | ✅ Fully completed | Schema pushed to MySQL 9.6; 603 content/auth records present during verification |
| Public catalog/content migration | ✅ Fully completed | 601 source rows exported and seeded across 20 public tables |
| Public Supabase Storage assets | ✅ Fully completed | 8/8 referenced assets downloaded and seed URLs rewritten locally |
| Query compatibility (read/filter/order/range/count/relations) | 🧪 Completed and verified | Home, product detail, category data, location data, and admin dashboard queries passed |
| Admin CRUD | 🧪 Completed and verified | Authenticated create/read/update/delete cycle passed against MySQL |
| Email/password authentication and admin authorization | 🧪 Completed and verified | Local admin sign-in and protected admin dashboard passed |
| Favorites, notifications, preferences, recent searches, saved locations | ✅ Fully completed | User-scoped API operations implemented; require a new MySQL-backed account |
| Image uploads | 🧪 Completed and verified | Authenticated multipart upload and public `/uploads` retrieval passed |
| Database export/import | 🧪 Completed and verified | Authenticated full export returned all populated tables; import/upsert implemented |
| Party planner | 🧪 Completed and verified | Deterministic local recommendations returned successfully without an external AI dependency |
| AI recommendation admin tool | ⚠️ Completed but needs production verification | Local catalog-based fallback implemented; external provider needs a production key |
| Sitemap/PWA configuration | ✅ Fully completed | Supabase API/storage caching removed; canonical sitemap points to `www.bevory.in/sitemap.xml` |
| Supabase runtime/SDK/functions/migrations | ✅ Fully removed | No Supabase SDK dependency or deployed-function dependency remains in the running stack |
| Production deployment | ❌ Not completed / blocked | No production database, host, domain access, or deployment target was supplied |

## Remaining Work / Blockers

### 1. Existing private Supabase users and per-user records

- **What is left:** Import existing authentication accounts plus private profiles, roles, preferences, favorites, notifications, saved locations, comparisons, and recent searches.
- **Why it could not be completed:** The repository contains only a public/publishable Supabase key. Anonymous access cannot export protected auth identities, password hashes, or RLS-protected rows.
- **Required to complete:** A secure Supabase auth export and database dump produced by an authorized administrator. Passwords may require a reset flow if Supabase hashes cannot be imported safely.
- **Affected:** Existing-user sign-in continuity and historical per-user data. New MySQL-backed accounts work now.
- **Safe to run without it:** Yes. Public content, new sign-ups, email/password sign-in, and admin functions run safely. Existing production users will not be recognized until migrated.
- **Recommended next action:** Provide a private database/auth export through a secure channel; never commit service-role keys or user exports to this public repository.

### 2. Google sign-in

- **What is left:** OAuth callback endpoints and production Google OAuth verification.
- **Why it could not be completed:** No `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, approved redirect URI, or production domain was supplied.
- **Required to complete:** Google Cloud OAuth credentials and allowed callback URLs for local and production environments.
- **Affected:** “Continue with Google” on `src/pages/Auth.tsx`; email/password auth is unaffected.
- **Safe to run without it:** Yes. The button reports a clear configuration error and does not create a partial session.
- **Recommended next action:** Configure Google OAuth, then add server callback/session linking tests.

### 3. Phone OTP sign-in

- **What is left:** SMS send/verify implementation and production delivery testing.
- **Why it could not be completed:** No SMS provider account, credentials, sending number, or regional template approval was supplied.
- **Required to complete:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` (or an approved alternative provider), plus OTP abuse/rate-limit policy.
- **Affected:** Phone login on `src/pages/Auth.tsx` and auth methods in `src/integrations/supabase/client.ts`.
- **Safe to run without it:** Yes. Email/password authentication works; phone actions return an explicit configuration error.
- **Recommended next action:** Supply the SMS provider credentials and verify send, retry, expiry, and lockout flows.

### 4. Live Google Analytics reporting

- **What is left:** GA4 Data API calls and production property validation.
- **Why it could not be completed:** No service-account JSON, GA4 property access, or property ID was supplied.
- **Required to complete:** `GOOGLE_ANALYTICS_CREDENTIALS_JSON`, a GA4 property ID, and Viewer access for that service account.
- **Affected:** Live reporting in `src/hooks/useGoogleAnalytics.tsx` and `/api/functions/google-analytics`.
- **Safe to run without it:** Yes. The admin dashboard clearly displays sample analytics and other live database statistics still work.
- **Recommended next action:** Add credentials only to the production secret manager, implement the GA4 Data API adapter, then compare results with the GA console.

### 5. Third-party live price scraping

- **What is left:** Production-approved data-source integration for automatic city price refresh.
- **Why it could not be completed:** The legacy scraper relies on a third-party website whose current markup, permission/terms, rate limits, and production reachability were not verified.
- **Required to complete:** An approved price-data source/API or written approval to scrape, sample responses/current selectors, and a production egress policy.
- **Affected:** “Scrape Prices” in `src/pages/admin/AdminProductPrices.tsx` and `/api/functions/scrape-prices`. Manual CSV and admin price CRUD remain available.
- **Safe to run without it:** Yes. Existing prices and manual management work; automatic scraping returns a clear unsupported response.
- **Recommended next action:** Prefer a licensed price API, then implement normalization, retry/rate limiting, and city-by-city verification.

### 6. Production infrastructure and uploads persistence

- **What is left:** Production MySQL provisioning, deployment, secrets, HTTPS/domain configuration, backups, and persistent object/file storage.
- **Why it could not be completed:** No cloud account, production database credentials, hosting target, DNS permissions, or storage bucket was supplied.
- **Required to complete:** Deployment target access, production `DATABASE_URL`, strong `JWT_SECRET`, domain/DNS access, and a persistent volume or S3-compatible bucket.
- **Affected:** Production availability and durability of new image uploads. Local and single-server operation works.
- **Safe to run without it:** Safe locally. Do not treat an ephemeral deployment filesystem as durable production storage.
- **Recommended next action:** Provision managed MySQL and object storage, inject secrets, run `pnpm db:setup`, deploy, and complete smoke/load/backup-restore tests.

## Exact completion order for remaining work

1. Securely export private Supabase database/auth data and decide the account password-reset/import strategy.
2. Provision production MySQL, import the sanitized public seed plus authorized private export, and reconcile counts.
3. Provision persistent uploads/object storage and replace the local-disk storage adapter for production.
4. Supply and configure Google OAuth and phone OTP credentials; verify authentication callbacks and abuse controls.
5. Supply GA4 service-account access and verify live reports.
6. Approve/select a price data source and verify automatic price ingestion.
7. Provision the production host and secret manager, deploy the built application, configure DNS/HTTPS, and run full production smoke tests.
8. Run backup/restore and rollback drills before directing live traffic to the new stack.

## Verification record

- Frontend TypeScript: passed (`tsc -p tsconfig.app.json --noEmit`)
- Backend TypeScript: passed (`tsc -p tsconfig.server.json --noEmit`)
- Production frontend build: passed (`vite build`)
- Full production build: passed (`pnpm build`)
- Automated compatibility tests: passed (`pnpm test`)
- ESLint: passed with zero errors (22 advisory warnings in retained UI code)
- MySQL/Prisma health: passed
- Authentication: passed
- Admin authorization/dashboard: passed
- MySQL CRUD: passed
- Party planner endpoint: passed
- Database export endpoint: passed
- Authenticated image upload and retrieval: passed
- Browser smoke tests: home, product detail, authentication, and admin dashboard passed
