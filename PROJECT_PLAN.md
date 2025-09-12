# Webshop Multi-Vendor — Actionable Project Plan

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

## 0) Repo Bootstrapping

- [ ] Initialize git repo and first commit
- [ ] Create Node.js monorepo layout (Turborepo optional)
- [ ] Add package manager settings (pnpm or npm)
- [ ] Configure TypeScript base config (`tsconfig.base.json`)
- [ ] Configure ESLint + Prettier
- [ ] Configure Husky + lint-staged (optional)
- [ ] Create `.env.example` from `Webshop-MultiVendor-Plan.md` variables
- [ ] Add basic CI (install, lint, typecheck, build)

## 1) Infrastructure & Dev Environments

- [ ] Docker Compose: Postgres, Redis, MinIO (local)
- [ ] Seed scripts for baseline data (categories, demo users)
- [ ] Prisma setup and first migration from schema in `Webshop-MultiVendor-Plan.md`
- [ ] Healthcheck endpoints for API
- [ ] Local .env files (`apps/api/.env`, `apps/web/.env.local`)

## 2) Auth & Accounts (MVP)

- [ ] Password hashing (Argon2id preferred)
- [ ] Sessions via httpOnly secure cookie
- [ ] Rate-limit login
- [ ] Register (POST `/api/v1/auth/register`)
- [ ] Login (POST `/api/v1/auth/login`)
- [ ] Logout (POST `/api/v1/auth/logout`)
- [ ] Forgot/Reset password
- [ ] `GET /api/v1/users/me`
- [ ] RBAC middleware: BUYER, VENDOR, ADMIN

## 3) Shops (Vendor Onboarding)

- [ ] Create Shop (POST `/api/v1/shops`) — vendor only
- [ ] Get Shop by slug (GET `/api/v1/shops/:slug`)
- [ ] Update Shop (PATCH `/api/v1/shops/:id`) — owner only
- [ ] Admin approval flow for shops (status)

## 4) Products (CRUD + Search Basics)

- [ ] Create Product (POST `/api/v1/shops/:shopId/products`)
- [ ] Update Product (PATCH `/api/v1/products/:id`)
- [ ] Delete Product (DELETE `/api/v1/products/:id`)
- [ ] Public list/search (GET `/api/v1/products`)
- [ ] Public details (GET `/api/v1/products/:productSlug`)
- [ ] Variants model and endpoints
- [ ] Categories and product-category join

## 5) Media Uploads Pipeline

- [ ] Presigned upload (POST `/api/v1/uploads/sign`)
- [ ] Upload complete (POST `/api/v1/uploads/complete`) => enqueue job
- [ ] Worker: image processing (libvips), WebP, sizes, malware scan
- [ ] Serve via CDN and set cache headers

## 6) Cart, Checkout, Payments (Stripe)

- [ ] Cart model (frontend state + server validation)
- [ ] Checkout session (POST `/api/v1/checkout`)
- [ ] Order creation and status transitions
- [ ] Webhook `/api/v1/webhooks/payment` with signature validation and idempotency
- [ ] Stripe Connect application fees for multi-vendor payouts

## 7) Admin Panel (MVP)

- [ ] Admin auth hardening (2FA optional in MVP+1)
- [ ] Users list and moderation
- [ ] Shops list and approvals
- [ ] Products moderation (suspend/archive)
- [ ] Basic metrics dashboard
- [ ] Admin audit logs

## 8) Security Baseline

- [ ] Force HTTPS (in prod, proxy headers)
- [ ] Helmet headers on API
- [ ] Input validation with Zod/Joi
- [ ] CSRF protection (cookies pattern)
- [ ] CORS allowlist to frontend domain
- [ ] Brute-force protection and account lock policy

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

- [ ] Set up Next.js (TypeScript)
- [ ] Tailwind config using tokens from `dizajn.md`
- [ ] Layout + Navigation (BentoGrid accents)
- [ ] Public pages: Home, Category listing, Product details, Shop page
- [ ] Auth pages: Login, Register, Reset password
- [ ] Vendor dashboard: Products CRUD, Orders list, Basic stats
- [ ] Admin area: Links to admin functions (can be separate app later)

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

- [ ] Confirm package manager (pnpm or npm)
- [ ] Approve monorepo structure `apps/web` and `apps/api`
- [ ] Initialize git and commit scaffolding
- [ ] Generate Prisma from schema and run first migration against Postgres (`baza.md`)
- [ ] Bootstrap Next.js + Tailwind with tokens from `dizajn.md`
