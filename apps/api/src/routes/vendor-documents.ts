import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

const uploadsRoot = path.resolve(__dirname, '../../uploads');
const vendorDocsDir = path.join(uploadsRoot, 'vendor-docs');
if (!fs.existsSync(vendorDocsDir)) {
  fs.mkdirSync(vendorDocsDir, { recursive: true });
}

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, vendorDocsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_\.]/g, '-');
    const stamp = Date.now();
    cb(null, `${base}-${stamp}${ext}`);
  },
});

const documentSelect = {
  id: true,
  storageKey: true,
  originalName: true,
  mimeType: true,
  sizeBytes: true,
  uploadedAt: true,
  applicationId: true,
} as const;

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      const err: any = new Error('unsupported_mime');
      err.status = 400;
      return cb(err);
    }
    cb(null, true);
  },
});

router.get('/', requireAuth, async (req, res) => {
  const authUser = (req as any).user as { sub: string } | undefined;
  if (!authUser) return res.status(401).json({ error: 'unauthenticated' });

  const documents = await prisma.vendorDocument.findMany({
    where: { userId: authUser.sub },
    orderBy: { uploadedAt: 'desc' },
    select: documentSelect,
  });

  res.json({ documents });
});

router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  const authUser = (req as any).user as { sub: string } | undefined;
  if (!authUser) return res.status(401).json({ error: 'unauthenticated' });
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) return res.status(400).json({ error: 'no_file' });

  const storageKey = `vendor-docs/${file.filename}`;
  const document = await prisma.vendorDocument.create({
    data: {
      userId: authUser.sub,
      storageKey,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    },
    select: documentSelect,
  });

  res.status(201).json({ document });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const authUser = (req as any).user as { sub: string } | undefined;
  if (!authUser) return res.status(401).json({ error: 'unauthenticated' });
  const { id } = req.params;

  const document = await prisma.vendorDocument.findUnique({ where: { id }, select: { id: true, userId: true, applicationId: true, storageKey: true } });
  if (!document || document.userId !== authUser.sub) {
    return res.status(404).json({ error: 'not_found' });
  }
  if (document.applicationId) {
    return res.status(409).json({ error: 'document_attached' });
  }

  await prisma.vendorDocument.delete({ where: { id } });
  const filePath = path.join(uploadsRoot, document.storageKey);
  fs.promises.unlink(filePath).catch(() => undefined);
  res.json({ ok: true });
});

export default router;
