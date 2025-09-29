import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// POST /api/v1/admin/promote - Promote a user to admin role (admin only)
router.post('/promote', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
  });
  
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
  }
  
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
