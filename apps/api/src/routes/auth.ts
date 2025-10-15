import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { ENV } from '../env';
import rateLimit from 'express-rate-limit';
import { COOKIE_NAME } from '../middleware/auth';
import { requireAuth, requireRole } from '../middleware/auth';
import { issueCsrfToken } from '../middleware/csrf';
import { enqueueEmail } from '../lib/email';

const router = Router();

const phoneRequestSchema = z.object({
  phoneNumber: z.string().min(6).max(32),
});

const phoneVerifySchema = z.object({
  code: z.string().length(6),
});

const resendEmailSchema = z.object({});

const phoneCooldownMs = 2 * 60 * 1000;

function generatePhoneCode() {
  return crypto.randomInt(100_000, 1_000_000).toString();
}

const phoneRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(100),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

function signSession(user: { id: string; role: 'BUYER' | 'VENDOR' | 'ADMIN' }) {
  const payload = { sub: user.id, role: user.role };
  return jwt.sign(payload, ENV.sessionSecret, { expiresIn: '7d' });
}

const cookieOptions: import('express').CookieOptions = {
  httpOnly: true,
  secure: ENV.cookieSecure,
  sameSite: ENV.nodeEnv === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

// Simple in-memory brute-force protection keyed by email
// Locks account for LOCK_MS after MAX_ATTEMPTS failed tries in the last window
const MAX_ATTEMPTS = 5;
const LOCK_MS = 10 * 60 * 1000; // 10 minutes
type FailInfo = { count: number; unlockAt?: number; lastFailAt?: number };
const failedLogins = new Map<string, FailInfo>();

function isLocked(email: string) {
  const info = failedLogins.get(email);
  if (!info?.unlockAt) return { locked: false as const };
  const now = Date.now();
  if (now < info.unlockAt) {
    const retryAfterMs = info.unlockAt - now;
    return { locked: true as const, retryAfterSeconds: Math.ceil(retryAfterMs / 1000) };
  }
  // Lock expired
  failedLogins.delete(email);
  return { locked: false as const };
}

function registerFailure(email: string) {
  const now = Date.now();
  const info = failedLogins.get(email) || { count: 0 } as FailInfo;
  // If currently locked, keep lock
  if (info.unlockAt && now < info.unlockAt) return info;
  const count = (info.count || 0) + 1;
  if (count >= MAX_ATTEMPTS) {
    const locked: FailInfo = { count: 0, unlockAt: now + LOCK_MS, lastFailAt: now };
    failedLogins.set(email, locked);
    return locked;
  }
  const updated: FailInfo = { count, lastFailAt: now };
  failedLogins.set(email, updated);
  return updated;
}

function clearFailures(email: string) {
  failedLogins.delete(email);
}

router.post('/register', async (req, res) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'invalid_body', code: 'INVALID_BODY', details: parse.error.flatten() });

  const { email, password, name } = parse.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'email_in_use', code: 'EMAIL_IN_USE' });

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const user = await prisma.user.create({ data: { email, passwordHash, name, role: 'BUYER' } });

  const token = signSession({ id: user.id, role: user.role });
  res.cookie(COOKIE_NAME, token, cookieOptions);
  return res.status(201).json({ id: user.id, email: user.email, role: user.role, name: user.name });
});

router.post('/login', loginLimiter, async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'invalid_body', details: parse.error.flatten() });
  const { email, password } = parse.data;
  const user = await prisma.user.findUnique({ where: { email } });
  // Check lock status even if user is not found to avoid user enumeration
  const lock = isLocked(email);
  if (lock.locked) return res.status(429).json({ error: 'account_locked', code: 'ACCOUNT_LOCKED', retryAfterSeconds: lock.retryAfterSeconds });

  if (!user) {
    const info = registerFailure(email);
    if (info.unlockAt) return res.status(429).json({ error: 'account_locked', code: 'ACCOUNT_LOCKED', retryAfterSeconds: Math.ceil((info.unlockAt - Date.now())/1000) });
    return res.status(401).json({ error: 'invalid_credentials', code: 'INVALID_CREDENTIALS' });
  }
  const ok = await argon2.verify(user.passwordHash, password);
  if (!ok) {
    const info = registerFailure(email);
    if (info.unlockAt) return res.status(429).json({ error: 'account_locked', code: 'ACCOUNT_LOCKED', retryAfterSeconds: Math.ceil((info.unlockAt - Date.now())/1000) });
    return res.status(401).json({ error: 'invalid_credentials', code: 'INVALID_CREDENTIALS', details: 'Password is incorrect' });
  }

  const token = signSession({ id: user.id, role: user.role });
  res.cookie(COOKIE_NAME, token, cookieOptions);
  clearFailures(email);
  return res.json({ id: user.id, email: user.email, role: user.role, name: user.name });
});

