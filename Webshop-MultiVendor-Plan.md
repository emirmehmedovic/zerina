
Webshop (multi-vendor Etsy-like) — Konačni Plan Realizacije

Sažetak:
Ovaj dokument daje super-detaljan plan realizacije webshopa tipa Etsy gdje korisnici mogu kreirati svoje mini-shopove, objavljivati i upravljati proizvodima, dok master admin ima centralni pregled i kontrolu. Tehnološki stack: TypeScript, Next.js (frontend), Node.js sa Express.js (REST API), PostgreSQL, Redis, MinIO (object storage). Fokus uključuje arhitekturu, DB model, API specifikaciju, auth & autorizaciju, sigurnosnu strategiju, CI/CD, monitoring, backup i dizajn pravac — glassmorphism / bentogrids / frosted glass / clean Apple-like style.

Sadržaj

Ciljevi i opseg

Glavne funkcionalnosti (MVP + faze)

Arhitektura sistema

Baza podataka — Prisma Schema i Odnosi

API endpoints (REST) — glavne rute i primjeri

Autentikacija i autorizacija (auth middleware)

Multi-tenant shop model i ownership

Upload & media pipeline

Plaćanja, narudžbe i naplata provizija

Admin panel: funkcionalnosti i operacije

Sigurnosni plan — implementacija i postupci

DevOps / Deployment / CI-CD

Testiranje i QA

Monitoring, logging, incident response

Performanse i skaliranje

Pristupačnost i međunarodna podrška

Dizajn pravac — Glassmorphism + BentoGrid + Apple-like

Roadmap, milestonei i procjena rada

Rizici i mjere ublažavanja

Prilozi: checklist, acceptance criteria, primjer env konfiguracije

VPS-hosting prilagodbe i preporuke

1. Ciljevi i opseg

Izgraditi sigurnu, skalabilnu multi-vendor platformu gdje:

Korisnici se registruju i kreiraju mini-shopove (vendor accounts).

Vendor može upravljati proizvodima (kreiraj/uredi/obriši), inventarom, narudžbama.

Kupci pregledavaju, pretražuju i kupuju proizvode.

Master admin ima centralni panel za nadzor, moderaciju, izvještaje i upravljanje provizijama.

Faze: MVP (osnovne kupovine, vendor shop, admin pregled) → Faza 2 (recenzije, analitika, SEO, popusti) → Faza 3 (skaliranje, napredne funkcije).

2. Glavne funkcionalnosti
MVP (must-have)

User auth (email/password)

Vendor onboarding proces

Vendor dashboard: CRUD za proizvode, lista narudžbi, osnovna statistika

Product model: naslov, opis, cijena, zalihe, slike, varijante (veličina/boja), tagovi

Pretraga i pregled: kategorije, filteri, sortiranje

Korpa i checkout proces

Payment integracija (Stripe)

Admin master panel: upravljanje korisnicima, prodavnicama, proizvodima, osnovni izvještaji

Media storage (MinIO) sa CDN-om za slike

Audit logging i osnovni monitoring

Faza 2 (nice-to-have)

Recenzije i ocjene proizvoda (Reviews & ratings)

Promocije i kuponi za popust

Napredna pretraga (full-text, faceted search)

Analitika za prodavce i mjesečne isplate

2FA za administratore i prodavce

Proces za povrat novca i rješavanje sporova

Faza 3 (scale)

Detekcija prevara, ML-bazirane preporuke proizvoda

Internacionalizacija (i18n), podrška za više valuta

Mobilna aplikacija (PWA)

Integracija sa računovodstvenim API-jima

3. Arhitektura sistema

High-level (VPS-hosted):

Frontend: Next.js (TypeScript) — React-based, SSR/ISR for SEO.

Backend: Node.js (TypeScript) sa Express.js. Preporuka je organizovati kod u module (npr. routes, controllers, services, middleware) radi bolje strukture i održivosti.

DB: PostgreSQL (self-hosted), sa dnevnim backupima i WAL arhiviranjem.

Cache & queues: Redis (self-hosted) za keširanje, sesije, i BullMQ job queue.

