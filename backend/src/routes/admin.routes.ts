import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

router.get('/documents', async (req, res) => {
  const { status = 'PENDING' } = req.query;
  const docs = await prisma.document.findMany({
    where: { status: String(status) as any },
    include: { uploader: { select: { username: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(docs);
});

router.patch('/documents/:id/status', async (req, res) => {
  const { status } = req.body;
  const doc = await prisma.document.update({
    where: { id: Number(req.params.id) },
    data: { status: status as any }
  });

  if (status === 'APPROVED') {
    await prisma.contribution.create({
      data: { userId: doc.uploaderId, documentId: doc.id, approved: true }
    });
  }

  res.json(doc);
});

router.put('/documents/:id', async (req, res) => {
  const { title, category, educationLevel, subject, examBoard, examSource, year } = req.body;
  const doc = await prisma.document.update({
    where: { id: Number(req.params.id) },
    data: {
      title,
      category,
      educationLevel,
      subject,
      examBoard,
      examSource,
      year: year ? Number(year) : undefined
    }
  });
  res.json(doc);
});

router.delete('/documents/:id', async (req, res) => {
  await prisma.document.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
});

router.get('/download-requests', async (req, res) => {
  const status = req.query.status || 'PENDING';
  const requests = await prisma.downloadRequest.findMany({
    where: { status: String(status) as any },
    include: { user: true, document: true }
  });
  res.json(requests);
});

router.patch('/download-requests/:id', async (req, res) => {
  const { status } = req.body;
  const request = await prisma.downloadRequest.update({
    where: { id: Number(req.params.id) },
    data: { status: status as any, reviewedById: (req as any).user.id }
  });
  res.json(request);
});

router.get('/stats', async (req, res) => {
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const weekStart = new Date(new Date().setDate(now.getDate() - 7));
  const monthStart = new Date(new Date().setMonth(now.getMonth() - 1));

  const totalDocs = await prisma.document.count();
  const pendingDocs = await prisma.document.count({ where: { status: 'PENDING' } });
  const totalUsers = await prisma.user.count();
  const pendingRequests = await prisma.downloadRequest.count({ where: { status: 'PENDING' } });
  
  const dailyUploads = await prisma.document.count({ where: { createdAt: { gte: todayStart } } });
  const weeklyUploads = await prisma.document.count({ where: { createdAt: { gte: weekStart } } });
  const monthlyUploads = await prisma.document.count({ where: { createdAt: { gte: monthStart } } });

  // Recent visits (last 30 days)
  const visits = await prisma.visit.findMany({
    take: 30,
    orderBy: { date: 'desc' }
  });

  // Top documents
  const topDocs = await prisma.document.findMany({
    take: 10,
    orderBy: { views: 'desc' },
    select: { id: true, title: true, views: true, downloads: true, category: true }
  });

  res.json({ 
    totalDocs, pendingDocs, totalUsers, pendingRequests, 
    dailyUploads, weeklyUploads, monthlyUploads,
    visits, topDocs 
  });
});

export default router;
