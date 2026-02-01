# 🚀 Production Stripe Setup Checklist

Ovaj dokument sadrži **sve korake** koje trebaš da pratiš da bi Stripe Standard Connect radio na produkciji.

---

## ✅ Checklist - Odrađuj korak po korak

- [ ] 1. Aktivirao sam Stripe Connect
- [ ] 2. Konfigurisao sam OAuth redirect URL
- [ ] 3. Kopirao sam Client ID
- [ ] 4. Kreirao sam Production Webhook
- [ ] 5. Kopirao sam Webhook Secret
- [ ] 6. Ažurirao sam `.env` fajl
- [ ] 7. Restartovao sam backend server
- [ ] 8. Testirao sam OAuth flow
- [ ] 9. Testirao sam checkout i payment

---

## 📋 Korak 1: Aktiviraj Stripe Connect

### 1.1 Otvori Stripe Dashboard
```
https://dashboard.stripe.com/settings/connect
```

### 1.2 Ako vidiš "Get started" dugme
- Klikni **"Get started"**
- Slijedi wizard za aktivaciju Connect-a
- Odaberi **"Platform or marketplace"** kao tip business-a

### 1.3 Ako Connect već postoji
- Nastavi na korak 2

---

## 📋 Korak 2: Konfiguriši OAuth

### 2.1 Idi na OAuth settings
```
https://dashboard.stripe.com/settings/connect/oauth
```

### 2.2 Prebaci se na LIVE MODE
- **VAŽNO:** Gore desno, provjeri da si u **"Live mode"** (ne "Test mode")
- Ako piše "Viewing test data", klikni i prebaci na **"View live data"**

### 2.3 Dodaj Redirect URL
1. Scroll dole do sekcije **"Redirects"**
2. Klikni **"+ Add redirect URL"**
3. Unesi tačno ovaj URL:
   ```
   https://handmadelovefilled.com/stripe/callback
   ```
4. Klikni **"Add"**

### 2.4 Kopiraj Client ID
1. Na istoj stranici, gore, pronaći ćeš **"Live mode client ID"**
2. Klikni **"Copy"** ili ručno kopiraj (počinje sa `ca_`)
3. **Sačuvaj ga negdje** - trebaće ti za `.env` fajl

**Primjer:**
```
ca_Nfh4MBtTl123456789abcdef
```

---

## 📋 Korak 3: Kreiraj Production Webhook

### 3.1 Idi na Webhooks
```
https://dashboard.stripe.com/webhooks
```

### 3.2 Provjeri da si u LIVE MODE
- Gore desno **"Viewing live data"** - mora biti live, ne test!

### 3.3 Dodaj Endpoint
1. Klikni **"+ Add endpoint"** (gore desno)
2. **Endpoint URL:** unesi tačno:
   ```
   https://handmadelovefilled.com/api/v1/stripe/webhook
   ```

3. **Description (opcionalno):**
   ```
   Production webhook for marketplace
   ```

4. **Listen to:** odaberi **"Events on your account"**

5. **Select events to listen to:**
   - Klikni **"+ Select events"**
   - U search box-u traži i odaberi ove 3 eventa:
     - ✅ `payment_intent.succeeded`
     - ✅ `payment_intent.payment_failed`
     - ✅ `account.updated`
   - Klikni **"Add events"**

6. Klikni **"Add endpoint"** (na dnu)

### 3.4 Kopiraj Webhook Secret
1. Nakon kreiranja, webhook će biti prikazan u listi
2. Klikni na **webhook koji si upravo kreirao**
3. Scroll dole do sekcije **"Signing secret"**
4. Klikni **"Reveal"** ili **"Click to reveal"**
5. Kopiraj secret (počinje sa `whsec_`)
6. **Sačuvaj ga negdje** - trebaće ti za `.env`

**Primjer:**
```
whsec_abc123def456ghi789jkl012mno345pqr678
```

