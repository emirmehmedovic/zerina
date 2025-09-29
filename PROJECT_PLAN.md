# Webshop Multi-Vendor — Actionable Project Plan
## 9) Vendor Dashboard (MVP)

- [x] Vendor API: `/api/v1/vendor/overview`, `/api/v1/vendor/products`
- [x] Vendor Overview page (`/dashboard`): stats (products, published, draft, low stock, orders), quick links
- [x] Vendor Products page (`/dashboard/products`): filters (q/status/low stock), table, inline toggle, bulk publish/draft/delete, sticky bulk toolbar, CSV export
- [x] Vendor Orders page (`/dashboard/orders`) — per-shop view with status transitions, date filters, quick search, CSV export
- [x] Vendor layout + guard (`/dashboard/layout.tsx`)
- [x] My Addresses page (`/dashboard/addresses`) — list/add/delete

### 9.a) Vendor Analytics (added)

- [x] Main Analytics page (`/dashboard/analytics`) — links to specialized analytics, CSV export
- [x] Per-Product Analytics page (`/dashboard/analytics/products/[id]`) — KPIs, time series, seasonal, projections, CSV
- [x] Product Analytics list (`/dashboard/analytics/products`) — sortable table, search, growth, CSV
- [x] Product Comparison (`/dashboard/analytics/products/compare`) — side-by-side metrics + chart, CSV
- [x] Projections analytics (`/dashboard/analytics/projections`) — 30/90/365 days forecast
- [x] Seasonal analytics (`/dashboard/analytics/seasonal`) — monthly and DOW aggregations


This file turns the high-level plan in `Webshop-MultiVendor-Plan.md` into bitesize, trackable tasks you can check off as you complete them. Use it as the single source of truth for delivery.

Legend:
- [ ] pending
- [x] done
- [-] skipped/not-applicable

Related docs:
- Design direction: `dizajn.md`
- Database details/connection: `baza.md`
- High-level plan/spec: `Webshop-MultiVendor-Plan.md`

---

## Global Product Guidelines

- [x] All UI copy must be in English (en-US)

---

## 0) Repo Bootstrapping

- [x] Initialize git repo and first commit
- [x] Create Node.js monorepo layout (Turborepo optional)
- [x] Add package manager settings (npm)
- [x] Configure TypeScript base config (`tsconfig.base.json`)
- [x] Configure ESLint + Prettier
- [ ] Configure Husky + lint-staged (optional)
- [x] Create `.env.example` from `Webshop-MultiVendor-Plan.md` variables
- [ ] Add basic CI (install, lint, typecheck, build)

## 1) Infrastructure & Dev Environments

- [ ] Docker Compose: Postgres, Redis, MinIO (local)
- [x] Seed scripts for baseline data (categories, demo users)
- [x] Prisma setup and first migration from schema in `Webshop-MultiVendor-Plan.md`
- [x] Healthcheck endpoints for API
- [x] Local .env file for API (`apps/api/.env`)
- [x] Local .env file for Web (`apps/web/.env.local`)

## 2) Auth & Accounts (MVP)

- [x] Password hashing (Argon2id preferred)
- [x] Sessions via httpOnly secure cookie
- [x] Rate-limit login
- [x] Register (POST `/api/v1/auth/register`)
- [x] Login (POST `/api/v1/auth/login`)
- [x] Logout (POST `/api/v1/auth/logout`)
- [ ] Forgot/Reset password
  - [x] API endpoints: `POST /api/v1/auth/forgot`, `POST /api/v1/auth/reset`
  - [x] Web pages: `/forgot`, `/reset`
- [x] `GET /api/v1/users/me`
- [x] RBAC middleware: BUYER, VENDOR, ADMIN

## 3) Shops (Vendor Onboarding)

- [x] Create Shop (POST `/api/v1/shops`) — vendor only
- [x] Get Shop by slug (GET `/api/v1/shops/:slug`)
- [x] Update Shop (PATCH `/api/v1/shops/:id`) — owner only
- [x] Admin approval flow for shops (status)

## 4) Products (CRUD + Search Basics)

- [x] Create Product (POST `/api/v1/shops/:shopId/products`)
- [x] Update Product (PATCH `/api/v1/products/:id`)
- [x] Delete Product (DELETE `/api/v1/products/:id`)
- [x] Public list/search (GET `/api/v1/products`)
- [x] Public details (GET `/api/v1/products/:productSlug`) — legacy `/slug/:slug` kept temporarily
- [x] Variants model and endpoints
- [x] Categories and product-category join
 - [x] Frontend: Category tag selector (new/edit), Variants manager (edit)
 - [x] Product detail: "price from" when variants exist, variant selector

