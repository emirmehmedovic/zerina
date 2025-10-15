# Vendor Onboarding Hardening Plan

## Legend
- [ ] Pending task
- [x] Completed task (~~task name~~)

## Phase 1: Data & Backend Foundations
- [x] ~~Define `VendorApplication` Prisma model and migration (fields: `id`, `userId`, `status`, `legalName`, `country`, `address`, `contactPhone`, `documents`, `submittedAt`, `reviewedAt`, `reviewedById`, `notes`, `rejectionReason`).~~
- [x] ~~Backfill migration for existing vendors (auto-create approved applications) to maintain consistency.~~
- [x] ~~Update Prisma Client generation and regenerate types.~~

## Phase 2: Vendor Upgrade Flow Guarding
- [x] ~~Replace `POST /api/v1/vendor/upgrade` logic with creation of `VendorApplication` in `PENDING` status and guard against duplicate submissions.~~
- [x] ~~Prevent auto role escalation until application status is `APPROVED`.~~
- [x] ~~Introduce rate limiting middleware for `POST /api/v1/vendor/upgrade` (per-IP + per-user) and surface proper error messages.~~
- [x] ~~Integrate captcha verification in frontend submit call (pass token to API and validate server-side).~~

## Phase 3: Shop Creation & Activation Controls
- [x] ~~Enforce `Shop.status = PENDING_APPROVAL` until admin approval; block `POST /api/v1/shops` unless related application is `APPROVED`.~~
- [x] ~~Add automatic soft limits (e.g., max 5 products) for newly approved vendors until trust score increases.~~
- [x] ~~Wire Stripe Connect onboarding to trigger only after shop is `ACTIVE`; block status retrieval until then.~~

## Phase 4: Admin Review Experience
- [x] ~~Build admin routes for listing/filtering/updating `VendorApplication` entries (approve/reject, add notes).~~
- [x] ~~Log admin actions in `AdminAuditLog` with metadata about decision and reason.~~
- [x] ~~Add email notifications to applicants on status changes (approved, rejected, need-more-info).~~

## Phase 5: Identity Verification & Payments Guardrails
- [x] ~~Integrate KYC/KYB provider SDK (e.g., Veriff/Stripe Identity) and store verification status on application (mock provider baseline).~~
- [x] ~~Enforce verified email + phone prior to submission (send verification codes if missing).~~
- [ ] Support optional security deposit payment flow prior to final approval. *(deferred; `SECURITY_DEPOSIT_ENABLED=false` for now)*

## Phase 6: Frontend Vendor Onboarding UX
- [ ] Implement dashboard wizard (steps: profile details, documents upload, confirmations).
- [ ] Display application status tracker with next actions, document checklists, and support contact.
- [ ] Surface rate-limit/captcha errors gracefully, prompting user retry.

## Phase 7: Monitoring, Anti-spam & Maintenance
- [ ] Implement anomaly detection metrics (failed applications per IP, rapid shop creations) and alerts.
- [ ] Add content moderation pipeline for shop/product descriptions (keyword filter + manual review queue).
- [ ] Enforce minimal shop profile completeness before allowing product publishing.
- [ ] Schedule periodic Stripe account health checks (charges/payout status) with auto-suspension rules.

---

Progress is tracked by toggling checkboxes. Strikethrough the task title upon completion to keep plan tidy.
