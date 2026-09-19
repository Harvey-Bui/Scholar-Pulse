import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const unreadOnly = req.query.unread === 'true';
  const notifications = await prisma.notification.findMany({
    where: { userId: req.userId, ...(unreadOnly ? { readAt: null } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(notifications);
}));

router.patch('/:id/read', asyncHandler(async (req, res) => {
  const existing = await prisma.notification.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) throw new AppError(404, 'Notification not found');
  const notification = await prisma.notification.update({ where: { id: existing.id }, data: { readAt: new Date() } });
  res.json(notification);
}));

router.post('/read-all', asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.userId, readAt: null }, data: { readAt: new Date() } });
  res.status(204).end();
}));

export default router;
