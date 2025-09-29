import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { ENV } from '../env';
import { COOKIE_NAME } from '../middleware/auth';

const router = Router();

// DEV-ONLY: Upgrade the current user role. Guard by NODE_ENV !== 'production'
router.post('/upgrade-role', requireAuth, async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'forbidden_in_production' });
  }
  const user = (req as any).user as { sub: string };
  const schema = z.object({ role: z.enum(['BUYER', 'VENDOR', 'ADMIN']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });

  const updated = await prisma.user.update({ where: { id: user.sub }, data: { role: parsed.data.role }, select: { id: true, email: true, role: true } });
  // Refresh session cookie with new role
  const token = jwt.sign({ sub: updated.id, role: updated.role }, ENV.sessionSecret, { expiresIn: '7d' });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: ENV.cookieSecure,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return res.json(updated);
});

// DEV-ONLY: Who am I (echo current JWT payload and DB role)
router.get('/whoami', requireAuth, async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'forbidden_in_production' });
  }
  const user = (req as any).user as { sub: string; role: string };
  const dbUser = await prisma.user.findUnique({ where: { id: user.sub }, select: { id: true, email: true, role: true } });
  return res.json({ jwt: user, db: dbUser });
});

// DEV-ONLY: Promote a user to admin by email (no auth required in dev mode)
router.post('/promote-admin', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'forbidden_in_production' });
  }
  
  const schema = z.object({ email: z.string().email() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
  
  const { email } = parsed.data;
  
  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'user_not_found' });
    }
    
    // Update the user role to ADMIN
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' },
      select: { id: true, email: true, name: true, role: true }
    });

    // Refresh session cookie with new ADMIN role so subsequent requests are authorized
    const token = jwt.sign({ sub: updatedUser.id, role: updatedUser.role }, ENV.sessionSecret, { expiresIn: '7d' });
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: ENV.cookieSecure,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    
    return res.json({ 
      message: `User ${updatedUser.email} promoted to ${updatedUser.role}`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error promoting user:', error);
    return res.status(500).json({ error: 'server_error' });
  }
});

export default router;
