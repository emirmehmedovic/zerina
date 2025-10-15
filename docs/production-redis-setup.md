# Redis Queue Setup for Production Emails

## Overview
Redis backs the BullMQ job queue used by `enqueueEmail()` in `apps/api/src/lib/email.ts`. In production we enable this queue so transactional emails (order confirmation, shipment notifications) are retried automatically and processed off the HTTP thread. In development the queue is disabled by default: `ENV.nodeEnv === 'development'` short-circuits to direct SMTP delivery.

## Provisioning Redis
- **Managed service (recommended)**
  - Providers: AWS ElastiCache, Upstash, Redis Cloud, DigitalOcean Managed Redis.
  - Choose a TLS-enabled instance with at least 100 MB memory and enable auto-backups.
- **Self-hosted**
  - Deploy Redis 6+ on a VM/container. Configure persistent storage, password auth (`requirepass`), and firewall rules (allow API servers only).
- **High availability**
  - For critical workloads use a managed offer with multi-AZ replication or configure Redis Sentinel.

## Application Configuration
1. **Environment variables** – add to production `.env` (and secrets store):
   ```bash
   REDIS_URL=redis://default:<password>@<host>:<port>
   SMTP_HOST=...
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=...
   SMTP_PASS=...
   SMTP_FROM="Marketplace <no-reply@example.com>"
   ```
   `ENV.nodeEnv` should be set to `production` so the queue bootstraps.

2. **API process** – `enqueueEmail()` automatically loads a BullMQ worker when `REDIS_URL` is present and `NODE_ENV !== 'development'`. No extra bootstrap code is required.

3. **Worker scaling**
   - Run at least one API instance with the email worker enabled. For higher throughput, spin up a dedicated worker process:
     ```bash
     NODE_ENV=production node -r ts-node/register apps/api/src/workers/email.ts
     ```
     (Create `email.ts` worker if deploying separately.)

## Deployment Checklist
- **Secrets loaded**: Confirm `REDIS_URL`, SMTP credentials, Stripe keys exist in your secret manager.
- **Networking**: Ensure outbound access from API servers to Redis port.
- **Migrations**: Run Prisma migrations before first deploy (`apps/api/prisma/migrations/`).
- **Health check**: Add a startup probe that verifies `redisConnection.ping()` succeeds.
- **Logging**: Monitor BullMQ failed jobs (consider integrating bull-board or custom alerts).

## Monitoring & Maintenance
- **Metrics**: Track queue length, processed/failed counts.
- **Retries**: Default job config (3 attempts, exponential backoff). Adjust in `apps/api/src/lib/email.ts` if needed.
- **Alerts**: Set CloudWatch/Grafana alerts for connection errors and rising failure counts.

## Local Development
- Leave `REDIS_URL` unset (or keep `NODE_ENV=development`) to disable BullMQ and avoid needing Redis locally.
- To test queue behaviour locally, start Redis and run `NODE_ENV=production` temporarily; restart the API afterwards.
