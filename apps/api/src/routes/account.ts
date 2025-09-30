import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { z } from 'zod';
import { prisma } from '../prisma';
import bcrypt from 'bcryptjs';

const router = Router();

const ChangePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'New passwords do not match',
  path: ['confirmPassword'],
});

router.patch('/password', requireAuth, async (req, res) => {
  try {
    const validation = ChangePasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { currentPassword, newPassword } = validation.data;
    const user = (req as any).user as { sub: string };

    const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
    if (!dbUser || !dbUser.passwordHash) {
      return res.status(401).json({ error: 'User not found or password not set.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect current password.' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.sub },
      data: { passwordHash: newPasswordHash },
    });

    res.status(200).json({ message: 'Password updated successfully.' });

  } catch (error) {
    console.error('Password update failed:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

export default router;