---

## 📋 Korak 4: Ažuriraj .env fajl na serveru

### 4.1 Otvori .env fajl
```bash
nano /path/to/your/.env
```

### 4.2 Pronađi i ažuriraj STRIPE sekciju

**PRIJE (pogrešno):**
```bash
# =============================
# STRIPE (test keys)
# =============================
STRIPE_SECRET_KEY=sk_test_51SHjfmFDazUCDE0Z...
STRIPE_WEBHOOK_SECRET=pk_test_51SHjfmFDazUCDE0Zb9cEZ3BJM3SJ78e8LFyXMBNFUuX76xnFTGirHK9rLcmdxxjAnbTbHz5YKXCy1i0UUBJGwK9500S4GH6ZaJ
```

**POSLIJE (ispravno):**
```bash
# =============================
# STRIPE (LIVE MODE - PRODUCTION)
# =============================
STRIPE_SECRET_KEY=sk_live_XXXXXXXXXXXXXXXXXXXXX  # Tvoj live secret key
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXX
STRIPE_CLIENT_ID=ca_XXXXXXXXXXXXXXXXXXXXX
STRIPE_REDIRECT_URI=https://handmadelovefilled.com/stripe/callback
STRIPE_PLATFORM_FEE_PERCENT=10
BACKEND_URL=https://handmadelovefilled.com
```

### 4.3 Zamijeni placeholder vrijednosti

**Zamijeni:**
- `whsec_XXXXXXXXXXXXXXXXXXXXX` → webhook secret iz koraka 3.4
- `ca_XXXXXXXXXXXXXXXXXXXXX` → client ID iz koraka 2.4

**Podesi platform fee:**
- `STRIPE_PLATFORM_FEE_PERCENT=10` → postavi svoj procenat (npr. 5, 10, 15...)

### 4.4 Sačuvaj fajl
- Pritisni `Ctrl+O` pa `Enter` (ako koristiš nano)
- Pritisni `Ctrl+X` za exit

---

## 📋 Korak 5: Restartuj Backend Server

### Ako koristiš PM2:
```bash
pm2 restart all
pm2 logs
```

### Ako koristiš systemd:
```bash
sudo systemctl restart your-api-service
sudo systemctl status your-api-service
```

### Ako koristiš docker:
```bash
docker-compose restart api
docker-compose logs -f api
```

### Provjeri da server radi:
```bash
curl https://handmadelovefilled.com/health
```
Ili otvori u browseru i trebao bi vidjeti odgovor.

---

## 📋 Korak 6: Testiraj OAuth Flow (Vendor Onboarding)

### 6.1 Logiraj se kao vendor
1. Otvori: `https://handmadelovefilled.com`
2. Logiraj se sa vendor accountom
3. Idi na: `https://handmadelovefilled.com/dashboard/settings/payments`

### 6.2 Klikni "Connect with Stripe"
1. Trebao bi da te redirectuje na Stripe OAuth stranicu
2. Ako vidiš error, provjeri:
   - Da li je backend server pokrenut?
   - Da li je `STRIPE_CLIENT_ID` ispravno postavljen?

### 6.3 Logiraj se na Stripe
1. Koristi **svoj Stripe account** (live mode)
2. Ili kreiraj novi test Stripe account za testiranje
3. Odgovori na Stripe pitanja

### 6.4 Autorizuj pristup
1. Stripe će pitati da li dozvoljaš platformi pristup
2. Klikni **"Connect"** ili **"Authorize"**

### 6.5 Redirect nazad na sajt
1. Trebao bi da te vrati na: `https://handmadelovefilled.com/stripe/callback?code=...`
2. Trebao bi vidjeti **"Connection successful!"** poruku
3. Auto-redirect na payment settings gdje status pokazuje **"Connected to Stripe"**