## 5) Media Uploads Pipeline

- [ ] Presigned upload (POST `/api/v1/uploads/sign`)
- [ ] Upload complete (POST `/api/v1/uploads/complete`) => enqueue job
- [ ] Worker: image processing (libvips), WebP, sizes, malware scan
- [ ] Serve via CDN and set cache headers
 - [x] Dev-only direct upload endpoint (POST `/api/v1/uploads`) and static serving (`/uploads`) — local disk
 - [x] Product images: reordering, cover image, multi-upload (frontend)

## 6) Cart, Checkout, Payments (Stripe)

- [x] Cart model (frontend state + server validation)
- [x] Cart (client): provider, header mini-cart, cart page
- [ ] Checkout session (POST `/api/v1/checkout`)
- [ ] Order creation and status transitions
- [ ] Webhook `/api/v1/webhooks/payment` with signature validation and idempotency
- [ ] Stripe Connect application fees for multi-vendor payouts
 - [x] Checkout pages: `/checkout` (addresses), `/checkout/review` (grouped by shop), `/checkout/confirmation`
 - [x] API: `/api/v1/checkout/validate` (stock/pricing), `/api/v1/checkout/draft` (per-shop orders)
 - [x] User addresses API/UI: save and select saved addresses

## 7) Admin Panel (MVP)

- [ ] Admin auth hardening (2FA optional in MVP+1)
 - [ ] Users list and moderation
 - [x] Shops list and approvals
 - [x] Products moderation (publish/draft/delete)
 - [x] Basic metrics dashboard (overview counts, low-stock link)
 - [ ] Admin audit logs
 - [x] Create admin accounts (admin creates other admins)
 - [x] Admin Overview: low-stock link to inventory with filters

## 8) Security Baseline

- [ ] Force HTTPS (in prod, proxy headers)
- [x] Helmet headers on API
- [x] Input validation with Zod/Joi
- [x] CSRF protection (cookies pattern)
- [x] CORS allowlist to frontend domain
- [x] Brute-force protection and account lock policy (basic lockout)

## 9) DevOps / CI-CD

- [ ] GitHub Actions: install, lint, typecheck, unit tests, build
- [ ] Build Docker images (api, web) and push to registry
- [ ] prisma migrate deploy in pipeline pre-deploy step
- [ ] Zero-downtime deploy checks

## 10) Testing Strategy

- [ ] Unit tests (Jest) for services
- [ ] API integration tests (supertest)
- [ ] E2E (Playwright) key flows
- [ ] Security scanning (Snyk) and SAST

## 11) Monitoring & Logging

- [ ] Centralized logs (Loki or hosted alt.)
- [ ] Metrics (Prometheus/Grafana or hosted)
- [ ] Alerting to Slack/Email

## 12) Frontend Web (Next.js + Tailwind)

- [x] Set up Next.js (TypeScript)
- [x] Tailwind config using tokens from `dizajn.md`
- [x] Layout + Navigation (BentoGrid accents)
- [x] Public pages: Home, Category listing, Product details, Shop page
- [x] Auth pages: Login, Register
- [x] Auth page: Reset password
- [x] Vendor dashboard: Products CRUD (list/create/edit/delete, images)
  - [x] Orders list
  - [x] Basic stats
 - [x] Admin area: Dashboard with Inventory, Shops approvals, Create product, Create admin

## 13) Nice-to-have (Phase 2)

- [ ] Reviews & ratings
- [ ] Coupons and promotions
- [ ] Advanced search (full-text + facets)
- [ ] Vendor analytics & monthly payouts UX
- [ ] 2FA for admins/vendors
- [ ] Refunds and dispute flows

## 14) Scale & Polish (Phase 3)

- [ ] Fraud detection hooks
- [ ] Recommendations (ML light)
- [ ] i18n and multi-currency
- [ ] PWA polish
- [ ] Accounting integrations

---

## Milestones (from plan)

- [ ] Sprint 0 — Plan & prototype
- [ ] Sprint 1 — Auth, user, shops
- [ ] Sprint 2 — Products CRUD, uploads
- [ ] Sprint 3 — Cart/Checkout + Payments
- [ ] Sprint 4 — Admin panel + Moderation
- [ ] Sprint 5 — Search, Performance, QA
- [ ] MVP release & polish

---

## Today’s Suggested Next Steps

- [x] Confirm package manager (npm)
- [x] Approve monorepo structure `apps/web` and `apps/api`
- [x] Initialize git and commit scaffolding
- [x] Generate Prisma from schema and run first migration against Postgres (`baza.md`)
- [x] Bootstrap Next.js + Tailwind with tokens from `dizajn.md`