router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: undefined });
  return res.json({ ok: true });
});

router.post('/phone/request', requireAuth, phoneRateLimit, async (req, res) => {
  if (!ENV.requirePhoneVerification) {
    return res.status(501).json({ error: 'phone_verification_disabled' });
  }

  const parsed = phoneRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
  }

  const user = (req as any).user as { sub: string };
  const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
  if (!dbUser) {
    return res.status(404).json({ error: 'user_not_found' });
  }

  const phoneTokens = (prisma as any).phoneVerificationToken;
  const existing = await phoneTokens.findFirst({
    where: { userId: user.sub },
    orderBy: { createdAt: 'desc' },
  });
  if (existing && existing.expiresAt > new Date(Date.now() - phoneCooldownMs)) {
    return res.status(429).json({ error: 'too_many_requests' });
  }

  const code = generatePhoneCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.sub }, data: { phoneNumber: parsed.data.phoneNumber } as any }),
    phoneTokens.create({
      data: {
        userId: user.sub,
        code,
        expiresAt,
      },
    }),
  ]);

  console.log('[auth] send phone verification code', parsed.data.phoneNumber, code);

  return res.json({ ok: true, expiresAt });
});

router.post('/phone/verify', requireAuth, async (req, res) => {
  if (!ENV.requirePhoneVerification) {
    return res.status(501).json({ error: 'phone_verification_disabled' });
  }

  const parsed = phoneVerifySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
  }

  const user = (req as any).user as { sub: string };
  const phoneTokens = (prisma as any).phoneVerificationToken;
  const token = await phoneTokens.findFirst({
    where: { userId: user.sub },
    orderBy: { createdAt: 'desc' },
  });

  if (!token || token.expiresAt < new Date() || token.code !== parsed.data.code) {
    return res.status(400).json({ error: 'invalid_code' });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.sub },
      data: { phoneVerifiedAt: new Date() } as any,
    }),
    phoneTokens.deleteMany({ where: { userId: user.sub } }),
  ]);

  return res.json({ ok: true });
});

router.post('/email/resend-verification', requireAuth, async (req, res) => {
  const parsed = resendEmailSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
  }

  const user = (req as any).user as { sub: string };
  const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
  if (!dbUser) {
    return res.status(404).json({ error: 'user_not_found' });
  }

  const userWithEmailVerification = dbUser as typeof dbUser & { emailVerifiedAt?: Date | null };

  if (userWithEmailVerification.emailVerifiedAt) {
    return res.json({ ok: true, alreadyVerified: true });
  }

  await enqueueEmail({
    to: dbUser.email,
    subject: 'Verify your email address',
    html: `<p>Hello${dbUser.name ? ` ${dbUser.name}` : ''},</p><p>Please verify your email address to continue onboarding.</p>`,
    text: `Hello${dbUser.name ? ` ${dbUser.name}` : ''},\nPlease verify your email address to continue onboarding.`,
  });

  return res.json({ ok: true });
});
// --- Google OAuth ---
// GET /api/v1/auth/google/start
router.get('/google/start', (req, res) => {
  const { googleClientId, googleRedirectUri, frontendUrl } = ENV as any;
  if (!googleClientId || !googleRedirectUri) {
    return res.status(501).json({ error: 'google_oauth_not_configured' });
  }
  const state = crypto.randomBytes(16).toString('hex');
  const redirect = (req.query.redirect as string) || `${frontendUrl}/account`;
  // Store minimal state in cookie (httpOnly)
  res.cookie('oauth_state', JSON.stringify({ s: state, r: redirect }), { ...cookieOptions, maxAge: 5 * 60 * 1000 });
  const params = new URLSearchParams({
    client_id: googleClientId,
    redirect_uri: googleRedirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    include_granted_scopes: 'true',
    prompt: 'consent'
  });
  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return res.redirect(url);
});

