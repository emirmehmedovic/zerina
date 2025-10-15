import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '../middleware/auth';
import type { Request, Response } from 'express';

const router = Router();

// Ensure upload directory exists
const uploadDir = path.resolve(__dirname, '../../uploads');
const vendorDocsDir = path.join(uploadDir, 'vendor-docs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(vendorDocsDir)) {
  fs.mkdirSync(vendorDocsDir, { recursive: true });
}

const storage = multer.diskStorage({
  // use 'any' to avoid depending on @types/multer in dev
  destination: (_req: Request, _file: any, cb: (error: any, destination: string) => void) => cb(null, uploadDir),
  filename: (_req: Request, file: any, cb: (error: any, filename: string) => void) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_\.]/g, '-');
    const stamp = Date.now();
    cb(null, `${base}-${stamp}${ext}`);
  },
});

// Allow only common image mime types, limit to 10 MB per file
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);
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

// POST /api/v1/uploads (multipart/form-data: field "file")
router.post('/', requireAuth, upload.single('file'), async (req: Request, res: Response) => {
  const file = (req as any).file as any | undefined;
  if (!file) return res.status(400).json({ error: 'no_file' });
  const publicPath = `/uploads/${file.filename}`;
  return res.status(201).json({ path: publicPath, filename: file.originalname, size: file.size });
});

export default router;
