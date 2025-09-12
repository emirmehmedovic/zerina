import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ENV } from './env';
import { prisma } from './prisma';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: ENV.corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

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

app.listen(ENV.port, () => {
  console.log(`[api] listening on http://localhost:${ENV.port}`);
});
