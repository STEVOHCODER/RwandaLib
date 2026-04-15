import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.routes.js';
import documentRoutes from './routes/document.routes.js';
import downloadRoutes from './routes/download.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { authenticate, adminOnly } from './middleware/auth.js';
import prisma from './lib/prisma.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const localOrigins = [
  'http://localhost:5173',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5175'
];
const envOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set([...localOrigins, ...envOrigins]);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
  })
);
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Simple visit tracking middleware
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Use the standard prisma instance imported from lib/prisma.js
      await prisma.visit.upsert({
        where: { date: today },
        update: { count: { increment: 1 } },
        create: { date: today, count: 1 }
      });
    } catch (err) {
      console.error('Visit tracking error:', err);
    }
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes); // authenticate is applied INSIDE authRoutes for /me
app.use('/api/documents', authenticate, documentRoutes);
app.use('/api/download', authenticate, downloadRoutes);
app.use('/api/admin', authenticate, adminOnly, adminRoutes);

app.get('/', (req, res) => {
  res.send('RwandaLib API is running');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
