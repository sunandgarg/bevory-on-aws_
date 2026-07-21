# BevOry

BevOry is a Vite/React beverage discovery and price-comparison application. The current backend uses Supabase for Postgres, authentication, storage, and Edge Functions; the SPA is configured for Vercel deployment.

## Requirements

- Node.js 20+
- npm 10+
- Supabase CLI for database/function deployment

## Local development

```sh
nvm use
npm ci
npm run dev
```

The frontend expects these variables in `.env`:

```text
VITE_SUPABASE_PROJECT_ID=
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

The publishable key is intended for browser use. Never place a service-role key or provider secret in a `VITE_` variable.

## Verification

```sh
npm run check
```

This runs linting, TypeScript, security regression tests, and the production build.

## Supabase deployment

Link the intended project before applying migrations:

```sh
supabase link --project-ref <project-ref>
supabase db push
supabase functions deploy
```

Privileged functions verify the caller's `admin` role. Provider credentials belong in Edge Function secrets, never `app_settings`:

```sh
supabase secrets set OPENAI_API_KEY=...
supabase secrets set ANTHROPIC_API_KEY=...
supabase secrets set PERPLEXITY_API_KEY=...
supabase secrets set LOVABLE_API_KEY=...
supabase secrets set GOOGLE_SERVICE_ACCOUNT_JSON='...'
```

After applying migrations to a new project, create the first admin role through a trusted SQL/admin workflow. Do not expose a public bootstrap-admin endpoint.

## Deployment

For Cloudflare Pages, use `npm run build` as the build command and `dist` as
the output directory. Configure the three `VITE_SUPABASE_*` frontend variables
shown above. Use the base project URL ending in `.supabase.co`, not the
`/rest/v1/` endpoint, and never expose an `sb_secret_` key in Cloudflare Pages.

`vercel.json` remains available when deploying the SPA to Vercel.
