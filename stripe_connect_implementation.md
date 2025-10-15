
# Stripe Connect (Express) Integration Guide for Node.js + TypeScript + Prisma

This guide explains how to integrate **Stripe Connect Express** into an existing **Node.js + TypeScript + Prisma** backend for a marketplace.  
It allows vendors to connect their Stripe accounts and receive automatic payouts after a purchase, while the platform retains a commission.

---

## 🧩 Prerequisites

In your `.env` file:

```env
STRIPE_SECRET_KEY=sk_test_***
STRIPE_PUBLIC_KEY=pk_test_***
FRONTEND_URL=https://yourshop.com
BACKEND_URL=https://api.yourshop.com
PLATFORM_FEE_PERCENT=10
```

Your Prisma model:

```prisma
model Vendor {
  id               String   @id @default(cuid())
  name             String
  email            String   @unique
  stripeAccountId  String?
}
```

---

## ⚙️ 1. Connect Vendor Stripe Account

**Endpoint:** `POST /api/stripe/connect`

This route creates a Stripe Express account and returns an onboarding link.

```ts
import express from "express";
import Stripe from "stripe";
import { prisma } from "../lib/prisma";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

router.post("/connect", async (req, res) => {
  try {
    const vendorId = req.user.id;
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });

    let accountId = vendor?.stripeAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: vendor?.email,
      });

      await prisma.vendor.update({
        where: { id: vendorId },
        data: { stripeAccountId: account.id },
      });

      accountId = account.id;
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId!,
      refresh_url: `${process.env.FRONTEND_URL}/vendor/settings/payments?refresh=true`,
      return_url: `${process.env.FRONTEND_URL}/vendor/settings/payments?connected=true`,
      type: "account_onboarding",
    });

    res.json({ url: accountLink.url });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
```

---

## 🔍 2. Check Connection Status

**Endpoint:** `GET /api/stripe/status`

Returns the vendor's connection status.

```ts
router.get("/status", async (req, res) => {
  const vendorId = req.user.id;
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });

  if (!vendor?.stripeAccountId) {
    return res.json({ connected: false });
  }

  const account = await stripe.accounts.retrieve(vendor.stripeAccountId);
  const connected = account.charges_enabled && account.details_submitted;

  res.json({
    connected,
    payouts_enabled: account.payouts_enabled,
    charges_enabled: account.charges_enabled,
  });
});
```

---

## 💳 3. Checkout with Automatic Commission Split

**Endpoint:** `POST /api/checkout`

Automatically splits payments between the platform (commission) and the vendor.

```ts
router.post("/checkout", async (req, res) => {
  try {
    const { vendorId, amount } = req.body;
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });

    if (!vendor?.stripeAccountId) {
      throw new Error("Vendor has no connected Stripe account");
    }

    const platformFee = Math.round(
      (amount * Number(process.env.PLATFORM_FEE_PERCENT)) / 100
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      application_fee_amount: platformFee,
      transfer_data: {
        destination: vendor.stripeAccountId,
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
```

---

## 📬 4. Stripe Webhook (Optional but Recommended)

**Endpoint:** `/api/stripe/webhook`

Handles payment success events and updates your database.

```ts
router.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig!, endpointSecret);
  } catch (err: any) {
    console.log(`⚠️  Webhook signature verification failed.`, err.message);
    return res.sendStatus(400);
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    console.log("✅ Payment successful:", paymentIntent.id);
    // Update order status in DB
  }

  res.sendStatus(200);
});
```

---

## 🧠 5. Frontend Example (React)

```jsx
function VendorPayments() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetch("/api/stripe/status")
      .then((res) => res.json())
      .then(setStatus);
  }, []);

  if (!status?.connected)
    return (
      <button
        onClick={async () => {
          const res = await fetch("/api/stripe/connect", { method: "POST" });
          const data = await res.json();
          window.location.href = data.url;
        }}
      >
        Connect with Stripe
      </button>
    );

  return <p>✅ Stripe connected and ready!</p>;
}
```

---

## 🧪 6. Testing

1. Vendor clicks “Connect with Stripe” → completes onboarding → returns to your site  
2. Check status (`charges_enabled = true`)  
3. Customer pays via Checkout → commission and vendor split automatically  
4. Webhook confirms payment success

---

## ✅ 7. Debugging Tips

- Use **Stripe Test Mode**
- Test cards: `4242 4242 4242 4242`
- Check events: Dashboard → **Developers → Events**
- Watch for: `payment_intent.succeeded`, `transfer.created`

---

**End of Integration Guide**
