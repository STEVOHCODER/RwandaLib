import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma.js';
import { computeFileHash } from '../services/hash.service.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/webp'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, and Images (JPG, PNG, WEBP) are allowed'));
    }
  }
});

// Updated upload to handle optional bulk mode for instant access
const bulkUpload = upload.array('files', 10); // Allow up to 10 files for safety

router.post('/upload-bulk', authenticate, bulkUpload, async (req: any, res) => {
  const { targetDocId } = req.body;
  const files = req.files as Express.Multer.File[];
  
  if (!files || files.length < 5) {
    return res.status(400).json({ error: 'You must upload at least 5 documents for instant access.' });
  }

  try {
    const createdDocs = [];
    for (const file of files) {
      const fileHash = computeFileHash(file.path);
      
      // Basic rule-based duplicate check
      const duplicate = await prisma.document.findFirst({
        where: { OR: [{ fileHash }, { fileName: file.originalname, fileSize: file.size }] }
      });

      if (duplicate) continue; // Skip duplicates in bulk upload

      const doc = await prisma.document.create({
        data: {
          title: file.originalname.replace(/\.[^/.]+$/, ""), // Use filename as title
          category: 'OTHER',
          educationLevel: 'UNIVERSITY',
          abstract: `Auto-uploaded for instant access to doc #${targetDocId}`,
          filePath: file.path,
          fileName: file.originalname,
          fileSize: file.size,
          fileHash,
          uploaderId: req.user.id,
          status: 'APPROVED' // Auto-approve these to grant instant access and update count
        }
      });
      createdDocs.push(doc);
    }

    if (createdDocs.length < 5) {
      return res.status(400).json({ error: `Only ${createdDocs.length} unique documents were accepted. Please upload 5 completely new documents.` });
    }

    // Grant instant access via a DownloadRequest
    await prisma.downloadRequest.upsert({
      where: { 
        userId_documentId: { userId: req.user.id, documentId: Number(targetDocId) } 
      },
      update: { status: 'APPROVED' },
      create: {
        userId: req.user.id,
        documentId: Number(targetDocId),
        status: 'APPROVED',
        reason: 'Instant access via bulk upload'
      }
    });

    res.status(201).json({ message: 'Success! You now have access to the document.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Bulk upload failed' });
  }
});

const cpUpload = upload.fields([{ name: 'file', maxCount: 1 }, { name: 'cover', maxCount: 1 }]);

router.post('/upload', authenticate, cpUpload, async (req: any, res) => {
  const { title, category, level, description, subject, examBoard, examSource, year } = req.body;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  
  if (!files?.file?.[0]) return res.status(400).json({ error: 'Document file is required' });

  try {
    const docFile = files.file[0];
    const coverFile = files?.cover?.[0] || null;
    const fileHash = computeFileHash(docFile.path);
    
    // Rule-based Duplicate Detection
    // 1. Check for exact file hash (identical content)
    const existingHash = await prisma.document.findUnique({ where: { fileHash } });
    if (existingHash) {
      return res.status(409).json({ error: 'This exact file has already been uploaded.', existingTitle: existingHash.title });
    }

    // 2. Check for same name AND same size (common indicator of same file)
    const sameNameAndSize = await prisma.document.findFirst({
      where: {
        fileName: docFile.originalname,
        fileSize: docFile.size
      }
    });
    if (sameNameAndSize) {
      return res.status(409).json({ error: 'A file with the same name and size already exists in our system.' });
    }

    // 3. Check for exact title match (case insensitive)
    const exactTitle = await prisma.document.findFirst({
      where: {
        title: { equals: title }
      }
    });
    if (exactTitle) {
      return res.status(409).json({ error: 'A document with this exact title already exists.' });
    }

    const document = await prisma.document.create({
      data: {
        title,
        category,
        educationLevel: level,
        abstract: description || `Academic resource: ${title}`,
        filePath: docFile.path,
        coverPath: coverFile ? coverFile.path : null,
        fileName: docFile.originalname,
        fileSize: docFile.size,
        fileHash,
        uploaderId: req.user.id,
        status: 'PENDING',
        subject,
        examBoard,
        examSource,
        year: year ? Number(year) : undefined
      }
    });

    res.status(201).json(document);
  } catch (err: any) {
    console.error('Upload Error:', err);
    res.status(500).json({ error: 'Upload failed due to a server error.' });
  }
});

router.get('/', async (req, res) => {
  const { search, category, level, year, page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {
    status: 'APPROVED',
    AND: []
  };

  if (search) {
    where.AND.push({
      OR: [
        { title: { contains: String(search) } },
        { abstract: { contains: String(search) } },
        { subject: { contains: String(search) } }
      ]
    });
  }

  if (category && category !== 'ALL') where.AND.push({ category: String(category) });
  if (level && level !== 'ALL') where.AND.push({ educationLevel: String(level) });
  if (year) where.AND.push({ year: Number(year) });

  if (where.AND.length === 0) delete where.AND;

  const documents = await prisma.document.findMany({
    where,
    skip,
    take: Number(limit),
    orderBy: { createdAt: 'desc' },
    include: { uploader: { select: { username: true } } }
  });

  res.json(documents);
});

router.get('/:id', async (req, res) => {
  const doc = await prisma.document.update({
    where: { id: Number(req.params.id) },
    data: { views: { increment: 1 } },
    include: { uploader: { select: { username: true } } }
  });
  if (!doc || doc.status !== 'APPROVED') return res.status(404).json({ error: 'Document not found' });
  res.json(doc);
});

router.get('/:id/download', authenticate, async (req: any, res) => {
  const docId = Number(req.params.id);
  const userId = req.user.id;

  const doc = await prisma.document.findUnique({ where: { id: docId } });
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  // 1. Check if user has uploaded >= 5 approved docs
  const userUploads = await prisma.document.count({
    where: { uploaderId: userId, status: 'APPROVED' }
  });

  const canDownload = async () => {
    if (userUploads >= 5) return true;
    const approvedReq = await prisma.downloadRequest.findFirst({
      where: { userId, documentId: docId, status: 'APPROVED' }
    });
    return !!approvedReq;
  };

  if (await canDownload()) {
    await prisma.document.update({
      where: { id: docId },
      data: { downloads: { increment: 1 } }
    });
    return res.download(path.resolve(doc.filePath), doc.fileName);
  }

  res.status(403).json({ 
    error: 'Access denied', 
    uploadsNeeded: 5 - userUploads,
    message: 'Upload more documents or request access from admin.'
  });
});

export default router;
