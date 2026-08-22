# Migration Status

Last updated: 2026-08-22

## Summary

The application is migrated from Supabase runtime services to React + Node.js + Express + Prisma + MySQL. The existing pages, routes, styling, responsive behavior, and administration screens remain in place. Public source content and referenced assets are repository-local, and all integrations that can be implemented without private credentials now have production-ready adapters.

The local application is runnable and verified. Items still open are limited to unavailable private source data, third-party credentials/live-account verification, and access to a production deployment environment.

## Status by area

| Area | Status | Verification |
| --- | --- | --- |
| Existing React UI, routes, and styling | ✅ Fully completed | Home, product, auth, and admin routes rendered locally; production deep route passed |
| Node.js/Express API | 🧪 Completed and verified | TypeScript/build passed; health and live endpoint smoke tests passed |
| Prisma/MySQL persistence | 🧪 Completed and verified | Schema including OTP challenges pushed to MySQL; health returned 603 content/auth records |
| Public content migration | 🧪 Completed and verified | 601 source rows seeded across 20 tables |
| Public source storage assets | 🧪 Completed and verified | 8/8 referenced assets migrated and served locally |
| Query compatibility and admin CRUD | 🧪 Completed and verified | Filters, relations, auth-scoped CRUD, admin dashboard, import/export passed |
| Email/password authentication | 🧪 Completed and verified | bcrypt passwords, JWT sessions, protected admin access passed |
| Google OAuth | ⚠️ Implemented; live verification requires credentials | Authorization, signed state, callback exchange, verified-email linking, session handoff, and error handling implemented |
| Phone OTP | ⚠️ Implemented; production SMS requires credentials | MySQL challenge, hashing, 10-minute expiry, resend delay, attempt limits, account linking, and local end-to-end OTP passed |
| GA4 live reporting | ⚠️ Implemented; live verification requires credentials | Server-side service-account JWT and three GA4 Data API reports implemented; secrets removed from public settings |
| Approved price-provider ingestion | ⚠️ Implemented; live verification requires provider access | Admin-only provider adapter, matching, normalization, upsert, timeout, HTTPS enforcement, and explicit configuration status implemented |
| Image uploads | 🧪 Local completed; S3 needs production verification | Local upload/retrieval passed; S3-compatible adapter and returned public URLs implemented |
| Party planner and catalog recommendations | 🧪 Completed and verified | Local deterministic/catalog modes return working recommendations without an external dependency |
| Private Supabase import tooling | 🧪 Completed and dry-run verified | User-ID reconciliation, supported bcrypt preservation, reset marking, and all private user tables supported |
| Container/deployment configuration | ⚠️ Completed; Docker/production verification pending | Dockerfile and MySQL/app Compose stack added; YAML parsed, but Docker is unavailable in this environment |
| Production deployment | ❌ Blocked by missing infrastructure access | No production database, host, storage bucket, secret manager, or DNS access supplied |

## Remaining Work / Blockers

### 1. Existing private Supabase users and per-user records

- **What is left:** Run the completed private import against the real authorized auth/database export.
- **Why it could not be completed:** Only anonymous source access was available; private identities and RLS-protected records cannot be retrieved with the public key.
- **Exactly required:** An administrator-generated JSON export matching `docs/PRIVATE_DATA_IMPORT_FORMAT.md`, delivered through a secure channel outside Git.
- **Affected files/features/services:** Existing-user continuity for profiles, roles, preferences, favorites, notifications, saved locations, comparisons, recent searches, and preferred brands.
- **Safe without it:** Yes for public content and new accounts. Existing production accounts/data will remain absent.
- **Recommended next action:** Generate the private export, run a dry run, back up MySQL, then run `pnpm data:import-private -- /secure/export.json --apply` and reconcile counts.

### 2. Google OAuth live verification

- **What is left:** Execute a real Google authorization/callback cycle.
- **Why it could not be completed:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and an approved redirect URI were not supplied.
- **Exactly required:** Google Cloud OAuth web credentials and registration of `GOOGLE_REDIRECT_URI` for local/staging/production.
- **Affected:** “Continue with Google.” Email/password and phone code paths are independent.
- **Safe without it:** Yes. The frontend now shows a clear configuration error before redirecting.
- **Recommended next action:** Add credentials to the secret manager and test new-user, existing-email linking, cancellation, and expired-state flows.

### 3. Twilio production SMS delivery

