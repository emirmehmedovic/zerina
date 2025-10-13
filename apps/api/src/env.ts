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
  // Optional Google OAuth configuration
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI,
};