Object storage: MinIO (self-hosted S3-kompatibilan). Ovo je besplatno, open-source rješenje koje se može vrtiti na istom VPS-u.

CDN & edge: Cloudflare ispred VPS-a za CDN, WAF i DDoS zaštitu (jako preporučeno).

Background workers: BullMQ + Redis (poslovi: procesiranje slika, slanje emailova, obrada isplata).

Search: Postgres Full-Text Search sa ekstenzijom pg_trgm za bolje pretraživanje po sličnosti.

TLS / HTTPS: Caddy (preporuka zbog automatskog SSL-a) ili Nginx sa Certbotom kao reverse proxy.

Monitoring: Prometheus + Grafana (self-hosted).

Network topology (VPS-based):

Public reverse proxy (Caddy / Nginx) na rubu mreže (edge), zadužen za TLS, gzip, keširanje.

Aplikacijski servisi (API, workers, DB, Redis, MinIO) se vrte na istom VPS-u unutar Docker kontejnera.

Koristiti internu Docker mrežu za komunikaciju između servisa; izložiti javno samo portove 80 i 443.

4. Baza podataka — Prisma Schema i Odnosi

Ovo je detaljna Prisma schema koja služi kao "jedini izvor istine" za strukturu baze. Koristiti prisma migrate dev za generisanje SQL migracija.

code
Prisma
download
content_copy
expand_less

// file: prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ENUMS for data integrity
enum UserRole {
  BUYER
  VENDOR
  ADMIN
}

enum ShopStatus {
  PENDING_APPROVAL
  ACTIVE
  SUSPENDED
  CLOSED
}

enum ProductStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
  SUSPENDED
}