### 6.6 Ako vidiš error:
- **"invalid_state_token"** → Probaj ponovo, state token je istekao (15min)
- **"no_stripe_user_id"** → Provjeri `STRIPE_CLIENT_ID` u .env
- **"redirect_uri_mismatch"** → Provjeri da je redirect URL tačno postavljen na Stripe Dashboard-u

---

## 📋 Korak 7: Testiraj Checkout i Payment

### 7.1 Kreiraj test order
1. Idi na frontend kao kupac
2. Dodaj proizvod u korpu (od vendora koji je povezan sa Stripe-om)
3. Idi na checkout

### 7.2 Uplati sa **LIVE karticom**
⚠️ **PAŽNJA:** Sada si u LIVE MODE - plaćanja su PRAVA!

**Za testiranje, koristi Stripe test kartice SAMO U TEST MODE-u.**

**Ako želiš da testiraš bez pravog novca:**
1. Prebaci Stripe Dashboard nazad u **Test mode**
2. Koristi test keys (`sk_test_...`)
3. Koristi test karticu: `4242 4242 4242 4242`

**Za pravo plaćanje u production:**
- Koristi svoju pravu kreditnu karticu
- Novac će biti zaista naplaćen
- Platform fee će biti odvojen
- Vendor će dobiti svoj dio

### 7.3 Provjeri webhook log
1. Idi na: `https://dashboard.stripe.com/webhooks`
2. Klikni na svoj webhook endpoint
3. Klikni na **"Logs"** tab
4. Trebao bi vidjeti `payment_intent.succeeded` event
5. Provjeri da je **Response code: 200** (uspješno)

---

## 📋 Korak 8: Verifikuj da sve radi

### Backend provajera:
```bash
# Provjeri logove za greške
pm2 logs --lines 50

# Ili
tail -f /var/log/your-api.log
```

### Database provjera:
```sql
-- Provjeri da li je vendor povezan
SELECT id, name, "stripeAccountId", "stripeChargesEnabled"
FROM shops
WHERE "ownerId" = 'vendor-user-id';

-- Provjeri payment intent
SELECT id, status, "providerPaymentIntentId", "amountCents"
FROM payments
ORDER BY "createdAt" DESC
LIMIT 5;
```

### Stripe Dashboard provjera:
1. **Payments:** `https://dashboard.stripe.com/payments`
   - Trebao bi vidjeti payment
2. **Connect → Accounts:** `https://dashboard.stripe.com/connect/accounts/overview`
   - Trebao bi vidjeti povezane vendor accounte
3. **Webhooks:** `https://dashboard.stripe.com/webhooks`
   - Provjeri da li ima grešaka u webhook logs-u

---

## 🔥 Troubleshooting - Česti problemi

### Problem: "stripe_oauth_not_configured"
**Uzrok:** `STRIPE_CLIENT_ID` nije postavljen ili je prazan
**Rješenje:**
```bash
# Provjeri env
grep STRIPE_CLIENT_ID /path/to/.env

# Trebao bi vidjeti:
STRIPE_CLIENT_ID=ca_...

# Ako je prazno ili nema, dodaj ga i restartuj server
```

---

### Problem: "redirect_uri_mismatch" na Stripe OAuth stranici
**Uzrok:** Redirect URL u .env ne odgovara onom na Stripe Dashboard-u
**Rješenje:**
1. Provjeri `.env`:
   ```bash
   grep STRIPE_REDIRECT_URI /path/to/.env
   ```
   Treba da bude: `https://handmadelovefilled.com/stripe/callback`

2. Provjeri Stripe Dashboard:
   - Idi na: https://dashboard.stripe.com/settings/connect/oauth
   - Provjeri da redirect URL tačno odgovara
   - **Paziti na:** trailing slash (`/` na kraju) - mora biti identično!

---

### Problem: Webhook ne prima events
**Uzrok:** Webhook secret pogrešan ili webhook nije aktiviran
**Rješenje:**
1. Provjeri webhook status:
   - https://dashboard.stripe.com/webhooks
   - Klikni na webhook
   - Status trebao bi biti **"Enabled"**

