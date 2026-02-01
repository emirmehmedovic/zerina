# Stripe Standard Connect - Setup Guide

Ova aplikacija sada koristi **Stripe Standard Connect** (OAuth model) umjesto Express Connect. Ovaj model je kompatibilan sa svim tržištima uključujući UAE.

---

## 1. Kako radi Standard Connect?

U Standard Connect modelu:
- Vendori koriste svoje postojeće Stripe račune
- Povezivanje se vrši preko OAuth flow-a (kao "Login with Google")
- Kupci plaćaju direktno platformi (tvom Stripe računu)
- Ti radiš transfer na vendor račune kroz Stripe Transfers API
- Platform fee automatski ostaje tebi

---

## 2. Backend izmjene (✅ Završeno)

### Dodato u `apps/api/src/env.ts`:
```typescript
stripeClientId: process.env.STRIPE_CLIENT_ID,
stripeRedirectUri: process.env.STRIPE_REDIRECT_URI ?? 'http://localhost:3000/stripe/callback',
```

### Nova ruta: `POST /api/v1/vendor/stripe/connect`
- Generiše Stripe OAuth authorization URL
- Koristi JWT signed state token za CSRF zaštitu
- Vraća `{ url }` na koji frontend redirectuje vendora

### Nova ruta: `POST /api/v1/vendor/stripe/oauth/callback`
- Prima `code` i `state` od frontend-a
- Verifikuje state token
- Mijenja code za `stripe_user_id`
- Snima `stripe_user_id` u `shop.stripeAccountId`
- Vraća status povezanosti

### Ažurirana ruta: `POST /api/v1/vendor/stripe/dashboard-link`
- Sada vraća `https://dashboard.stripe.com/` (Standard account dashboard)
- Ne koristi više `createLoginLink` (koji je samo za Express)

---

## 3. Frontend izmjene (✅ Završeno)

### Nova stranica: `/stripe/callback`
- Lokacija: `apps/web/src/app/stripe/callback/page.tsx`
- Hvata `code`, `state`, i `error` parametre od Stripe-a
- Poziva backend callback endpoint
- Prikazuje success/error status
- Auto-redirectuje na payment settings nakon 2s

### Ažurirano: `/dashboard/settings/payments`
- Tekst promijenjen sa "Stripe Express" → "Stripe"
- OAuth flow ostaje isti (klikni dugme → redirectuj)

---

## 4. Environment Variables

Dodaj ove varijable u `.env` fajl:

### Development (.env)
```bash
# Postojeće Stripe varijable
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PLATFORM_FEE_PERCENT=10

# NOVE varijable za OAuth
STRIPE_CLIENT_ID=ca_...
STRIPE_REDIRECT_URI=http://localhost:3000/stripe/callback

# Backend i Frontend URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:4000
```

### Production (.env.production)
```bash
# Stripe LIVE keys
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PLATFORM_FEE_PERCENT=10

# OAuth credentials (LIVE mode)
STRIPE_CLIENT_ID=ca_...
STRIPE_REDIRECT_URI=https://handmadelovefilled.com/stripe/callback

# Production URLs
FRONTEND_URL=https://handmadelovefilled.com
BACKEND_URL=https://api.handmadelovefilled.com
```

---

## 5. Stripe Dashboard - Obavezna podešavanja

### Korak 1: Aktiviraj Connect
1. Idi na https://dashboard.stripe.com/settings/connect
2. Klikni "Get started" da aktiviraš Connect

### Korak 2: Konfiguriši OAuth
1. Idi na **Connect → Settings → OAuth**
2. Klikni na "Add redirect URL"
3. Dodaj:
   - **Test mode**: `http://localhost:3000/stripe/callback`
   - **Live mode**: `https://handmadelovefilled.com/stripe/callback`

### Korak 3: Dobij Client ID
1. Ostani na istoj stranici (OAuth settings)
2. Kopiraj **Client ID** (počinje sa `ca_`)
3. Imaš 2 Client ID-a:
   - **Test mode** Client ID → koristi u development
   - **Live mode** Client ID → koristi u production
4. Stavi odgovarajući ID u env varijablu `STRIPE_CLIENT_ID`

