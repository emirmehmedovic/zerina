import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ENV } from './env';
import { prisma } from './prisma';
import authRouter from './routes/auth';
import categoriesRouter from './routes/categories';
import productsRouter from './routes/products';
import shopsRouter from './routes/shops';
import { requireAuth } from './middleware/auth';
import devRouter from './routes/dev';
import adminRouter from './routes/admin';
import adminAnalyticsRouter from './routes/admin-analytics';
import adminAnalyticsV2Router from './routes/admin-analytics-v2';
import path from 'path';
import fs from 'fs';
import uploadsRouter from './routes/uploads';
import checkoutRouter from './routes/checkout';
import addressesRouter from './routes/addresses';
import ordersRouter from './routes/orders';
import vendorRouter from './routes/vendor';
import accountRoutes from './routes/account';
import productImagesRouter from './routes/product-images';
import productVariantsRouter from './routes/product-variants';
import { csrfProtect } from './middleware/csrf';

const app = express();
app.set('trust proxy', 1);

// Configure Helmet to allow cross-origin embedding of static images
// This sets the Cross-Origin-Resource-Policy header to "cross-origin"
// so that the web app on :3000 can display images served from :4000.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: ENV.corsOrigin,
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// CSRF protection for non-GET requests (exclude auth and dev utilities)
app.use(
  csrfProtect([
    { pathStartsWith: '/api/v1/auth' },
    { pathStartsWith: '/api/v1/dev' },
  ])
);

// Static uploads directories
// Primary (matches routes/uploads.ts)
const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', cors({ origin: ENV.corsOrigin, credentials: true }), express.static(uploadDir));

// Legacy location (previously used): apps/api/uploads
const legacyUploadDir = path.resolve(__dirname, '../uploads');
if (fs.existsSync(legacyUploadDir)) {
  app.use('/uploads', cors({ origin: ENV.corsOrigin, credentials: true }), express.static(legacyUploadDir));
}

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, env: ENV.nodeEnv });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'db_unhealthy' });
  }
});

app.get('/', (_req, res) => {
  res.json({ name: 'webshop-api', status: 'running' });
});

// Auth routes
app.use('/api/v1/auth', authRouter);

// Users
app.get('/api/v1/users/me', requireAuth, async (req, res) => {
  const userId = (req as any).user?.sub as string | undefined;
  if (!userId) return res.status(401).json({ error: 'unauthenticated' });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, role: true } });
  if (!user) return res.status(404).json({ error: 'not_found' });
  return res.json(user);
});

// Public content
app.use('/api/v1/categories', categoriesRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/shops', shopsRouter);
app.use('/api/v1/uploads', uploadsRouter);
app.use('/api/v1/checkout', checkoutRouter);
app.use('/api/v1/addresses', addressesRouter);
app.use('/api/v1/orders', ordersRouter);
app.use('/api/v1/vendor', vendorRouter);
app.use('/api/v1/account', accountRoutes);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/admin/analytics', adminAnalyticsRouter);
app.use('/api/v1/admin/analytics-v2', adminAnalyticsV2Router);

// Product related routes
app.use('/api/v1/products', productImagesRouter);
app.use('/api/v1/products', productVariantsRouter);

// Dev utilities (disabled in production)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/v1/dev', devRouter);
}

// Global error handler (standardized JSON error shape)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[api] error:', err);
  const status = typeof err?.status === 'number' ? err.status : 500;
  return res.status(status).json({ error: err?.message || 'server_error' });
});

app.listen(ENV.port, () => {
  console.log(`[api] listening on http://localhost:${ENV.port}`);
});
