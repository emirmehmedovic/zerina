import dotenv from 'dotenv';
import path from 'path';

// Load env in this order (non-overriding):
// 1) Default CWD .env (npm script working directory)
// 2) API local .env (apps/api/.env)
// 3) Repo root .env (../../.. from src)
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: false });
dotenv.config({ path: path.resolve(__dirname, '../../../.env'), override: false });

const required = (name: string, fallback?: string) => {
  const val = process.env[name] ?? fallback;
  if (val === undefined || val === '') {
    throw new Error(`Missing required env var: ${name}`);
  }
  return val;
};

export const ENV = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  frontendUrl: required('FRONTEND_URL', 'http://localhost:3000'),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  sessionSecret: required('SESSION_SECRET'),
  cookieName: process.env.COOKIE_NAME ?? 'webshop_session',
  cookieSecure: (process.env.COOKIE_SECURE ?? 'false') === 'true',
  databaseUrl: required('DATABASE_URL'),
  stripeSecretKey: required('STRIPE_SECRET_KEY'),
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  stripePlatformFeePercent: Number(process.env.STRIPE_PLATFORM_FEE_PERCENT ?? '0'),
  backendUrl: process.env.BACKEND_URL ?? 'http://localhost:4000',
  smtpHost: required('SMTP_HOST'),
  smtpPort: Number(process.env.SMTP_PORT ?? '587'),
  smtpSecure: (process.env.SMTP_SECURE ?? 'false') === 'true',
  smtpUser: required('SMTP_USER'),
  smtpPass: required('SMTP_PASS'),
  smtpFrom: required('SMTP_FROM'),
  redisUrl: process.env.REDIS_URL,
  // Optional Google OAuth configuration
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI,
  captchaProvider: process.env.CAPTCHA_PROVIDER ?? 'recaptcha',
  captchaSecretKey: process.env.CAPTCHA_SECRET_KEY,
  captchaMinScore: Number(process.env.CAPTCHA_MIN_SCORE ?? '0.5'),
  vendorInitialProductLimit: Number(process.env.VENDOR_INITIAL_PRODUCT_LIMIT ?? '5'),
  identityProvider: process.env.IDENTITY_PROVIDER ?? 'mock',
  identityApiKey: process.env.IDENTITY_API_KEY,
  identityWebhookSecret: process.env.IDENTITY_WEBHOOK_SECRET,
  identityMinScore: Number(process.env.IDENTITY_MIN_SCORE ?? '0'),
  securityDepositEnabled: (process.env.SECURITY_DEPOSIT_ENABLED ?? 'false') === 'true',
  securityDepositAmountCents: Number(process.env.SECURITY_DEPOSIT_AMOUNT_CENTS ?? '0'),
  securityDepositCurrency: process.env.SECURITY_DEPOSIT_CURRENCY ?? 'EUR',
  requirePhoneVerification: (process.env.REQUIRE_PHONE_VERIFICATION ?? 'false') === 'true',
};