// GET /api/v1/auth/google/callback
router.get('/google/callback', async (req, res) => {
  try {
    const code = (req.query.code as string) || '';
    const state = (req.query.state as string) || '';
    const cookieStateRaw = (req.cookies as any)?.oauth_state as string | undefined;
    if (!code || !cookieStateRaw) return res.status(400).send('invalid_request');
    let parsed: any = null;
    try { parsed = JSON.parse(cookieStateRaw); } catch {}
    if (!parsed || parsed.s !== state) return res.status(400).send('invalid_state');
    const redirectAfter = parsed.r as string;
    // Clear state cookie
    res.clearCookie('oauth_state', { ...cookieOptions, maxAge: undefined });

    const { googleClientId, googleClientSecret, googleRedirectUri } = ENV as any;
    if (!googleClientId || !googleClientSecret || !googleRedirectUri) return res.status(501).send('not_configured');

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: googleRedirectUri,
        grant_type: 'authorization_code'
      }) as any,
    });
    const tokenBody = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok) return res.status(400).send('token_exchange_failed');
    const accessToken = tokenBody.access_token as string;
    if (!accessToken) return res.status(400).send('no_access_token');

    // Fetch userinfo
    const uiRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const ui = await uiRes.json().catch(() => ({}));
    if (!uiRes.ok) return res.status(400).send('userinfo_failed');
    const email: string | undefined = ui?.email;
    const name: string | undefined = ui?.name;
    if (!email) return res.status(400).send('no_email');

    // Upsert user by email (no googleId column yet). Ensure passwordHash requirement satisfied.
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const randomPwd = crypto.randomBytes(24).toString('hex');
      const passwordHash = await argon2.hash(randomPwd, { type: argon2.argon2id });
      user = await prisma.user.create({ data: { email, passwordHash, name, role: 'BUYER' } });
    }

    // Sign session and set cookie
    const token = signSession({ id: user.id, role: user.role as any });
    res.cookie(COOKIE_NAME, token, cookieOptions);
    return res.redirect(redirectAfter || ENV.frontendUrl);
  } catch (e) {
    console.error('google_oauth_error', e);
    return res.status(500).send('oauth_error');
  }
});

// POST /api/v1/auth/admin/create — admin creates another admin account
router.post('/admin/create', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'invalid_body', details: parse.error.flatten() });
  const { email, password, name } = parse.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'email_in_use' });
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const user = await prisma.user.create({ data: { email, passwordHash, name, role: 'ADMIN' } });
  return res.status(201).json({ id: user.id, email: user.email, role: user.role, name: user.name });
});

// POST /api/v1/auth/forgot — request reset (dev: returns resetUrl)
router.post('/forgot', async (req, res) => {
  const parse = forgotSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'invalid_body', details: parse.error.flatten() });
  const { email } = parse.data;
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, role: true } });
  // Do not leak user existence
  if (!user) return res.json({ ok: true });

  const resetToken = jwt.sign({ sub: user.id, kind: 'pwd_reset' }, ENV.sessionSecret, { expiresIn: '15m' });
  // In production, we would email the link. For dev, return the URL to the client for convenience.
  const resetUrl = `${ENV.corsOrigin?.replace(/\/$/, '') || 'http://localhost:3000'}/reset?token=${encodeURIComponent(resetToken)}`;
  if (ENV.nodeEnv === 'production') {
    return res.json({ ok: true });
  }
  return res.json({ ok: true, token: resetToken, resetUrl });
});

// POST /api/v1/auth/reset — complete reset with token
router.post('/reset', async (req, res) => {
  const parse = resetSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'invalid_body', details: parse.error.flatten() });
  const { token, password } = parse.data;
  try {
    const payload = jwt.verify(token, ENV.sessionSecret) as { sub: string; kind?: string };
    if (!payload?.sub || payload.kind !== 'pwd_reset') return res.status(400).json({ error: 'invalid_token', code: 'INVALID_TOKEN' });
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(404).json({ error: 'not_found', code: 'NOT_FOUND' });
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    // Optionally sign-in the user after reset
    const session = signSession({ id: user.id, role: user.role as any });
    res.cookie(COOKIE_NAME, session, cookieOptions);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(400).json({ error: 'invalid_token', code: 'INVALID_TOKEN' });
  }
});

export default router;

// GET /api/v1/auth/csrf — issue CSRF token (sets cookie and returns token)
router.get('/csrf', (req, res) => {
  const token = issueCsrfToken(req, res);
  return res.json({ csrfToken: token });
});
