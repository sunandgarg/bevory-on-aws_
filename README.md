# Bevory React

Bevory is a React beverage discovery, comparison, editorial, party-planning, and administration application. The visual frontend and route structure are preserved from the original website; the backend is now a self-hosted Node.js API using Prisma and MySQL.

## Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- Backend: Node.js, Express, TypeScript
- Database: MySQL through Prisma ORM
- Authentication: email/password, Google OAuth, and Twilio phone OTP with signed JWT sessions
- Storage: local `/uploads` API with an automatic S3-compatible production adapter

## Local setup

Requirements: Node.js 20.19 or newer, pnpm 11, and MySQL 8/9.

```bash
git clone https://github.com/sunandgarg/bevory-react.git
cd bevory-react
pnpm install
cp .env.example .env
```

Create the database, then update `DATABASE_URL` in `.env` if your MySQL credentials differ:

```sql
CREATE DATABASE bevory CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Initialize and seed it:

```bash
pnpm db:setup
pnpm dev
```

- React application: [http://localhost:8080](http://localhost:8080)
- Node API health: [http://localhost:3001/api/health](http://localhost:3001/api/health)

The seed creates a local administrator only when both `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set. Replace all example secrets before using the app outside a private local environment.

## Production

```bash
pnpm build
NODE_ENV=production pnpm start
```

In production, Express serves the compiled React application and API from the same process. Configure a production `DATABASE_URL`, strong `JWT_SECRET`, persistent uploads storage, HTTPS, and the optional integration credentials described in `.env.example`.

For a containerized local/production-like stack:

```bash
docker compose up --build
```

The Compose stack provisions MySQL with persistent database/upload volumes and initializes the schema and seed automatically. Replace every default password before shared use. For horizontally scaled or ephemeral deployments, configure the `S3_*` variables instead of relying on the upload volume.

## Data and integrations

This repository is standalone and has no dependency on the earlier backend or its data. `pnpm db:setup` creates the Prisma schema and a clean starter dataset containing Gurgaon location metadata and six beverage categories; it does not import any previous catalog or user records.

The frontend uses the first-party client at `src/integrations/api/client.ts`, which talks only to the Node API configured by `VITE_API_URL`. Google OAuth, Twilio OTP, GA4 reporting, an approved price provider, and S3-compatible uploads activate only when their server-side environment variables are supplied.

See [docs/MIGRATION_STATUS.md](docs/MIGRATION_STATUS.md) for verified coverage and production blockers.
