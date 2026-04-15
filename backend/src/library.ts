import { Request, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { prisma } from './index.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

export const upload = multer({ storage });

interface AuthRequest extends Request {
  user?: any;
  file?: any;
}

export const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { title, category } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const fileBuffer = fs.readFileSync(file.path);
    const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
    const fileSize = fileBuffer.length;
    const MIN_SIZE = 1024; // 1KB
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    const allowedExt = ['.pdf', '.docx', '.doc', '.txt', '.epub', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    const fileNameNormalized = file.originalname.trim();

    // Basic size/type validation
    if (fileSize < MIN_SIZE) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'File too small to be a valid document.' });
    }
    if (fileSize > MAX_SIZE) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'File exceeds maximum allowed size (50MB).' });
    }
    if (!allowedExt.includes(ext)) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Unsupported file type. Allowed: pdf, doc, docx, txt, epub, md.' });
    }

    // Check for duplicates (multiple strategies)
    const existingDoc = await prisma.document.findUnique({ where: { fileHash: hash } });
    if (existingDoc) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'This document already exists in the library (identical file).' });
    }

    const duplicateByNameAndSize = await prisma.document.findFirst({ where: { fileName: fileNameNormalized, fileSize } });
    if (duplicateByNameAndSize) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'A document with the same name and size already exists.' });
    }

    const duplicateByTitle = await prisma.document.findFirst({ where: { title } });
    if (duplicateByTitle) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'A document with the same title already exists.' });
    }

    const sameUploaderTitle = await prisma.document.findFirst({ where: { uploaderId: req.user.id, title } });
    if (sameUploaderTitle) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'You have already uploaded a document with this title.' });
    }

    const doc = await prisma.document.create({
      data: {
        title,
        category,
        filePath: file.path,
        fileHash: hash,
        aiScore: aiResult.aiScore,
        aiSummary: aiResult.aiSummary,
        status: req.user.role === 'ADMIN' ? 'APPROVED' : 'PENDING',
        uploaderId: req.user.id,
      },
    });

    // Create a contribution record for this upload (Contribution enforces one-to-one with Document)
    await prisma.contribution.create({
      data: {
        userId: req.user.id,
        documentId: doc.id,
        approved: doc.status === 'APPROVED',
      },
    });

    // If the document was auto-approved (admin upload), grant credits per 5 approved contributions
    if (doc.status === 'APPROVED') {
      const approvedCount = await prisma.contribution.count({
        where: { userId: req.user.id, approved: true },
      });
      if (approvedCount > 0 && approvedCount % 5 === 0) {
        await prisma.user.update({
          where: { id: req.user.id },
          data: { credits: { increment: 1 } },
        });
      }
    }

    res.status(201).json(doc);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getDocuments = async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;
    const docs = await prisma.document.findMany({
      where: {
        status: 'APPROVED',
        ...(category ? { category: String(category) } : {}),
        ...(search ? {
          OR: [
            { title: { contains: String(search) } },
            { aiSummary: { contains: String(search) } },
          ]
        } : {}),
      },

      include: { uploader: { select: { username: true } } },
    });
    res.json(docs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const requestDownload = async (req: AuthRequest, res: Response) => {
  try {
    const { documentId } = req.body;
    const userId = req.user.id;

    // Check if already requested or approved
    const existingRequest = await prisma.downloadRequest.findFirst({
      where: { userId, documentId: Number(documentId) }
    });
    if (existingRequest) {
      return res.status(400).json({ error: 'You have already requested or have access to this document.' });
    }

    // Check if user has enough credits
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user && user.credits <= 0 && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Insufficient credits. Upload 5 approved documents to earn a download credit.' });
    }

    const request = await prisma.downloadRequest.create({
      data: {
        userId,
        documentId: Number(documentId),
      },
    });
    res.status(201).json(request);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const approveDownloadRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.body;
    const request = await prisma.downloadRequest.findUnique({
      where: { id: Number(requestId) },
      include: { user: true },
    });

    if (!request) return res.status(404).json({ error: 'Request not found' });

    await prisma.downloadRequest.update({
      where: { id: Number(requestId) },
      data: { status: 'APPROVED' },
    });

    // Deduct credit from user
    if (request.user.role !== 'ADMIN') {
      await prisma.user.update({
        where: { id: request.userId },
        data: { credits: { decrement: 1 } },
      });
    }

    res.json({ message: 'Request approved and credit deducted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const approveUserDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { documentId } = req.body;
    const doc = await prisma.document.findUnique({ where: { id: Number(documentId) } });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    await prisma.document.update({
      where: { id: Number(documentId) },
      data: { status: 'APPROVED' },
    });

    // Mark contribution for this document as approved
    await prisma.contribution.updateMany({
      where: { documentId: Number(documentId) },
      data: { approved: true },
    });

    // Count user's approved contributions to grant credit
    const approvedCount = await prisma.contribution.count({
      where: { userId: doc.uploaderId, approved: true },
    });

    if (approvedCount > 0 && approvedCount % 5 === 0) {
      await prisma.user.update({
        where: { id: doc.uploaderId },
        data: { credits: { increment: 1 } },
      });
    }

    res.json({ message: 'Document approved' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getPendingDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const docs = await prisma.document.findMany({
      where: { status: 'PENDING' },
      include: { uploader: { select: { username: true } } },
    });
    res.json(docs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getPendingRequests = async (req: AuthRequest, res: Response) => {
  try {
    const requests = await prisma.downloadRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        user: { select: { username: true, credits: true } },
        document: { select: { title: true, category: true } },
      },
    });
    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