2. Provjeri signing secret:
   ```bash
   grep STRIPE_WEBHOOK_SECRET /path/to/.env
   ```
   Trebao bi počinjati sa `whsec_`

3. Test webhook:
   - Na webhook stranici klikni **"Send test webhook"**
   - Odaberi `payment_intent.succeeded`
   - Provjeri response - trebao bi biti 200

---

### Problem: "charges_enabled = false" nakon povezivanja
**Uzrok:** Vendor nije završio Stripe verifikaciju
**Rješenje:**
- Vendor treba da se loguje na svoj Stripe Dashboard
- Završi identity verification i business details
- Stripe može tražiti dodatne dokumente

---

### Problem: Backend ne reaguje na webhook
**Uzrok:** Webhook handler ima bug ili secret je pogrešan
**Rješenje:**
1. Provjeri backend logove:
   ```bash
   pm2 logs | grep webhook
   ```

2. Provjeri webhook signature validaciju:
   - Ako vidiš "signature verification failed", webhook secret je pogrešan

3. Ručno testiraj endpoint:
   ```bash
   curl -X POST https://handmadelovefilled.com/api/v1/stripe/webhook \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

---

## 📝 Environment Variables - Finalna Provjera

Tvoj **production** `.env` bi trebao imati ove varijable:

```bash
# STRIPE (LIVE MODE)
STRIPE_SECRET_KEY=sk_live_51STMwEBtIiYgUZuH...  ✅ (live key)
STRIPE_WEBHOOK_SECRET=whsec_...                  ✅ (webhook signing secret)
STRIPE_CLIENT_ID=ca_...                           ✅ (OAuth client ID)
STRIPE_REDIRECT_URI=https://handmadelovefilled.com/stripe/callback  ✅
STRIPE_PLATFORM_FEE_PERCENT=10                    ✅ (tvoj fee %)
BACKEND_URL=https://handmadelovefilled.com        ✅

# URLS
FRONTEND_URL=https://handmadelovefilled.com       ✅
CORS_ORIGIN=https://handmadelovefilled.com        ✅

# DATABASE
DATABASE_URL=postgresql://...                     ✅

# SESSION
SESSION_SECRET=...                                ✅
COOKIE_SECURE=true                                ✅ (MORA biti true u produkciji)

# REDIS
REDIS_URL=redis://localhost:6379                 ✅

# SMTP
SMTP_HOST=smtp.resend.com                         ✅
SMTP_USER=...                                     ✅
SMTP_PASS=...                                     ✅
```

---

## ✅ Konačna Provjera - Sve Radi!

Kada sve prođe, trebao bi moći:

- ✅ Vendor se povezuje sa Stripe-om kroz OAuth
- ✅ Status pokazuje "Connected to Stripe"
- ✅ Kupac može da kupi proizvod
- ✅ Payment intent se kreira uspješno
- ✅ Webhook prima `payment_intent.succeeded` event
- ✅ Order status se ažurira na `PROCESSING`
- ✅ Payment zapis se kreira u bazi
- ✅ Platform fee se automatski odvaja

---

## 🎉 Gotovo!

Kada završiš sve korake i sve radi - tvoj marketplace je **live sa Stripe Standard Connect-om**!

Vendori sada mogu primati uplate iz cijelog svijeta, uključujući UAE. 🌍

---

## 📞 Podrška

Ako se zaglavi bilo gdje:
- Provjeri Stripe Dashboard → Logs
- Provjeri backend logove (`pm2 logs`)
- Provjeri browser console (F12) za frontend greške
- Pročitaj `STRIPE_STANDARD_CONNECT_SETUP.md` za više detalja

---

**Napravljeno:** 2026-02-01
**Verzija:** 1.0 - Production Ready ✅
