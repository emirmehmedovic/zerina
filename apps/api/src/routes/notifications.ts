import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../prisma';
import { getUnreadCount, markAsRead, markAllAsRead } from '../lib/notifications';

const router = Router();

// GET /api/v1/notifications - List notifications for current user
router.get('/', requireAuth, async (req, res) => {
  const user = (req as any).user as { sub: string };
  const { take = '20', skip = '0', unreadOnly = 'false' } = req.query as Record<string, string>;

  const where: any = { userId: user.sub };
  if (unreadOnly === 'true') {
    where.read = false;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(50, Math.max(1, parseInt(take) || 20)),
      skip: Math.max(0, parseInt(skip) || 0),
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        link: true,
        metadata: true,
        read: true,
        readAt: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({ where }),
    getUnreadCount(user.sub),
  ]);

  res.json({ notifications, total, unreadCount });
});

// GET /api/v1/notifications/unread-count - Get unread count
router.get('/unread-count', requireAuth, async (req, res) => {
  const user = (req as any).user as { sub: string };
  const count = await getUnreadCount(user.sub);
  res.json({ count });
});

// POST /api/v1/notifications/mark-read - Mark specific notifications as read
router.post('/mark-read', requireAuth, async (req, res) => {
  const user = (req as any).user as { sub: string };
  const schema = z.object({
    notificationIds: z.array(z.string()).min(1).max(100),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
  }

  const result = await markAsRead(parsed.data.notificationIds, user.sub);
  res.json({ updated: result.count });
});

// POST /api/v1/notifications/mark-all-read - Mark all notifications as read
router.post('/mark-all-read', requireAuth, async (req, res) => {
  const user = (req as any).user as { sub: string };
  const result = await markAllAsRead(user.sub);
  res.json({ updated: result.count });
});

// DELETE /api/v1/notifications/:id - Delete a notification
router.delete('/:id', requireAuth, async (req, res) => {
  const user = (req as any).user as { sub: string };
  const { id } = req.params;

  const notification = await prisma.notification.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!notification) {
    return res.status(404).json({ error: 'not_found' });
  }

  if (notification.userId !== user.sub) {
    return res.status(403).json({ error: 'forbidden' });
  }

  await prisma.notification.delete({ where: { id } });
  res.json({ deleted: true });
});

// DELETE /api/v1/notifications - Delete all read notifications
router.delete('/', requireAuth, async (req, res) => {
  const user = (req as any).user as { sub: string };

  const result = await prisma.notification.deleteMany({
    where: { userId: user.sub, read: true },
  });

  res.json({ deleted: result.count });
});

export default router;