- **What is left:** Send and verify real SMS messages in staging/production.
- **Why it could not be completed:** Twilio account credentials and a sender number were not supplied.
- **Exactly required:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, regional sender/template approval, and production rate-limit monitoring.
- **Affected:** Real phone delivery only. The complete OTP/database/session flow passed with the non-production test code.
- **Safe without it:** Yes. Email/password works and phone requests return a clear configuration error when unavailable.
- **Recommended next action:** Configure Twilio secrets, remove any `OTP_TEST_CODE` from production, and verify delivery, retry, expiry, and lockout.

### 4. GA4 live property verification

- **What is left:** Query a real GA4 property and compare dashboard totals.
- **Why it could not be completed:** No service-account JSON or GA4 property access was supplied.
- **Exactly required:** `GOOGLE_ANALYTICS_CREDENTIALS_JSON`, numeric property ID, GA4 Data API enabled, and Viewer access for the service-account email.
- **Affected:** Live admin analytics only; database/admin statistics remain available.
- **Safe without it:** Yes. Secrets are never stored in public `app_settings`, and the UI reports configuration status.
- **Recommended next action:** Inject the JSON through the production secret manager and compare daily, page, and source reports with GA4.

### 5. Live price-provider verification

- **What is left:** Connect and validate the approved live price feed.
- **Why it could not be completed:** No licensed/approved provider URL, credentials, or sample response was supplied.
- **Exactly required:** `PRICE_PROVIDER_URL`, optional `PRICE_PROVIDER_KEY` and header name, provider response mapping confirmation, and data-use approval.
- **Affected:** Automatic price refresh. Manual price CRUD and CSV management remain available.
- **Safe without it:** Yes. The admin action returns an explicit configuration response and makes no partial writes.
- **Recommended next action:** Supply a staging provider endpoint, run one city, inspect unmatched products, then expand city-by-city.

### 6. Production object storage verification

- **What is left:** Upload and retrieve a real object through the implemented S3-compatible adapter.
- **Why it could not be completed:** No bucket, endpoint, keys, public/CDN URL, or cloud account access was supplied.
- **Exactly required:** The `S3_*` variables in `.env.example`, bucket CORS/public-delivery policy, and lifecycle/backup rules.
- **Affected:** Durability of new uploads on ephemeral or horizontally scaled production hosts.
- **Safe without it:** Yes locally or on a single server with a persistent `/uploads` volume. Not safe on an ephemeral filesystem.
- **Recommended next action:** Provision a private-write/public-read delivery path, inject credentials, and verify upload, overwrite policy, CDN cache, and restore.

### 7. Production deployment and container verification

- **What is left:** Build the container, provision production services, deploy, configure DNS/HTTPS, and run operational tests.
- **Why it could not be completed:** Docker is not installed in this execution environment and no host/database/storage/DNS permissions were supplied.
- **Exactly required:** A Docker-capable CI/host, production MySQL URL, strong JWT/admin secrets, object storage, deployment access, and DNS/HTTPS permissions.
- **Affected:** Public production availability only. The compiled production Node server and React deep routes passed locally.
- **Safe without it:** Yes for the provided local environment; no production claim should be made yet.
- **Recommended next action:** Build `Dockerfile` in CI, deploy first to staging, then run smoke/load/backup-restore tests before live traffic.

## Exact completion order

1. Obtain the authorized private Supabase export and run the importer dry run.
2. Provision production MySQL, object storage, secret manager, and a staging host.
3. Import private data into backed-up staging MySQL and reconcile user/table counts.
4. Configure Google OAuth and Twilio, then verify all authentication paths.
5. Configure GA4 and compare live reports.
6. Configure the approved price provider and validate one city before the full refresh.
7. Build/deploy the container in staging, verify S3 uploads, then run full browser/API/load tests.
8. Complete backup/restore and rollback drills, configure DNS/HTTPS, and only then direct production traffic.

## Verification record

- Automated tests: 9 passed across query filters, Google OAuth configuration, MySQL OTP/account/profile lifecycle, and storage
- Frontend TypeScript: passed
- Backend TypeScript: passed
- ESLint: passed with 0 errors and 22 advisory warnings in retained UI code
- Production React/Node build: passed
- Compiled production API and React deep-route serving: passed
- MySQL/Prisma schema and health: passed
- Email/password and admin authorization: passed
- Local phone OTP send/invalid-code/valid-code/session cycle: passed
- Direct authenticated admin deep-link reload: passed after role-loading race fix
- Admin CRUD, database export/import, image upload/retrieval, party planner: passed
- Private import dry run: passed
- Browser party-planner integration: passed with quantity safeguards for invalidly low source prices
- Docker Compose YAML parsing: passed; Docker build not run because the Docker executable is unavailable
