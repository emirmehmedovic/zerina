import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Create or get a conversation for current user with a vendor (by product or shop)
router.post('/conversations', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user as { sub: string };
    const { productId, shopId } = req.body || {};

    if (!productId && !shopId) return res.status(400).json({ error: 'missing_target' });

    let resolvedShopId = shopId as string | undefined;
    let resolvedProductId = productId as string | undefined;

    if (productId && !resolvedShopId) {
      const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, shopId: true } });
      if (!product) return res.status(404).json({ error: 'product_not_found' });
      resolvedShopId = product.shopId;
    }

    if (!resolvedShopId) return res.status(400).json({ error: 'shop_resolve_failed' });

    // Try to find existing conversation for same (user, shop, product nullable)
    let conv = await prisma.conversation.findFirst({
      where: {
        shopId: resolvedShopId,
        productId: resolvedProductId,
        participants: { some: { userId: user.sub } },
      },
      orderBy: { lastMessageAt: 'desc' },
      include: { participants: true },
    });

    // Ensure current user is participant (or create new conversation)
    if (!conv) {
      conv = await prisma.conversation.create({
        data: {
          shopId: resolvedShopId,
          productId: resolvedProductId,
          participants: {
            createMany: {
              data: [
                { userId: user.sub, role: 'CUSTOMER' },
                // vendor participant = shop owner
                // resolved vendor fetched below
              ],
            },
          },
        },
        include: { participants: true },
      });
      // Add vendor participant (shop owner)
      const shop = await prisma.shop.findUnique({ where: { id: resolvedShopId }, select: { ownerId: true } });
      if (shop) {
        await prisma.conversationParticipant.upsert({
          where: { conversationId_userId: { conversationId: conv.id, userId: shop.ownerId } },
          create: { conversationId: conv.id, userId: shop.ownerId, role: 'VENDOR' },
          update: {},
        });
      }
      conv = await prisma.conversation.findUnique({ where: { id: conv.id }, include: { participants: true } });
    } else {
      // Ensure user participant exists
      await prisma.conversationParticipant.upsert({
        where: { conversationId_userId: { conversationId: conv.id, userId: user.sub } },
        create: { conversationId: conv.id, userId: user.sub, role: 'CUSTOMER' },
        update: {},
      });
    }

    return res.json(conv);
  } catch (err) {
    console.error('[chat] create conversation error', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

// List conversations for current user (buyer or vendor)
router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user as { sub: string };
    const items = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId: user.sub } },
      },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        participants: true,
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    return res.json({ items });
  } catch (err) {
    console.error('[chat] list conversations error', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

// List messages in a conversation (participant only)
router.get('/conversations/:id/messages', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user as { sub: string };
    const { id } = req.params;
    const after = req.query.after ? new Date(String(req.query.after)) : undefined;

    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: id, userId: user.sub } },
    });
    if (!participant) return res.status(403).json({ error: 'forbidden' });

    const messages = await prisma.message.findMany({
      where: { conversationId: id, ...(after ? { createdAt: { gt: after } } : {}) },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
    return res.json({ items: messages });
  } catch (err) {
    console.error('[chat] list messages error', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

// Post a message
router.post('/conversations/:id/messages', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user as { sub: string };
    const { id } = req.params;
    const { body } = req.body || {};
    if (!body || typeof body !== 'string' || body.trim().length === 0) return res.status(400).json({ error: 'empty_body' });

    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: id, userId: user.sub } },
    });
    if (!participant) return res.status(403).json({ error: 'forbidden' });

    const msg = await prisma.message.create({ data: { conversationId: id, senderId: user.sub, body: body.trim() } });

    await prisma.conversation.update({ where: { id }, data: { lastMessageAt: new Date() } });

    return res.status(201).json(msg);
  } catch (err) {
    console.error('[chat] post message error', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

// Mark as read
router.post('/conversations/:id/read', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user as { sub: string };
    const { id } = req.params;
    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId: id, userId: user.sub } },
      data: { lastReadAt: new Date() },
    });
    return res.json({ ok: true });
  } catch (err) {
    console.error('[chat] mark read error', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

export default router;