### Korak 4: Konfiguriši Webhooks
1. Idi na **Developers → Webhooks**
2. **Test mode** webhook:
   - Endpoint URL: `http://localhost:4000/api/v1/stripe/webhook` (ili koristi Stripe CLI)
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `account.updated`
   - Kopiraj **Signing secret** (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`

3. **Live mode** webhook:
   - Endpoint URL: `https://api.handmadelovefilled.com/api/v1/stripe/webhook`
   - Isti eventi kao gore
   - Kopiraj **Signing secret** za production

### Korak 5: Platform Fee (opcionalno)
1. Idi na **Connect → Settings**
2. Podesi default application fee percentage ako želiš
3. Ili kontroliši kroz `STRIPE_PLATFORM_FEE_PERCENT` env varijablu

---

## 6. Testiranje (Lokalno)

### Test 1: OAuth flow
1. Pokreni backend: `cd apps/api && npm run dev`
2. Pokreni frontend: `cd apps/web && npm run dev`
3. Loguj se kao vendor
4. Idi na `/dashboard/settings/payments`
5. Klikni "Connect with Stripe"
6. Trebao bi da te odvede na Stripe OAuth stranicu
7. Koristi Stripe test credentials ili kreiraj test account
8. Stripe će te redirectovati na `/stripe/callback?code=...&state=...`
9. Trebao bi vidjeti "Connection successful!"
10. Auto-redirect na payment settings gdje status pokazuje "Connected"

### Test 2: Webhook sa Stripe CLI
```bash
# U posebnom terminalu
stripe listen --forward-to localhost:4000/api/v1/stripe/webhook

# Kopiraj webhook secret (whsec_...) u .env kao STRIPE_WEBHOOK_SECRET
# Restartuj backend
```

### Test 3: Checkout flow
1. Dodaj proizvod vendora u korpu
2. Napravi checkout
3. Uplati sa test karticom: `4242 4242 4242 4242`
4. Provjeri webhook log - trebao bi da vidiš `payment_intent.succeeded`
5. Order status trebao bi biti `PROCESSING`

---

## 7. Deploy na Production

### Pre-deploy checklist:
- [ ] `STRIPE_SECRET_KEY` = live key (`sk_live_...`)
- [ ] `STRIPE_CLIENT_ID` = live mode Client ID
- [ ] `STRIPE_REDIRECT_URI` = production callback URL
- [ ] `STRIPE_WEBHOOK_SECRET` = live webhook signing secret
- [ ] Stripe Dashboard → OAuth redirect URLs → dodaj production URL
- [ ] Stripe Dashboard → Webhooks → konfiguriši production endpoint

### Deploy sekvenca:
1. Deploy backend sa novim env varijablama
2. Provjeri da backend radi: `GET /health` ili bilo koja ruta
3. Deploy frontend
4. Provjeri callback stranicu: visit `/stripe/callback` (trebalo bi da vidiš error jer nema code-a, ali stranica se učitava)
5. Test OAuth flow sa test vendor accountom

---

## 8. Migracija postojećih Express accounta (Ako ih ima)

Ako već imaš vendore sa Express accountima, oni će morati da se ponovo povežu:

### Opcionalno: Ručna migracija
```sql
-- Ako želiš da obrišeš stare Express account IDove
UPDATE shops
SET stripeAccountId = NULL,
    stripeOnboardedAt = NULL,
    stripeDetailsSubmitted = false,
    stripeChargesEnabled = false,
    stripePayoutsEnabled = false
WHERE stripeAccountId IS NOT NULL;
```

### Notify postojeće vendore:
Pošalji email svim vendorima sa Express accountima:
> "We've upgraded to Stripe Standard Connect for better global support. Please reconnect your Stripe account by visiting Payment Settings."

---

## 9. Troubleshooting

### Problem: "stripe_oauth_not_configured"
**Uzrok**: `STRIPE_CLIENT_ID` nije postavljen
**Rješenje**: Dodaj `STRIPE_CLIENT_ID` u `.env` i restartuj backend

### Problem: "invalid_state_token"
**Uzrok**: State token expired (15min limit) ili izmjenjen `SESSION_SECRET`
**Rješenje**: Vendor neka ponovo klikne "Connect with Stripe"

### Problem: "no_stripe_user_id" u callback-u
**Uzrok**: Stripe OAuth token exchange nije vratio `stripe_user_id`
**Rješenje**: Provjeri da li je `STRIPE_CLIENT_ID` ispravan i da li Stripe OAuth radi

### Problem: OAuth error "redirect_uri_mismatch"
**Uzrok**: Redirect URI u env varijabli ne odgovara onom u Stripe Dashboard-u
**Rješenje**:
1. Provjeri `STRIPE_REDIRECT_URI` u .env
2. Idi na Stripe Dashboard → Connect → OAuth
3. Dodaj tačan URL

### Problem: Vendor se povezao, ali `charges_enabled = false`
**Uzrok**: Vendor nije završio verifikaciju na Stripe-u
**Rješenje**: Vendor treba da se loguje na svoj Stripe Dashboard i dovrši onboarding

---

## 10. Razlike: Express vs Standard

| Feature | Express Connect | Standard Connect (OAuth) |
|---------|----------------|--------------------------|
| **Account Creation** | Platform kreira account za vendora | Vendor koristi postojeći Stripe account |
| **Onboarding** | Platform kontroliše onboarding | Vendor ima svoj Stripe dashboard |
| **Dashboard Access** | Ograničen Express dashboard | Potpun pristup Stripe dashboardu |
| **UAE Support** | ❌ Ne radi (`card_payments` capability) | ✅ Radi globalno |
| **API Endpoint** | `stripe.accounts.create({ type: 'express' })` | `stripe.oauth.authorizeUrl()` |
| **Payout Control** | Platform mora da kreira login link | Vendor sam upravlja |

---

## 11. Dodatni resursi

- [Stripe Standard Connect Docs](https://stripe.com/docs/connect/standard-accounts)
- [Stripe OAuth Reference](https://stripe.com/docs/connect/oauth-reference)
- [Stripe Testing](https://stripe.com/docs/testing)

---

✅ **Standard Connect je sada u potpunosti implementiran i spreman za produkciju!**
