import { Router } from 'express';
import { z } from 'zod';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { ENV } from '../env';
import rateLimit from 'express-rate-limit';
import { COOKIE_NAME } from '../middleware/auth';
import { requireAuth, requireRole } from '../middleware/auth';
import { issueCsrfToken } from '../middleware/csrf';

const router = Router();

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
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: ENV.cookieSecure,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
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
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: ENV.cookieSecure,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  clearFailures(email);
  return res.json({ id: user.id, email: user.email, role: user.role, name: user.name });
});

router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: ENV.cookieSecure, sameSite: 'lax' });
  return res.json({ ok: true });
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
    res.cookie(COOKIE_NAME, session, {
      httpOnly: true,
      secure: ENV.cookieSecure,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
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
