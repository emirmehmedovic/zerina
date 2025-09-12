# Webshop (Multi-Vendor, Etsy-like)

This repository will host a modern multi-vendor ecommerce platform. It follows the high-level specification in `Webshop-MultiVendor-Plan.md` and tracks work in `PROJECT_PLAN.md`.

- Frontend: Next.js (TypeScript), Tailwind CSS
- Backend: Node.js (TypeScript), Express.js, Prisma
- Data: PostgreSQL, Redis
- Storage: MinIO (S3-compatible)
- Payments: Stripe (Connect)

## Repo Status

The project is in initialization. See `PROJECT_PLAN.md` for the actionable checklist.

## Key Documents

- High-level plan/spec: `Webshop-MultiVendor-Plan.md`
- Design direction and Tailwind tokens: `dizajn.md`
- Database info and connection: `baza.md`
- Actionable plan with checkboxes: `PROJECT_PLAN.md`

## Structure (planned)

- `apps/web/` — Next.js frontend
- `apps/api/` — Express API and workers
- `packages/*` — shared configs, ui, tsconfig, eslint config (optional)

## Getting Started (planned)

1. Choose package manager (pnpm recommended).
2. Initialize monorepo and TypeScript configs.
3. Add Prisma schema (see `Webshop-MultiVendor-Plan.md`) and run initial migration against your Postgres (`baza.md`).
4. Bring up local services (Postgres, Redis, MinIO) via Docker Compose.
5. Implement Auth -> Shops -> Products -> Uploads -> Checkout -> Admin as per `PROJECT_PLAN.md`.

## Safety & Ops

- Use `.env.example` to declare required variables.
- Never commit real secrets.
- Add CI to enforce lint, typecheck, tests.

## Contributing

Open PRs against `main`. CI should pass: install, lint, typecheck, unit tests, build.