enum OrderStatus {
  PENDING_PAYMENT
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

// MODELS

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  name          String?
  role          UserRole  @default(BUYER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLogin     DateTime?
  isDisabled    Boolean   @default(false)
  
  shop          Shop?          // One-to-one relation: A user can own one shop
  orders        Order[]        // A user can be a buyer on many orders
  addresses     Address[]
  auditLogs     AdminAuditLog[] @relation(name: "AdminActor")
}

model Shop {
  id            String     @id @default(cuid())
  ownerId       String     @unique
  name          String
  slug          String     @unique
  description   String?    @db.Text
  status        ShopStatus @default(PENDING_APPROVAL)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  owner         User       @relation(fields: [ownerId], references: [id])
  products      Product[]
  orders        Order[]    // Orders placed for this shop's products
  payouts       Payout[]

  @@index([status])
}

model Product {
  id           String        @id @default(cuid())
  shopId       String
  title        String
  slug         String
  description  String        @db.Text
  priceCents   Int
  currency     String        @default("EUR")
  sku          String?
  stock        Int           @default(0)
  status       ProductStatus @default(DRAFT)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  shop         Shop              @relation(fields: [shopId], references: [id], onDelete: Cascade)
  variants     ProductVariant[]
  images       ProductImage[]
  categories   ProductCategory[]
  orderItems   OrderItem[]

  @@unique([shopId, slug])
  @@index([status, createdAt])
}

model ProductVariant {
  id          String   @id @default(cuid())
  productId   String
  attributes  Json     // e.g., {"color": "Blue", "size": "M"}
  priceCents  Int      // Can override product price
  stock       Int
  sku         String?

  product     Product    @relation(fields: [productId], references: [id], onDelete: Cascade)
  orderItems  OrderItem[]
  
  @@unique([productId, sku])
}

model ProductImage {
  id         String   @id @default(cuid())
  productId  String
  storageKey String   // Path in MinIO, e.g., "products/uuid/image.webp"
  altText    String?
  position   Int      @default(0) // For ordering images

  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
}

model Category {
  id        String   @id @default(cuid())
  name      String   @unique
  parentId  String?
  
  parent       Category?         @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children     Category[]        @relation("CategoryHierarchy")
  products     ProductCategory[]
}

model ProductCategory {
  productId   String
  categoryId  String
  
  product     Product   @relation(fields: [productId], references: [id])
  category    Category  @relation(fields: [categoryId], references: [id])

  @@id([productId, categoryId])
}

model Order {
  id          String      @id @default(cuid())
  buyerId     String
  shopId      String
  totalCents  Int
  currency    String
  status      OrderStatus @default(PENDING_PAYMENT)
  shippingAddressId String?
  billingAddressId String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  buyer           User        @relation(fields: [buyerId], references: [id])
  shop            Shop        @relation(fields: [shopId], references: [id])
  items           OrderItem[]
  payments        Payment[]
  shippingAddress Address?    @relation("ShippingAddress", fields: [shippingAddressId], references: [id])
  billingAddress  Address?    @relation("BillingAddress", fields: [billingAddressId], references: [id])
  
  @@index([buyerId, createdAt])
  @@index([shopId, createdAt])
}

model OrderItem {
  id          String  @id @default(cuid())
  orderId     String
  productId   String
  variantId   String?
  priceCents  Int
  quantity    Int

  order       Order           @relation(fields: [orderId], references: [id])
  product     Product         @relation(fields: [productId], references: [id])
  variant     ProductVariant? @relation(fields: [variantId], references: [id])
}

model Address {
  id           String  @id @default(cuid())
  userId       String
  street       String
  city         String
  postalCode   String
  country      String
  isDefault    Boolean @default(false)
  
  user         User    @relation(fields: [userId], references: [id])
  shippingOrders Order[] @relation("ShippingAddress")
  billingOrders Order[]  @relation("BillingAddress")
}

model Payment {
  id                String   @id @default(cuid())
  orderId           String
  provider          String   // e.g., "stripe"
  providerPaymentId String   @unique
  status            String   // e.g., "succeeded", "failed"
  amountCents       Int
  createdAt         DateTime @default(now())

  order             Order    @relation(fields: [orderId], references: [id])
}

model Payout {
  id            String   @id @default(cuid())
  shopId        String
  amountCents   Int
  status        String   // e.g., "pending", "paid", "failed"
  initiatedAt   DateTime @default(now())
  completedAt   DateTime?

  shop          Shop     @relation(fields: [shopId], references: [id])
}

model AdminAuditLog {
  id        String   @id @default(cuid())
  actorId   String
  action    String   // e.g., "product.suspend", "user.disable"
  meta      Json?    // Context, e.g., { "productId": "...", "reason": "..." }
  createdAt DateTime @default(now())

  actor     User     @relation(name: "AdminActor", fields: [actorId], references: [id])
}
5. API endpoints (REST) — glavne rute i primjeri

Napomena: koristi verzioniranje api/v1/... i preporučenu konvenciju ID/slug.

Auth

POST /api/v1/auth/register — body: {email,password,name}. Važno: role se ne šalje, već se dodjeljuje serverski (default BUYER).

POST /api/v1/auth/login — vraća httpOnly secure cookie sa sesijom.

POST /api/v1/auth/logout

POST /api/v1/auth/forgot-password / POST /api/v1/auth/reset-password

Users & Shops

GET /api/v1/users/me — vraća podatke o trenutno ulogovanom korisniku.

POST /api/v1/shops — kreira shop (samo za korisnike koji su VENDOR).

GET /api/v1/shops/:slug — javni endpoint za prikaz shopa.

PATCH /api/v1/shops/:id — update shopa, zaštićeno, samo vlasnik.

Products

POST /api/v1/shops/:shopId/products — kreira proizvod.

GET /api/v1/products — javni endpoint za listanje i pretragu proizvoda.

GET /api/v1/products/:productSlug — javni endpoint za detalje proizvoda.

PATCH /api/v1/products/:id — update proizvoda, zaštićeno, samo vlasnik.

DELETE /api/v1/products/:id — brisanje proizvoda, zaštićeno, samo vlasnik.

Orders & Checkout

POST /api/v1/checkout — kreira order sesiju i vraća payment intent.

GET /api/v1/orders/:id — dohvaća detalje narudžbe (samo kupac ili prodavac).

POST /api/v1/webhooks/payment — Sigurnosno kritično: endpoint za primanje webhooka. Mora validirati potpis (signature) i biti idempotentan.

Admin

GET /api/v1/admin/users

GET /api/v1/admin/shops

POST /api/v1/admin/moderate/product/:id

Media

POST /api/v1/uploads/sign — vraća presigned URL za direktan upload na MinIO.

POST /api/v1/uploads/complete — finalizira upload i pokreće pozadinsku obradu.

6. Autentikacija i autorizacija (auth middleware)

Strategija: httpOnly, secure cookies session (preporučeno za web). Sigurnije je od XSS-a i pojednostavljuje state management.

Password hashing: Argon2id (preferirano) ili bcrypt sa visokim work factorom.

Roles & RBAC: Uloge = [BUYER, VENDOR, ADMIN]. Implementirati RBAC middleware koji provjerava role.

Authorization: Provjere na nivou resursa (npr. da li je korisnik vlasnik shopa) i na nivou uloge za admin rute.

Brute-force protection: Rate limit na login rute i politika zaključavanja računa.

7. Multi-tenant shop model i ownership

Model: Logički multi-tenancy (jedna baza, shop_id strani ključevi).

Kontrola pristupa se forsira na API sloju (unutar middlewarea i servisne logike).

Slugovi za shopove moraju biti jedinstveni; slugovi za proizvode moraju biti jedinstveni unutar jednog shopa.

8. Upload & media pipeline

Direktni upload na MinIO preko presigned URL-ova da se izbjegne opterećenje API servera.

Pozadinski posao (BullMQ job) se pokreće nakon uploads/complete za:

Generisanje više veličina slika (thumbnail, medium, large) pomoću libvips.

Optimizaciju u WebP format sa fallbackom na JPEG.

Skeniranje na malware (pomoću ClamAV).

Slike servirati preko CDN-a (Cloudflare) sa jakim cache zaglavljima.

9. Plaćanja, narudžbe i naplata provizija

Payment provider: Stripe (preporuka zbog Stripe Connect za multi-vendor isplate).

Tok: Checkout kreira order -> kreira se Stripe Payment Intent -> na payment.succeeded webhooku se order označi kao plaćen, kreira se zapis o proviziji.

Provizija platforme: Koristiti Stripe Connect sa "application fees" modelom.

10. Admin panel: funkcionalnosti i operacije

Dashboard: ključni metrike (GMV, aktivni prodavci, nove registracije).

Upravljanje korisnicima i shopovima: suspendovanje, banovanje, odobravanje.

Moderacija proizvoda: pregled prijava, promjena statusa proizvoda.

Finansije: redovi za isplate, postavke provizija, izvještaji o prihodima.

Audit logovi: praćenje svih administratorskih akcija.

11. Sigurnosni plan — implementacija i postupci

Transport: Forsirati HTTPS svugdje (HSTS).

Headers: Koristiti helmet za Express (CSP, X-Frame-Options, itd.).

Input validation: Koristiti Zod ili Joi unutar Express middleware-a za validaciju svih dolaznih podataka.

SQL Injection: Spriječeno korištenjem Prisme kao ORM-a.

XSS: Sanitizacija korisničkog unosa (posebno za opise) koristeći DOMPurify na serverskoj strani.

CSRF: Koristiti csurf middleware za Express ili implementirati double submit cookie pattern.

CORS: Ograničiti origin samo na frontend domenu.

12. DevOps / Deployment / CI-CD

Repo: Monorepo sa Turborepo (preporučeno).

CI: GitHub Actions pipeline:

Na PR: install, lint, typecheck, unit test, build.

Na merge u main: build Docker image, push u registry, deploy.

Strategija za migracije baze (Database Migration Strategy):

U CI/CD pipeline-u, nakon builda, pokrenuti poseban korak koji izvršava prisma migrate deploy.

Tek nakon uspješne migracije, nastaviti sa deployom nove verzije aplikacije.

Izbjegavati migracije koje lome staru verziju aplikacije (npr. brisanje kolone) kako bi se osigurao zero-downtime deployment.

Deploys: Rolling deploys, health checks.

13. Testiranje i QA

Unit testovi (Jest) za servisnu logiku.

Integracioni testovi za API endpoint-e (supertest).

E2E testovi (Playwright) za ključne korisničke putanje.

Security testovi: Skeniranje zavisnosti (Snyk) i SAST alati u pipelineu.

14. Monitoring, logging, incident response

Logovi: Centralizovano logovanje (Loki + Grafana je dobra self-hosted opcija).

Metrike: Prometheus + Grafana.

Alerting: Grafana Alerting integrisan sa Slack/Email.

15. Performanse i skaliranje

Keširanje: Redis za sesije, liste proizvoda i druge često dohvaćane podatke.

CDN za statičke fajlove i slike.

Baza: Read replicas za izvještaje, particionisanje orders tabele po datumu.

Horizontalno skaliranje API-ja iza load balancera.

16. Pristupačnost i međunarodna podrška

WCAG 2.1 AA kao osnovni cilj.

i18n: koristiti next-intl ili sličnu biblioteku.

Multi-currency i formatiranje brojeva i datuma prema lokalizaciji.

17. Dizajn pravac — Glassmorphism + BentoGrid + Apple-like

(Ovaj dio ostaje isti kao u originalnom planu, jer je odlično definisan)

18. Roadmap, milestonei i procjena rada

(Procjena ostaje ista, pretpostavka tim od ~3 inženjera)

Sprint 0 — Plan & prototip (2 tjedna)

Sprint 1 — Auth, user, shops (3 tjedna)

Sprint 2 — Products CRUD, uploads (3 tjedna)

Sprint 3 — Cart/Checkout + Payments (3 tjedna)

Sprint 4 — Admin panel + Moderation (3 tjedna)

Sprint 5 — Search, Performance, QA (3 tjedna)

MVP release & polish (2 tjedna)
Total: ~18 sedmica do MVP-a.

19. Rizici i mjere ublažavanja

Kompleksnost plaćanja/regulativa — mitigacija: Stripe Connect.

Zloupotreba fajlova / malware — mitigacija: skeniranje uplodanih fajlova, rate limits.

Prevare prodavaca — mitigacija: KYC, monitoring transakcija.

Usko grlo u performansama — mitigacija: keširanje, optimizacija upita.

20. Prilozi: checklist, acceptance criteria, primjer env konfiguracije
Acceptance checklist (MVP)

Korisnik se može registrovati i ulogovati.

Vendor može kreirati shop i dodati proizvod sa slikama.

Proizvod je javno vidljiv i pretraživ.

Košarica i checkout proces rezultiraju uspješnom naplatom i kreiranjem narudžbe.

Admin može pregledati korisnike/shopove/proizvode i moderirati ih.

Osnovne sigurnosne kontrole su na mjestu (HTTPS, headers, CSRF).

Example .env (imena varijabli)
code
Code
download
content_copy
expand_less
IGNORE_WHEN_COPYING_START
IGNORE_WHEN_COPYING_END
NODE_ENV=production
DATABASE_URL=postgres://user:pass@host:5432/db
REDIS_URL=redis://:password@host:6379
SESSION_SECRET= // Za potpisivanje session cookie-ja
MINIO_ENDPOINT=http://minio:9000 // U Dockeru se koristi ime servisa
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
MINIO_BUCKET=my-bucket
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET= // Za verifikaciju webhooka
SENTRY_DSN=
21. VPS-hosting prilagodbe i preporuke (sumirano)

Backups (kritično): Automatizovani backupi na odvojeni VPS ili eksterni servis.

Logički backup (dnevni): Koristiti pg_dump putem cron joba za dnevni dump baze.

Point-in-Time Recovery (PITR): Postaviti pgBackRest ili WAL-G koji arhiviraju WAL logove na MinIO za mogućnost oporavka u bilo koju sekundu.

Upload & media pipeline:

Koristiti presigned URL-ove za direktan upload na MinIO.

Skenirati fajlove sa ClamAV kao dio pozadinskog posla.

DevOps / Deployment:

Koristiti Docker i docker-compose za jedan VPS.

Implementirati zero-downtime deployment strategiju.

Kontejnerizacija: Sve servise (API, DB, Redis, MinIO) vrtiti u odvojenim kontejnerima koristeći docker-compose za jednostavnu orkestraciju na jednom VPS-u.