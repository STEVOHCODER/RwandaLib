import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

router.post('/request', async (req: any, res) => {
  const { documentId, reason, phoneNumber } = req.body;
  try {
    const request = await prisma.downloadRequest.upsert({
      where: {
        userId_documentId: {
          userId: req.user.id,
          documentId: Number(documentId)
        }
      },
      update: {
        reason,
        phoneNumber,
        status: 'PENDING' // Reset to pending if it was rejected/previous
      },
      create: {
        userId: req.user.id,
        documentId: Number(documentId),
        reason,
        phoneNumber,
        status: 'PENDING'
      }
    });
    res.status(201).json(request);
  } catch (err) {
    console.error('Request Error:', err);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

router.get('/requests', async (req: any, res) => {
  const requests = await prisma.downloadRequest.findMany({
    where: { userId: req.user.id },
    include: { document: true }
  });
  res.json(requests);
});

export default router;
